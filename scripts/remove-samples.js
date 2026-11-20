// Deletes the sample goats (files with `sample: true`) and their photo folders.
// Run with: npm run remove-samples
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const goatsDir = join(root, "goats");
let removed = 0;

for (const file of readdirSync(goatsDir).filter((f) => f.endsWith(".md"))) {
  const path = join(goatsDir, file);
  const { data } = matter(readFileSync(path, "utf8"));
  if (data.sample !== true) continue;
  rmSync(path);
  if (data.id) rmSync(join(root, "images", "goats", data.id), { recursive: true, force: true });
  console.log(`Removed sample goat: ${data.name || file}`);
  removed++;
}

console.log(removed ? `Done. ${removed} sample goat(s) removed.` : "No sample goats found.");
