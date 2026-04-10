require('dotenv').config();
const express  = require('express');
const multer   = require('multer');
const fetch    = require('node-fetch');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const low      = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app     = express();
const PORT    = process.env.PORT || process.env.PORT || 3000;
const VERSION = '13.7.0';

// ── Database (lowdb – pure JS, works on Node 10+) ─────────────────────────────
const adapter = new FileSync(path.join(__dirname, 'ecomhelper.json'));
const db      = low(adapter);
db.defaults({ users: [], sessions: [] }).write();

const hashPwd = p => crypto.createHash('sha256').update(p).digest('hex');
const genId   = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

// Seed admin
if (!db.get('users').find({ email: 'admin@admin.com' }).value()) {
  db.get('users').push({
    id: genId(), email: 'admin@admin.com',
    password: hashPwd('Admin123'), role: 'admin', api_key: '',
    created: new Date().toISOString()
  }).write();
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
function genToken() { return crypto.randomBytes(32).toString('hex'); }
function getUser(req) {
  // Token-based auth
  const token = req.headers['x-auth-token'];
  if (token) {
    try {
      const raw  = fs.readFileSync(path.join(__dirname, 'ecomhelper.json'), 'utf8');
      const data = JSON.parse(raw);
      const sess = (data.sessions || []).find(s => s.token === token);
      if (sess) {
        const user = (data.users || []).find(u => u.id === sess.user_id);
        if (user) return user;
      }
    } catch(e) {}
  }
  // Fallback: x-user-email + x-user-pass header (simple auth)
  const email = req.headers['x-user-email'];
  const pass  = req.headers['x-user-pass'];
  if (email && pass) {
    try {
      const raw  = fs.readFileSync(path.join(__dirname, 'ecomhelper.json'), 'utf8');
      const data = JSON.parse(raw);
      return (data.users || []).find(u => u.email === email && u.password === hashPwd(pass)) || null;
    } catch(e) {}
  }
  return null;
}
function requireAuth(req, res, next) {
  req.user = getUser(req);
  if (!req.user) {
    // Allow if valid api key provided – create temp user context
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey.length > 10) {
      req.user = { id: 'temp', email: 'temp', api_key: apiKey };
      return next();
    }
    return res.status(401).json({ ok: false, error: 'غير مصرح' });
  }
  next();
}

// Debug endpoint
app.get('/api/debug', requireAuth, (req, res) => {
  const fresh = db.get('users').find({ id: req.user.id }).value();
  res.json({
    version: VERSION,
    pid: process.pid,
    user: req.user.email,
    user_id: req.user.id,
    api_key_len: fresh ? (fresh.api_key || '').length : -1,
    api_key_preview: fresh && fresh.api_key ? fresh.api_key.substring(0,8)+'...' : 'EMPTY'
  });
});
function getUserKey(req) {
  // 1. Read from disk file by user email
  const email = req.headers['x-user-email'] || (req.user && req.user.email);
  if (email) {
    try {
      const keyId = crypto.createHash('md5').update(email).digest('hex');
      const keyFile = path.join(__dirname, 'keys', keyId + '.key');
      if (fs.existsSync(keyFile)) {
        const k = fs.readFileSync(keyFile, 'utf8').trim();
        if (k && k.length > 10) return k;
      }
    } catch(e) {}
  }
  // 2. x-api-key header
  const hKey = req.headers['x-api-key'];
  if (hKey && hKey.length > 10) return hKey;
  // 3. FormData body field
  const bKey = req.body && req.body.api_key;
  if (bKey && bKey.length > 10) return bKey;
  // 4. ENV fallback
  const eKey = process.env.GEMINI_API_KEY;
  if (eKey && eKey.length > 10) return eKey;
  throw Object.assign(new Error('NO_KEY'), {});
}

const GEMINI_URL = (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

// ── Multer ────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('images only'))
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));
// Disable caching for API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ── /api/version ──────────────────────────────────────────────────────────────
app.get('/api/version', (_, res) => res.json({ version: VERSION }));

// ── /api/health ───────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ ok: true, version: VERSION, message: 'Server شغال ✅' });
});

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: 'بيانات ناقصة' });
  const user = db.get('users').find({ email: email.toLowerCase().trim() }).value();
  if (!user || user.password !== hashPwd(password)) return res.status(401).json({ ok: false, error: 'بريد أو كلمة مرور غير صحيحة' });
  const token = genToken();
  db.get('sessions').push({ token, user_id: user.id, created: new Date().toISOString() }).write();
  res.json({ ok: true, token, role: user.role, email: user.email });
});

app.post('/api/logout', requireAuth, (req, res) => {
  const token = req.headers['x-auth-token'];
  db.get('sessions').remove({ token: req.headers['x-auth-token'] }).write();
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  const u = req.user;
  res.json({ ok: true, email: u.email, role: u.role, has_key: u.api_key && u.api_key.length > 10 });
});

// ── /api/set-key – per user ────────────────────────────────────────────────────
app.post('/api/set-key', requireAuth, (req, res) => {
  const key = (req.body.key || '').trim();
  if (key.length < 10) return res.status(400).json({ ok: false, error: 'Key قصيرة بزاف' });
  db.get('users').find({ id: req.user.id }).assign({ api_key: key }).write();
  // Save by user ID AND email hash (readable from any process)
  try {
    const keysDir = path.join(__dirname, 'keys');
    if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, {recursive:true});
    fs.writeFileSync(path.join(keysDir, req.user.id + '.key'), key, 'utf8');
    const emailHash = crypto.createHash('md5').update(req.user.email).digest('hex');
    fs.writeFileSync(path.join(keysDir, emailHash + '.key'), key, 'utf8');
  } catch(e) { console.error('[set-key file]', e.message); }
  res.json({ ok: true });
});

// ── Admin: user management ─────────────────────────────────────────────────────
app.get('/api/admin/users', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'غير مصرح' });
  const users = db.get('users').map(u => ({ id:u.id, email:u.email, role:u.role, has_key: u.api_key && u.api_key.length > 10 ? 1 : 0, created:u.created })).value();
  res.json({ ok: true, users });
});

app.post('/api/admin/users', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'غير مصرح' });
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: 'بيانات ناقصة' });
  try {
    if (db.get('users').find({ email: email.toLowerCase().trim() }).value()) throw new Error('exists');
    db.get('users').push({ id: genId(), email: email.toLowerCase().trim(), password: hashPwd(password), role: role||'user', api_key: '', created: new Date().toISOString() }).write();
    res.json({ ok: true });
  } catch(e) {
    res.status(400).json({ ok: false, error: e.message === 'exists' ? 'البريد موجود مسبقاً' : e.message });
  }
});

app.delete('/api/admin/users/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'غير مصرح' });
  if (req.params.id === req.user.id) return res.status(400).json({ ok: false, error: 'ما تقدرش تحذف حسابك' });
  db.get('users').remove({ id: req.params.id }).write();
  db.get('sessions').remove({ user_id: req.params.id }).write();
  res.json({ ok: true });
});

// ── Gemini helper ─────────────────────────────────────────────────────────────
async function callGemini(prompt, imgBuffer = null, imgMime = 'image/jpeg', apiKey = null) {
  const key = (apiKey && apiKey.length > 10) ? apiKey : (process.env.GEMINI_API_KEY || '');
  if (!key || key.length < 10) throw Object.assign(new Error('NO_KEY'), {});

  const parts = [];
  if (imgBuffer) parts.push({ inline_data: { mime_type: imgMime, data: imgBuffer.toString('base64') } });
  parts.push({ text: prompt });

  const res = await fetch(GEMINI_URL(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 2048 }
    })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg  = (body && body.error && body.error.message) || '';
    if (res.status === 429) throw Object.assign(new Error('RATE_LIMIT'), { retryAfter: parseInt(res.headers.get('Retry-After') || '60', 10) || 60 });
    if (msg.includes('API_KEY') || msg.includes('API key')) throw new Error('BAD_KEY');
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || '';
}

function safeJSON(raw) {
  // 1. clean markdown fences
  let txt = raw.replace(/```json|```/g, '').trim();
  // 2. try direct parse
  try { return JSON.parse(txt); } catch(_) {}
  // 3. extract first {...} block (handles trailing garbage)
  const m = txt.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch(_) {}
  // 4. try to close truncated JSON by appending missing braces
  const opens = (txt.match(/\{/g)||[]).length;
  const closes = (txt.match(/\}/g)||[]).length;
  if (opens > closes) {
    // remove trailing incomplete key/value then close
    let fixed = txt.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, '');
    fixed += '}'.repeat(opens - closes);
    try { return JSON.parse(fixed); } catch(_) {}
  }
  return null;
}

function apiError(res, err) {
  if (err.message === 'RATE_LIMIT') return res.status(429).json({ ok: false, error: 'RATE_LIMIT', retryAfter: err.retryAfter || 60 });
  if (err.message === 'BAD_KEY')    return res.status(401).json({ ok: false, error: 'BAD_KEY' });
  if (err.message === 'NO_KEY')     return res.status(401).json({ ok: false, error: 'NO_KEY' });
  return res.status(500).json({ ok: false, error: err.message });
}

// ── /api/analyze ──────────────────────────────────────────────────────────────
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'صورة مطلوبة' });

    const userCtx  = req.body.user_context || '';
    const ctxNote  = userCtx ? `\nSeller info: "${userCtx}"` : '';

    const raw = await callGemini(
      `Analyze this product image.${ctxNote}
Return JSON only, no markdown, no backticks:
{"product_name":"Arabic name","product_description":"1 sentence Arabic","key_features":["f1","f2"],"target_audience":"Arabic","color_palette":"3 hex colors from image: #RRGGBB,#RRGGBB,#RRGGBB","color_description":"3 color names in English e.g: deep navy, white, gold","product_vibe":"one English word","problem_solved":"Arabic","visual_description":"English product description"}`,
      req.file.buffer, req.file.mimetype, getUserKey(req)
    );

    const data = safeJSON(raw);
    if (!data) return res.status(500).json({ ok: false, error: 'فشل parse الـ JSON' });

    // Override colors with canvas-extracted ones (أدق من Gemini)
    const extractedColors = req.body.extracted_colors;
    const extractedDesc   = req.body.extracted_desc;
    if (extractedColors) {
      data.color_palette    = extractedColors;
      data.color_description = extractedDesc || '';
      console.log('[analyze] Canvas colors used:', extractedColors);
    } else {
      console.log('[analyze] Gemini colors used:', data.color_palette);
    }

    res.json({ ok: true, analysis: data });
  } catch (err) { apiError(res, err); }
});

// ── /api/generate-section ────────────────────────────────────────────────────
const SECTION_PROMPTS = {
  hero: (ctx, a) => `Product: ${ctx}
Write Algerian Darija. JSON only, no markdown:
{"badge":"short catchy badge e.g. الأحسن في السوق","headline":"strong 6-8 word headline","subheadline":"one sentence main benefit","design_description":"English: product prominent, dynamic bg, particle effects, colors ${a.color_palette||''}"}`,

  problem: (ctx) => `Product: ${ctx}
Write Algerian Darija. JSON only, no markdown:
{"question":"short question about customer pain","body":"2-3 sentences about the problem","design_description":"English: dark moody area, frustrated person, problem icons"}`,

  solution: (ctx) => `Product: ${ctx}
Write Algerian Darija. JSON only, no markdown:
{"headline":"triumphant 6-8 word solution title","body":"one sentence this product solves the problem","design_description":"English: bright light burst, product glowing triumphant"}`,

  before_after: (ctx) => `Product: ${ctx}
Write Algerian Darija. JSON only, no markdown:
{"headline":"catchy before/after section title in Algerian Darija (example: قبل وبعد، الفرق واضح)","before":"8-10 words describing suffering without product","after":"8-10 words describing happiness with product","design_description_before":"English: dark dull left side showing problem","design_description_after":"English: bright vibrant right side showing happy result"}`,

  feature: (ctx, a) => `Product: ${ctx}
Write Algerian Darija. JSON only, no markdown:
{"headline":"main feature title 6-8 words","body":"2-3 sentences explaining the feature","feature_visual":"English: close-up of ${a.visual_description||'the product'}","design_description":"English: glowing close-up, dramatic lighting"}`,

  comparison: (ctx) => `Product: ${ctx}
Write Algerian Darija. JSON only, no markdown:
{"headline":"why we are better title 6-8 words","our_features":["advantage 1","advantage 2","advantage 3"],"competitor_flaws":["flaw 1","flaw 2"],"design_description":"English: 2-col split, left glowing our product, right dull competitor"}`,

  lifestyle: (ctx) => `Product: ${ctx}
Write Algerian Darija. JSON only, no markdown:
{"headline":"daily life benefit title 6-8 words","body":"2-3 sentences product improves daily life","scene_description":"English: warm lifestyle scene happy person using product"}`,

  social_proof: (ctx) => `Product: ${ctx}
Write Algerian Darija. JSON only, no markdown:
{"review_1":"genuine positive review 20-25 words","reviewer_1":"Algerian first name","review_2":"another positive review different angle 20-25 words","reviewer_2":"another Algerian first name","design_description":"English: 5 golden stars, customer avatars, warm trust atmosphere"}`,

  cta: (ctx) => `Product: ${ctx}
Return ONLY this exact JSON, no changes to the fixed text fields:
{"urgency":"الكمية محدودة بزاف!","button_text":"اطلب الآن - الدفع عند الاستلام","subtext":"توصيل لباب المنزل | الدفع عند الاستلام","design_description":"English: solid high-contrast dark footer section. Product image prominent on right next to CTA. Large white bold text for urgency. HUGE black text on yellow button. Clean professional layout."}`
};

app.post('/api/generate-section', upload.single('image'), async (req, res) => {
  try {
    const { section, productContext } = req.body;
    if (!section || !productContext) return res.status(400).json({ ok: false, error: 'section و productContext مطلوبين' });

    let analysis = {};
    try { analysis = JSON.parse(productContext); } catch (_) {}

    const fn = SECTION_PROMPTS[section];
    if (!fn) return res.status(400).json({ ok: false, error: `section "${section}" غير معروف` });

    const userCtx  = req.body.user_context || '';
    const ctxSuffix = userCtx ? `\nFOCUS ON THESE PRODUCT DETAILS IN ALL COPY: "${userCtx}"` : '';
    const trust     = `\nCTA TRUST ELEMENTS: Always include توصيل لباب المنزل و الدفع عند الاستلام in any CTA or button text.`;
    const prompt    = fn(productContext, analysis) + ctxSuffix + trust;
    const raw  = await callGemini(prompt, null, null, getUserKey(req));
    const data = safeJSON(raw);
    if (!data) return res.status(500).json({ ok: false, error: `فشل parse section ${section}` });

    res.json({ ok: true, section, data });
  } catch (err) { apiError(res, err); }
});

// ── /api/generate-creatives ──────────────────────────────────────────────────
app.post('/api/generate-creatives', upload.none(), async (req, res) => {
  try {
    const { productContext } = req.body;
    if (!productContext) return res.status(400).json({ ok: false, error: 'productContext مطلوب' });
    const userCtx = req.body.user_context || '';
    const ctxNote = userCtx ? `\nExtra product info: "${userCtx}"` : '';

    const prompt = `Product info: ${productContext}${ctxNote}
CTA RULE: All CTA text must include توصيل لباب المنزل | الدفع عند الاستلام.
FOCUS: Build all copy around the product details provided.
Write in Algerian Darija. Return JSON only, no markdown:
{
  "aggressive": {
    "problem_headline": "shocking problem headline max 8 words",
    "problem_body": "2 sentences describing the pain",
    "solution_headline": "triumphant solution headline max 8 words",
    "bg_description": "English: dark dramatic background description",
    "cta": "urgent CTA button text max 6 words"
  },
  "before_after": {
    "before": "10 words describing suffering without product",
    "after": "10 words describing happiness with product",
    "cta": "CTA button text max 6 words"
  },
  "testimonial": {
    "review": "genuine customer review 20-25 words",
    "reviewer": "Algerian first name",
    "cta": "CTA button text max 6 words"
  }
}`;

    const raw  = await callGemini(prompt, null, null, getUserKey(req));
    const data = safeJSON(raw);
    if (!data) return res.status(500).json({ ok: false, error: 'فشل parse الـ JSON' });
    res.json({ ok: true, creatives: data });
  } catch (err) { apiError(res, err); }
});

// ── /api/generate-ads ────────────────────────────────────────────────────────
app.post('/api/generate-ads', upload.none(), async (req, res) => {
  try {
    const { productContext, user_context, angle, generator, scene_duration, structure } = req.body;
    if (!productContext) return res.status(400).json({ ok: false, error: 'productContext مطلوب' });

    const ctx      = user_context || '';
    const dur      = parseInt(scene_duration) || 8;
    const genName  = generator === 'grok' ? 'Grok' : 'Veo 3';
    const struct   = structure || 'aggressive';
    const ctxNote  = ctx ? `\nProduct details: "${ctx}"` : '';

    // Script instructions per structure
    const structScripts = {
      aggressive: {
        hook:         `AGGRESSIVE HOOK (${dur}s): Start with shocking pain/problem. Visceral, urgent. "واش عندك [problem]؟" style. Make viewer feel the EXACT suffering.`,
        problem:      `PROBLEM DEEP (${dur}s): Deepen the emotional pain. "كل يوم تعاني من..." style. Make viewer think "هذا أنا بالضبط".`,
        solution:     `SOLUTION REVEAL (${dur}s): Product as hero. Fast result promise. "اكتشفت [product]..." style. Before/after contrast in words.`,
        social_proof: `TESTIMONIAL (${dur}s): Real customer voice. "جربته وما صدقتش..." style. Authentic, specific result mentioned.`,
        cta:          `CTA + FOMO (${dur}s): Strong urgency. "اطلب دابا قبل ما يخلص..." style. Include: توصيل لباب المنزل | الدفع عند الاستلام.`
      },
      clean: {
        hook:         `WARM HOOK (${dur}s): Aspirational opening. Show the DESIRED life. "تخيل راسك..." style. Positive and inviting.`,
        problem:      `GENTLE PROBLEM (${dur}s): Soft acknowledgment. "كثير ناس يعانيو من..." style. Empathetic not shocking.`,
        solution:     `SOLUTION (${dur}s): Product as natural choice. "الحل بسيط مع [product]..." style. Warm and reassuring.`,
        social_proof: `TESTIMONIAL (${dur}s): Happy customer sharing experience warmly. "من بعد ما جربت..." style.`,
        cta:          `SOFT CTA (${dur}s): Inviting not pressuring. "جرب اليوم واحس بالفرق..." style. Include: توصيل لباب المنزل | الدفع عند الاستلام.`
      },
      health: {
        hook:         `FATIGUE HOOK (${dur}s): Show low energy/domestic problem. Man exhausted, partner unimpressed. "تعبت؟ ما عندكش نشاط؟" style. Relatable daily struggle.`,
        problem:      `DESIRE PROBLEM (${dur}s): Consequences of low energy – lost confidence, missed moments. "كيفاش تحس كي ما تقدرش تكون في مستواك؟" style. Then flash of aspiration – strong men, athletic feats.`,
        solution:     `VITALITY SOLUTION (${dur}s): Fitness collage energy. Strength, pool emergence, flexing, confidence. "[Product] يرجعلك الطاقة والقوة..." style. High energy, masculine.`,
        social_proof: `AUTHENTIC PROOF (${dur}s): Real man casually taking product, immediate satisfaction. Old man drinking and energetically dancing. "جربته وحسيت بالفرق من أول يوم..." style.`,
        cta:          `BOLD CTA (${dur}s): "اطلب الآن" energy. Strong masculine closing. Product as secret weapon. Include: توصيل لباب المنزل | الدفع عند الاستلام.`
      },
      ugc: {
        hook:         `UGC OATH HOOK (${dur}s): Voice only, no face shown. Hand holds product with Quran visible behind. "والله العظيم وبالكتاب الكريم اللي قدامي، هذا العلاج نافع بإذن الله..." style. Start with the Islamic oath immediately. Introduce the product name and what it treats.`,
        problem:      `UGC SUFFERING (${dur}s): Voice only over same hand+product+Quran visual. "كنت نعاني من [problem]، جربت كل حاجة وما لقيتش حل..." style. Specific painful symptoms described. Emotional, sincere voice. Name specific areas/symptoms from product details.`,
        solution:     `UGC RESULT (${dur}s): Voice only, same visual setup. "من بعد ما استعملت [product] شفت فرق كبير..." style. Describe specific improvements. "والله ما صدقتش النتيجة" style. Better than medical treatments mentioned.`,
        social_proof: `UGC STRONG OATH (${dur}s): The most powerful moment. Voice only. "والله العظيم، والكتاب الكريم اللي قدامي، هذا أحسن من [laser/doctor/other treatments]..." style. Swear it works permanently. Emotional gratitude. "جزاكم الله خيراً" style ending.`,
        cta:          `UGC SINCERE RECOMMENDATION (${dur}s): Voice only, same hand+product+Quran visual. "ننصح بيه لكل واحد عنده [problem]..." style. Direct sincere recommendation. End: اطلب دابا | الدفع عند الاستلام | توصيل لباب المنزل. Final: "بإذن الله ما تندمش".`
      }
    };

    const sc = structScripts[struct] || structScripts.aggressive;

    const prompt = `You are an expert video ad scriptwriter for Algerian COD e-commerce.
Product: ${productContext}${ctxNote}
Angle: ${angle || 'pain'}
Generator: ${genName} (${dur}s per scene)
Structure style: ${struct}

LANGUAGE RULE – ABSOLUTE: All "script" fields MUST be written in Algerian Darija (Arabic dialect of Algeria) ONLY. Never use Modern Standard Arabic (فصحى), never use English, never use French. Pure Algerian spoken dialect as used in Algerian video ads. Examples of Algerian Darija words: "واش", "راك", "كاين", "ماشي", "دابا", "بزاف", "خاصك", "بصح", "ولا", "كيما", "هكذا نتاع", "عندي", "نتاع".

SCENE INSTRUCTIONS:
- hook scene: ${sc.hook}
- problem scene: ${sc.problem}
- solution scene: ${sc.solution}
- social_proof scene: ${sc.social_proof}
- cta scene: ${sc.cta}

Write 5 Algerian Darija scripts matching the structure style above.
Return ONLY valid JSON, no markdown, no backticks, no extra text:
{"hook":{"script":"darija script here","visual":"english visual description","problem_shown":"english what is shown"},"problem":{"script":"darija script here","visual":"english visual description","problem_shown":"english what is shown"},"solution":{"script":"darija script here","visual":"english visual description","problem_shown":"english what is shown"},"social_proof":{"script":"darija script here","visual":"english visual description","problem_shown":"english what is shown"},"cta":{"script":"darija script here","visual":"english visual description","problem_shown":"english urgency shown"}}`;

    const apiKey = getUserKey(req);
    const adsSchema = {
      type: "object",
      properties: {
        hook:         { type: "object", properties: { script:{type:"string"}, visual:{type:"string"}, problem_shown:{type:"string"} }, required:["script","visual"] },
        problem:      { type: "object", properties: { script:{type:"string"}, visual:{type:"string"}, problem_shown:{type:"string"} }, required:["script","visual"] },
        solution:     { type: "object", properties: { script:{type:"string"}, visual:{type:"string"}, problem_shown:{type:"string"} }, required:["script","visual"] },
        social_proof: { type: "object", properties: { script:{type:"string"}, visual:{type:"string"}, problem_shown:{type:"string"} }, required:["script","visual"] },
        cta:          { type: "object", properties: { script:{type:"string"}, visual:{type:"string"}, problem_shown:{type:"string"} }, required:["script","visual"] }
      },
      required: ["hook","problem","solution","social_proof","cta"]
    };

    let data = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const GEMINI_JSON_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
        const response = await fetch(GEMINI_JSON_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 3000,
              responseMimeType: 'application/json',
              responseSchema: adsSchema
            }
          })
        });
        const d = await response.json();
        if (d.error) throw new Error(d.error.message);
        const raw = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(raw);
        if (parsed && parsed.hook) { data = parsed; break; }
      } catch(e) { console.log('[generate-ads] attempt ' + attempt + ':', e.message); }
    }

    if (!data) return res.status(500).json({ ok: false, error: 'فشل parse الـ JSON' });
    res.json({ ok: true, scenes: data });
  } catch (err) { apiError(res, err); }
});

// ── /api/generate-copies ─────────────────────────────────────────────────────
app.post('/api/generate-copies', upload.none(), async (req, res) => {
  try {
    const { platform, angle, user_context, copy_types } = req.body;
    const ctx   = user_context || '';
    const plat  = platform === 'tt' ? 'TikTok' : 'Facebook';
    const types = (copy_types || '').split(',').filter(Boolean);
    if (!types.length) return res.status(400).json({ ok: false, error: 'copy_types مطلوب' });

    const ctxNote = ctx ? `\nProduct details (FOCUS ON THESE): "${ctx}"` : '';
    const angleObj = { pain:'Pain/Suffering', fear:'Fear of consequences', fast_result:'Fast results', curiosity:'Curiosity/Mystery', luxury:'Luxury/Premium', social:'Social Proof', urgency:'Urgency/FOMO', natural:'Natural/Safe' };
    const angleStr = angleObj[angle] || angle;

    const platRules = platform === 'tt'
      ? 'TikTok style: SHORT punchy text max 150 chars per copy. Fast hooks. Use 3-5 relevant hashtags at end. No long paragraphs.'
      : 'Facebook style: Long emotional storytelling 400-800 chars. Heavy emojis (🚨😰💣✨⚠️🔥). Paragraphs with line breaks. No hashtags.';

    const typePrompts = {
      pain_story:   'Write a PAIN STORY copy. Start with the suffering, make it visceral and relatable. The reader must feel: "this is exactly me."',
      fear_hook:    'Write a FEAR copy. Focus on consequences of NOT acting. What gets worse? What is at stake? Create controlled fear.',
      fast_result:  'Write a FAST RESULT copy. Lead with the transformation and speed. Before→After. Days not months. Instant relief.',
      curiosity:    'Write a CURIOSITY copy. Start with a surprising/counterintuitive hook. "Most people don\'t know that..." style.',
      social_proof: 'Write a SOCIAL PROOF copy. Many people already solved this. Numbers, testimonials, community. FOMO of being left out.'
    };

    const requestedTypes = types.filter(t => typePrompts[t]);
    const styleNote = platform === 'fb' ? '(Facebook long emotional style)' : '(TikTok short punchy style)';
    const fieldsArr = requestedTypes.map(t => {
      const desc = (typePrompts[t] || '').replace(/"/g, "'");
      return '  "' + t + '": "' + desc + ' Write in Algerian Darija. ' + styleNote + '. CTA must include: توصيل لباب المنزل | الدفع عند الاستلام."';
    });
    const prompt = 'You are an Algerian ad copywriter.' + ctxNote + '\n'
      + 'Platform: ' + plat + '\n'
      + 'Style: ' + platRules + '\n'
      + 'Angle: ' + angleStr + '\n'
      + 'TRUST: Always include توصيل لباب المنزل | الدفع عند الاستلام in CTA.\n\n'
      + 'Write these ad copies in Algerian Darija. Return JSON only, no markdown:\n{\n'
      + fieldsArr.join(',\n') + '\n}';

    // Build responseSchema from requestedTypes
    const copyProps = {};
    requestedTypes.forEach(t => { copyProps[t] = { type: 'string' }; });
    const copiesSchema = { type: 'object', properties: copyProps, required: requestedTypes };

    let data = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const apiKey = getUserKey(req);
        const GEMINI_JSON_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
        const response = await fetch(GEMINI_JSON_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 4000,
              responseMimeType: 'application/json',
              responseSchema: copiesSchema
            }
          })
        });
        const d = await response.json();
        if (d.error) throw new Error(d.error.message);
        const raw = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(raw);
        if (parsed && Object.keys(parsed).length) { data = parsed; break; }
      } catch(e) { console.log('[generate-copies] attempt ' + attempt + ':', e.message); }
    }
    if (!data) return res.status(500).json({ ok: false, error: 'فشل parse الـ JSON' });
    res.json({ ok: true, copies: data });
  } catch (err) { apiError(res, err); }
});

// ── /api/expert-chat ─────────────────────────────────────────────────────────
app.post('/api/expert-chat', async (req, res) => {
  try {
    const { messages, system, image } = req.body;
    if (!messages || !messages.length) return res.status(400).json({ ok: false, error: 'messages مطلوبة' });

    const history = messages.map(m => (m.role === 'user' ? 'User' : 'Expert') + ': ' + m.content).join('\n\n');
    const prompt = system + '\n\nConversation history:\n' + history + '\n\nNow respond in Algerian Darija:';

    // If image provided, send with image
    let raw;
    if (image) {
      const imgBuffer = Buffer.from(image, 'base64');
      raw = await callGemini(prompt, imgBuffer, 'image/jpeg', getUserKey(req));
    } else {
      raw = await callGemini(prompt, null, null, getUserKey(req));
    }

    if (!raw) return res.status(500).json({ ok: false, error: 'فشل التوليد' });
    res.json({ ok: true, reply: raw.trim() });
  } catch (err) { apiError(res, err); }
});

// ── /api/find-products ───────────────────────────────────────────────────────
app.post('/api/find-products', async (req, res) => {
  try {
    const apiKey = getUserKey(req);
    if (!apiKey || apiKey.length < 10) throw Object.assign(new Error('NO_KEY'), {});

    const responseSchema = {
      type: "object",
      properties: {
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_name:        { type: "string" },
              product_type:        { type: "string" },
              problem_solved:      { type: "string" },
              target_audience:     { type: "string" },
              price_range_dzd:     { type: "string" },
              pain_level:          { type: "number" },
              embarrassment_level: { type: "number" },
              why_it_sells:        { type: "string" },
              angles:   { type: "array", items: { type: "string" } },
              hooks:    { type: "array", items: { type: "string" } },
              decision:     { type: "string" },
              search_query: { type: "string" }
            },
            required: ["product_name","problem_solved","why_it_sells","decision"]
          }
        }
      },
      required: ["products"]
    };

    const userPrompt = "Generate 6 winning health products for Algeria COD market. Focus on embarrassing health problems with fast results (HPV, obesity, hair loss, vitality, joint pain). All fields EXCEPT search_query must be in Algerian Darija. search_query in English. Return valid JSON only.";

    const GEMINI_JSON_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

    let finalData = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(GEMINI_JSON_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json',
              responseSchema: responseSchema
            }
          })
        });
        const data = await response.json();
        console.log('[find-products] status:', response.status);
        if (data.error) throw new Error(data.error.message);
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('[find-products] raw:', raw.substring(0,300));
        const parsed = JSON.parse(raw);
        if (parsed.products) finalData = parsed.products;
        else if (Array.isArray(parsed)) finalData = parsed;
        if (finalData) break;
      } catch(e) { console.log('[find-products] attempt ' + attempt + ' error:', e.message); }
    }

    if (!finalData) return res.status(500).json({ ok: false, error: 'فشل parse الـ JSON - جرب مرة أخرى' });
    res.json({ ok: true, products: finalData });
  } catch(err) { apiError(res, err); }
});


// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🌟 EcomHelper v${VERSION}`);
  console.log(`📡 http://localhost:${PORT} (pid: ${process.pid})`);
  console.log(`🔑 Key from .env: ${process.env.GEMINI_API_KEY ? '✅ loaded' : '⚠️  empty (set from UI)'}\n`);
});
server.setTimeout(120000);
