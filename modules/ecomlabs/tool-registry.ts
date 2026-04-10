export type EcomLabsToolDefinition = {
  key: string;
  label: string;
  description: string;
  sourceRoute: string;
  outputShape: string[];
  promptNotes: string[];
};

export const ecomLabsTools: EcomLabsToolDefinition[] = [
  {
    key: "hook-generator",
    label: "Hook Generator",
    description: "Generates landing section hooks such as hero, problem, solution, before/after, and CTA blocks.",
    sourceRoute: "/api/generate-section",
    outputShape: ["headline", "subheadline", "question", "urgency", "design_description"],
    promptNotes: [
      "Uses Algerian Darija output rules from the legacy EcomLabs archive.",
      "Preserves structured JSON contract for section rendering."
    ]
  },
  {
    key: "ad-copy-generator",
    label: "Ad Copy Generator",
    description: "Builds social ad copy variants for pain, fear, curiosity, fast-result, and social-proof angles.",
    sourceRoute: "/api/generate-copies",
    outputShape: ["pain_story", "fear_hook", "fast_result", "curiosity", "social_proof"],
    promptNotes: [
      "Supports Facebook and TikTok tone variants derived from the uploaded archive.",
      "Keeps trust CTA rules for COD Algeria offers."
    ]
  },
  {
    key: "offer-builder",
    label: "Offer Builder",
    description: "Composes commercial offers by combining pain, promise, urgency, and proof.",
    sourceRoute: "/api/ecomlabs/generate",
    outputShape: ["offer_name", "promise", "bonuses", "urgency", "cta"],
    promptNotes: ["Rebuilt as a native module using the old product-context style prompts."]
  },
  {
    key: "landing-page-helper",
    label: "Landing Page Helper",
    description: "Produces section-level landing page copy and creative guidance for product pages.",
    sourceRoute: "/api/generate-creatives",
    outputShape: ["aggressive", "before_after", "reviews", "cta"],
    promptNotes: ["Uses structured JSON section bundles inspired by the legacy generator."]
  },
  {
    key: "creative-angle-generator",
    label: "Creative Angle Generator",
    description: "Suggests campaign angles, pain-based narratives, and positioning directions.",
    sourceRoute: "/api/ecomlabs/generate",
    outputShape: ["angles", "hooks", "why_it_sells"],
    promptNotes: ["Inspired by the product-finding and angle-generation patterns in the uploaded archive."]
  },
  {
    key: "video-ad-scripts",
    label: "Video Ad Scripts",
    description: "Generates five-scene Darija video scripts with visual instructions and CTA scenes.",
    sourceRoute: "/api/generate-ads",
    outputShape: ["hook", "problem", "solution", "social_proof", "cta"],
    promptNotes: [
      "Preserves the aggressive, clean, health, and UGC structures from the legacy EcomLabs app.",
      "Rebuilt on a provider-agnostic AI service layer."
    ]
  },
  {
    key: "product-finder",
    label: "Product Finder",
    description: "Suggests COD-ready product opportunities for Algeria with problem, audience, and selling angles.",
    sourceRoute: "/api/find-products",
    outputShape: ["products", "search_query", "hooks", "decision"],
    promptNotes: ["Migrates the archive's product-finder flow into tenant-owned prompt history."]
  }
];
