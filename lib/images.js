// Photo processing with Eleventy Image.
// Turns each uploaded photo (often a large phone photo) into small, fast WebP
// and JPEG copies in a few widths, so phones download only what they need.
// The same settings are used by the automatic <img> transform in
// eleventy.config.js, so each photo is only processed once.

import Image from "@11ty/eleventy-img";
import { join } from "node:path";
import { photoUrl } from "./heic.js";

export const IMAGE_OPTIONS = {
  widths: [400, 800, 1600],
  formats: ["webp", "jpeg"],
  outputDir: "_site/img/",
  urlPath: "/img/",
  fixOrientation: true, // phone photos taken sideways come out upright
  sharpJpegOptions: { quality: 78, progressive: true },
  sharpWebpOptions: { quality: 75 },
};

/** Turn a site path like "/images/goats/x/a.jpg" into a file path under src/. */
export function sourcePath(urlPath) {
  // iPhone HEIC photos are read from their converted JPEG copy (lib/heic.js)
  return join("src", photoUrl(urlPath).replace(/^\/+/, ""));
}

/**
 * Process one photo for the gallery.
 * Returns { webp, jpeg, width, height, large } where webp/jpeg are srcset
 * strings and `large` is the URL of the biggest JPEG (for "tap to enlarge").
 * Returns null if the file can't be read, so one bad upload never breaks the build.
 */
export async function galleryImage(urlPath, outputDir = "_site") {
  try {
    const meta = await Image(sourcePath(urlPath), { ...IMAGE_OPTIONS, outputDir: join(outputDir, "img") });
    const srcset = (list) => list.map((m) => `${m.url} ${m.width}w`).join(", ");
    const biggest = meta.jpeg[meta.jpeg.length - 1];
    return {
      webp: srcset(meta.webp),
      jpeg: srcset(meta.jpeg),
      src: meta.jpeg[Math.min(1, meta.jpeg.length - 1)].url,
      width: biggest.width,
      height: biggest.height,
      large: biggest.url,
      thumb: meta.jpeg[0].url,
    };
  } catch (err) {
    console.warn(`[images] Couldn't process ${urlPath}: ${err.message}`);
    return null;
  }
}

/**
 * A 1200px-wide JPEG for social share previews (Facebook, Messenger, texts).
 * Returns { url, width, height } with a site-relative url, or null.
 */
export async function shareImage(urlPath, outputDir = "_site") {
  try {
    const meta = await Image(sourcePath(urlPath), {
      ...IMAGE_OPTIONS,
      outputDir: join(outputDir, "img"),
      widths: [1200],
      formats: ["jpeg"],
    });
    const { url, width, height } = meta.jpeg[0];
    return { url, width, height };
  } catch (err) {
    console.warn(`[images] Couldn't make a share image from ${urlPath}: ${err.message}`);
    return null;
  }
}
