// Reads the farm settings (src/_data/site.json, edited in the web editor) and
// works out values that depend on where the site is being built.

import { readFileSync } from "node:fs";

export function readSettings() {
  return JSON.parse(readFileSync("src/_data/site.json", "utf8"));
}

/**
 * The site's public address with no trailing slash, e.g.
 * "https://yourname.github.io/herd". Taken from the `url` setting if filled
 * in; otherwise from the GitHub Pages build (SITE_URL, set automatically by
 * .github/workflows/deploy.yml); otherwise, when previewing on this computer,
 * the local address. Blank if none of those apply.
 */
export function siteUrl(settings = readSettings(), runMode = process.env.ELEVENTY_RUN_MODE) {
  const fromSettings = String(settings.url || "").trim();
  const fromBuild = String(process.env.SITE_URL || "").trim();
  const url = fromSettings || fromBuild || (runMode === "serve" ? "http://localhost:8080" : "");
  return url.replace(/\/+$/, "");
}

/** "https://example.com/herd" -> "https://example.com/" (for the RSS feed). */
export function siteOrigin(url) {
  try {
    return new URL(url).origin + "/";
  } catch {
    return "";
  }
}
