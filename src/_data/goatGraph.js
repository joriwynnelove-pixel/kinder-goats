// Loads every goat file in src/goats/ and builds the family graph.
// The relationship logic itself lives in lib/goatGraph.js (with tests).
// Templates use it as `goatGraph.goats[id]`.

import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { buildGoatGraph } from "../../lib/goatGraph.js";
import { readSettings } from "../../lib/settings.js";

const goatsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "goats");

/** First sentence of the description, as plain text, for parent cards. */
function blurbFrom(markdown) {
  const text = markdown
    .replace(/<[^>]+>/g, " ") // HTML tags (the web editor may save some)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> their text
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = text.match(/^.*?[.!?](?=\s|$)/);
  const first = sentence ? sentence[0] : text;
  return first.length > 140 ? first.slice(0, 137).trimEnd() + "…" : first;
}

export default function () {
  const { show_samples } = readSettings();
  const files = readdirSync(goatsDir).filter((f) => f.endsWith(".md"));
  const goats = files
    .map((file) => {
      const { data, content } = matter(readFileSync(join(goatsDir, file), "utf8"));
      // Goats added in the web editor have no id; their file name is the id.
      const id = data.id || file.replace(/\.md$/, "");
      return { ...data, id, _file: `goats/${file}`, blurb: blurbFrom(content) };
    })
    // Sample goats are hidden when "Show sample goats" is off in Farm settings
    .filter((g) => show_samples !== false || g.sample !== true);

  const graph = buildGoatGraph(goats);
  for (const warning of graph.warnings) {
    console.warn(`[goats] ${warning}`);
  }
  return graph;
}
