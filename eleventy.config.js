// Eleventy configuration. Content lives in src/, the built site goes to _site/.

import { HtmlBasePlugin, RenderPlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { IMAGE_OPTIONS } from "./lib/images.js";
import { videoInfo, socialEmbed } from "./lib/embeds.js";
import { goatIdFrom } from "./lib/goatGraph.js";
import { readSettings, siteUrl, siteOrigin } from "./lib/settings.js";
import { convertAllHeic, photoUrl } from "./lib/heic.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Accept a Date or "YYYY-MM-DD" text; return a Date (UTC) or null. */
function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human age between two dates, e.g. "2 years, 8 months", "5 months", "3 weeks". */
function ageBetween(from, to) {
  const start = toDate(from);
  const end = toDate(to) || new Date();
  if (!start || end < start) return "";
  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  if (months < 1) {
    const weeks = Math.floor((end - start) / (7 * 24 * 3600 * 1000));
    return weeks <= 1 ? "1 week" : `${weeks} weeks`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years ? `${years} year${years > 1 ? "s" : ""}` : "";
  const m = rest ? `${rest} month${rest > 1 ? "s" : ""}` : "";
  return [y, m].filter(Boolean).join(", ");
}

const STATUS_LABELS = {
  "for-sale": "For Sale",
  reserved: "Reserved",
  retained: "Retained",
  sold: "Sold",
  deceased: "In memory",
  reference: "Reference",
};

export default function (eleventyConfig) {
  // Photos and documents are copied as-is, except iPhone HEIC originals:
  // browsers can't show them, so pages use the JPEG copies in _converted/.
  eleventyConfig.addPassthroughCopy("src/images", {
    filter: (path) => !/\.(heic|heif)$/i.test(path) && !path.endsWith(".fingerprints.json"),
  });
  // The JPEG copies are written by the build itself; don't rebuild because of them
  eleventyConfig.watchIgnores.add("src/images/_converted/**");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addWatchTarget("lib/");

  // Every local <img> on the site (cards, parents, report thumbnails) is
  // resized and compressed automatically. Gallery photos are made in
  // src/goats/goats.11tydata.js and marked `eleventy:ignore`.
  // (No outputDir/urlPath here: the plugin then writes to <output folder>/img/
  // and links to /img/, matching lib/images.js.)
  const { outputDir, urlPath, ...transformOptions } = IMAGE_OPTIONS;
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    ...transformOptions,
    htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async" } },
  });

  // Links work whether the site lives at the top of a domain or in a
  // sub-folder (GitHub Pages often uses https://name.github.io/repo/).
  // The deploy workflow passes the sub-folder with --pathprefix.
  eleventyConfig.addPlugin(HtmlBasePlugin);
  // Lets templates render Markdown typed into the web editor: {{ text | renderContent("md") }}
  eleventyConfig.addPlugin(RenderPlugin);

  const settings = readSettings();
  const url = siteUrl(settings);
  eleventyConfig.addGlobalData("siteUrl", () => siteUrl());

  // Blog feed (RSS/Atom) at /blog/feed.xml, only when the blog is switched on
  if (settings.blog_enabled !== false) {
    eleventyConfig.addPlugin(feedPlugin, {
      type: "atom",
      outputPath: "/blog/feed.xml",
      collection: { name: "posts", limit: 20 },
      metadata: {
        language: "en",
        title: `${settings.farm_name} blog`,
        subtitle: settings.tagline || "",
        base: siteOrigin(url) || "https://example.com/",
        author: { name: settings.farm_name },
      },
    });
  }

  // Turn any iPhone (HEIC) photos into JPEGs before anything else runs
  eleventyConfig.on("eleventy.before", async () => {
    await convertAllHeic();
  });

  // Remind the owner when the site address can't be worked out (share
  // previews and sale-sheet QR codes need it). On GitHub it's automatic.
  eleventyConfig.on("eleventy.before", ({ runMode }) => {
    if (!siteUrl(readSettings(), runMode) && runMode === "build") {
      console.warn(
        "[site] No site address yet, so share previews and sale-sheet QR codes are left out. It's filled in automatically on GitHub, or set it under Farm settings."
      );
    }
  });

  // "Mar 14, 2023"
  eleventyConfig.addFilter("readableDate", (value) => {
    const d = toDate(value);
    return d ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}` : "";
  });
  eleventyConfig.addFilter("year", (value) => {
    const d = toDate(value);
    return d ? d.getUTCFullYear() : "";
  });
  // Age today, or age on a given date (for photo captions)
  eleventyConfig.addFilter("age", (birth) => ageBetween(birth));
  eleventyConfig.addFilter("ageAt", (birth, when) => ageBetween(birth, when));
  eleventyConfig.addFilter("statusLabel", (status) => STATUS_LABELS[status] || "");
  eleventyConfig.addFilter("isoDate", (value) => {
    const d = toDate(value);
    return d ? d.toISOString().slice(0, 10) : "";
  });
  // A "kid" is under a year old. Worked out at build time; js/herd-filter.js
  // re-checks in the browser so it stays right if the site isn't rebuilt.
  eleventyConfig.addFilter("isKid", (birth) => {
    const d = toDate(birth);
    if (!d) return false;
    const yearAgo = new Date();
    yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
    return d > yearAgo;
  });
  eleventyConfig.addFilter("endsWith", (text, ending) => String(text || "").endsWith(ending));
  // "Clover" -> "Clover’s", "Moses" -> "Moses’"
  eleventyConfig.addFilter("possessive", (name) => {
    const n = String(name || "");
    return /s$/i.test(n) ? `${n}’` : `${n}’s`;
  });
  eleventyConfig.addFilter("videoInfo", videoInfo);
  eleventyConfig.addFilter("socialEmbed", socialEmbed);
  // Any uploaded photo path -> one browsers can show (HEIC -> converted JPEG)
  eleventyConfig.addFilter("photoUrl", photoUrl);
  // A dam/sire/goat link from the web editor ("src/goats/ls-clover.md") -> "ls-clover"
  eleventyConfig.addFilter("goatId", goatIdFrom);
  // Blog posts that mention a goat (newest first)
  eleventyConfig.addFilter("postsAboutGoat", (posts, id) =>
    (posts || []).filter((p) => (p.data.goats || []).map(goatIdFrom).includes(id)).reverse()
  );
  // Every topic tag used on the blog, A-Z
  eleventyConfig.addFilter("allTopics", (posts) =>
    [...new Set((posts || []).flatMap((p) => p.data.topics || []))].sort((a, b) => a.localeCompare(b))
  );
  eleventyConfig.addFilter("withTopic", (posts, topic) =>
    (posts || []).filter((p) => (p.data.topics || []).includes(topic)).reverse()
  );
  eleventyConfig.addFilter("slug", (text) =>
    String(text || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );
  eleventyConfig.addFilter("visibleBreedings", (list, showSamples) =>
    (Array.isArray(list) ? list : []).filter((b) => b && !(b.sample === true && showSamples === false))
  );
  // Every blog topic, for the /blog/topics/<topic>/ pages
  eleventyConfig.addCollection("topicList", (api) =>
    [...new Set(api.getFilteredByTag("posts").flatMap((p) => p.data.topics || []))].sort()
  );
  eleventyConfig.addFilter("hasItems", (list) => Array.isArray(list) && list.some(Boolean));

  // Herd page order: does, bucks, wethers; then by name.
  eleventyConfig.addFilter("herdOrder", (goats) => {
    const rank = { doe: 0, buck: 1, wether: 2 };
    return [...goats].sort(
      (a, b) => (rank[a.sex] ?? 3) - (rank[b.sex] ?? 3) || a.name.localeCompare(b.name)
    );
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
