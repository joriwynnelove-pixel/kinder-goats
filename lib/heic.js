// iPhone photos (HEIC/HEIF) -> JPEG.
//
// Browsers other than Safari can't show HEIC, and the image resizer (sharp)
// can't read it either. So before each build, every .heic/.heif file under
// src/images/ is decoded (with heic-decode, pure JavaScript, works anywhere)
// and saved as a JPEG under src/images/_converted/, mirroring its folder.
// photoUrl() then points pages at the JPEG. Owners just upload HEIC as-is.
//
// Converted files are not saved in the repository (.gitignore); they're
// remade when missing or when the original's contents change (tracked by a
// fingerprint in _converted/.fingerprints.json, since file dates aren't
// reliable on GitHub), and the deploy workflow caches them between builds.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, relative } from "node:path";
import decode from "heic-decode";
import sharp from "sharp";

const IMAGES_DIR = join("src", "images");
const CONVERTED = "_converted";

export const isHeic = (path) => /\.(heic|heif)$/i.test(String(path || ""));

/** "/images/goats/a/IMG_1234.HEIC" -> "/images/_converted/goats/a/IMG_1234.jpg"; others unchanged. */
export function photoUrl(url) {
  const u = String(url || "");
  if (!isHeic(u)) return u;
  return u.replace(/^(\/?images\/)(.*)\.(heic|heif)$/i, `$1${CONVERTED}/$2.jpg`);
}

/** Every HEIC file under src/images (not counting already-converted ones). */
function findHeic(dir = IMAGES_DIR, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === CONVERTED || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findHeic(full, found);
    else if (isHeic(entry.name)) found.push(full);
  }
  return found;
}

/** Decode one HEIC file and save it as a high-quality JPEG. */
export async function convertHeic(source, target) {
  const { width, height, data } = await decode({ buffer: readFileSync(source) });
  mkdirSync(dirname(target), { recursive: true });
  await sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
    raw: { width, height, channels: 4 },
  })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(target);
}

/**
 * Convert any HEIC photos that are new or changed since last time.
 * Never stops the build: a file that can't be read gets a warning.
 */
export async function convertAllHeic() {
  const listFile = join(IMAGES_DIR, CONVERTED, ".fingerprints.json");
  let seen = {};
  try {
    seen = JSON.parse(readFileSync(listFile, "utf8"));
  } catch {
    // first run: nothing converted yet
  }
  const next = {};
  let converted = 0;
  for (const source of findHeic()) {
    const rel = relative(IMAGES_DIR, source);
    const target = join(IMAGES_DIR, CONVERTED, rel.replace(/\.(heic|heif)$/i, ".jpg"));
    const fingerprint = createHash("sha1").update(readFileSync(source)).digest("hex");
    if (seen[rel] === fingerprint && existsSync(target)) {
      next[rel] = fingerprint;
      continue;
    }
    try {
      await convertHeic(source, target);
      next[rel] = fingerprint;
      converted++;
    } catch (err) {
      console.warn(`[images] Couldn't convert iPhone photo ${source}: ${err.message}`);
    }
  }
  if (converted || Object.keys(seen).length !== Object.keys(next).length) {
    mkdirSync(dirname(listFile), { recursive: true });
    writeFileSync(listFile, JSON.stringify(next, null, 2));
  }
  if (converted) console.log(`[images] Converted ${converted} iPhone (HEIC) photo(s) to JPEG.`);
  return converted;
}
