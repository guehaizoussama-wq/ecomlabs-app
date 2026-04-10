import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const workbookXmlDir = path.join(ROOT, "_sources", "wilayas", "xml");
const outputDir = path.join(ROOT, "supabase", "seed-data");
const wilayaNameOverrides = {
  "01": "Adrar",
  "02": "Chlef",
  "03": "Laghouat",
  "04": "Oum El Bouaghi",
  "05": "Batna",
  "06": "Bejaia",
  "07": "Biskra",
  "08": "Bechar",
  "09": "Blida",
  "10": "Bouira",
  "11": "Tamanrasset",
  "12": "Tebessa",
  "13": "Tlemcen",
  "14": "Tiaret",
  "15": "Tizi Ouzou",
  "16": "Alger",
  "17": "Djelfa",
  "18": "Jijel",
  "19": "Setif",
  "20": "Saida",
  "21": "Skikda",
  "22": "Sidi Bel Abbes",
  "23": "Annaba",
  "24": "Guelma",
  "25": "Constantine",
  "26": "Medea",
  "27": "Mostaganem",
  "28": "M'Sila",
  "29": "Mascara",
  "30": "Ouargla",
  "31": "Oran",
  "32": "El Bayadh",
  "33": "Illizi",
  "34": "Bordj Bou Arreridj",
  "35": "Boumerdes",
  "36": "El Tarf",
  "37": "Tindouf",
  "38": "Tissemsilt",
  "39": "El Oued",
  "40": "Khenchela",
  "41": "Souk Ahras",
  "42": "Tipaza",
  "43": "Mila",
  "44": "Ain Defla",
  "45": "Naama",
  "46": "Ain Temouchent",
  "47": "Ghardaia",
  "48": "Relizane",
  "49": "Timimoun",
  "50": "Bordj Badji Mokhtar",
  "51": "Ouled Djellal",
  "52": "Beni Abbes",
  "53": "In Salah",
  "54": "In Guezzam",
  "55": "Touggourt",
  "56": "Djanet",
  "57": "El M'Ghair",
  "58": "El Menia"
};

const sharedStringsRaw = fs.readFileSync(
  path.join(workbookXmlDir, "xl", "sharedStrings.xml"),
  "utf8"
);
const sheet1Raw = fs.readFileSync(
  path.join(workbookXmlDir, "xl", "worksheets", "sheet1.xml"),
  "utf8"
);
const sheet2Raw = fs.readFileSync(
  path.join(workbookXmlDir, "xl", "worksheets", "sheet2.xml"),
  "utf8"
);

function decodeWorkbookText(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function latin1ToUtf8(value) {
  return Buffer.from(value, "latin1").toString("utf8");
}

function normalizeLocationName(value) {
  return latin1ToUtf8(decodeWorkbookText(value))
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9'()\- ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const sharedStrings = [...sharedStringsRaw.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) =>
  normalizeLocationName(match[1])
);

function getCellValue(cellXml) {
  const isSharedString = /t="s"/.test(cellXml);
  const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
  if (!valueMatch) {
    return "";
  }
  const rawValue = valueMatch[1];
  if (isSharedString) {
    return sharedStrings[Number(rawValue)] ?? "";
  }
  return rawValue.trim();
}

function extractRows(sheetXml) {
  return [...sheetXml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map(
    ([, rowNumber, rowXml]) => {
      const cells = [...rowXml.matchAll(/<c[^>]*r="([A-Z]+)\d+"[^>]*>[\s\S]*?<\/c>/g)].reduce(
        (acc, [cellXml, columnRef]) => {
          acc[columnRef] = getCellValue(cellXml);
          return acc;
        },
        {}
      );

      return {
        rowNumber: Number(rowNumber),
        cells
      };
    }
  );
}

const wilayaRows = extractRows(sheet2Raw).slice(1);
const communeRows = extractRows(sheet1Raw).slice(1);

const wilayas = wilayaRows
  .map(({ cells }) => ({
    code: String(cells.A ?? "").padStart(2, "0"),
    name: wilayaNameOverrides[String(cells.A ?? "").padStart(2, "0")] ?? String(cells.B ?? "").trim(),
    source_name: String(cells.B ?? "").trim()
  }))
  .filter((entry) => entry.code && entry.name);

const wilayaCodeByName = new Map(
  wilayas.flatMap((entry) => [
    [entry.name.toLowerCase(), entry.code],
    [entry.source_name.toLowerCase(), entry.code]
  ])
);

const communes = communeRows
  .map(({ cells }) => {
    const communeName = String(cells.A ?? "").trim();
    const wilayaName = String(cells.B ?? "").trim();
    const wilayaCode = wilayaCodeByName.get(wilayaName.toLowerCase()) ?? null;

    return {
      name: communeName,
      wilaya_name: wilayaName,
      wilaya_code: wilayaCode
    };
  })
  .filter((entry) => entry.name && entry.wilaya_name && entry.wilaya_code);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "wilayas.json"),
  `${JSON.stringify(wilayas.map(({ source_name, ...rest }) => rest), null, 2)}\n`
);
fs.writeFileSync(path.join(outputDir, "communes.json"), `${JSON.stringify(communes, null, 2)}\n`);

console.log(`Extracted ${wilayas.length} wilayas and ${communes.length} communes.`);
