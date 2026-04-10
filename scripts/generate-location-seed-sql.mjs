import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const seedDataDir = path.join(ROOT, "supabase", "seed-data");
const outputFile = path.join(ROOT, "supabase", "seed-locations.sql");

const wilayas = JSON.parse(fs.readFileSync(path.join(seedDataDir, "wilayas.json"), "utf8"));
const communes = JSON.parse(fs.readFileSync(path.join(seedDataDir, "communes.json"), "utf8"));

const escapeSql = (value) => String(value).replace(/'/g, "''");

const wilayaInsert = [
  "insert into public.wilayas (code, name)",
  "values",
  wilayas.map((entry) => `  ('${escapeSql(entry.code)}', '${escapeSql(entry.name)}')`).join(",\n"),
  "on conflict (code) do update set name = excluded.name;",
  ""
].join("\n");

const communeInsert = [
  "insert into public.communes (wilaya_id, name)",
  "select w.id, v.name",
  "from (values",
  communes
    .map((entry) => `  ('${escapeSql(entry.wilaya_code)}', '${escapeSql(entry.name)}')`)
    .join(",\n"),
  ") as v(wilaya_code, name)",
  "join public.wilayas w on w.code = v.wilaya_code",
  "on conflict (wilaya_id, name) do nothing;",
  ""
].join("\n");

fs.writeFileSync(outputFile, `${wilayaInsert}\n${communeInsert}`);
console.log(`Generated ${outputFile}`);
