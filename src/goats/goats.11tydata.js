// Settings shared by every goat file in this folder.
import QRCode from "qrcode";
import { galleryImage, shareImage } from "../../lib/images.js";

/** The site's public address (see lib/settings.js), e.g. "https://name.github.io/herd". */
const siteUrl = (data) => data.siteUrl || "";

/** Sample goats are hidden when "Show sample goats" is off in Farm settings. */
const hidden = (data) => data.sample === true && data.site.show_samples === false;

/** The folder the site is being built into (normally _site). */
const outDir = (data) => data.eleventy?.directories?.output || "_site";

export default {
  layout: "layouts/goat.njk",
  tags: "goats",
  eleventyComputed: {
    // Goats added in the web editor have no id; their file name is the id.
    id: (data) => data.id || data.page.fileSlug,
    permalink: (data) => (hidden(data) ? false : `/goats/${data.id || data.page.fileSlug}/`),
    eleventyExcludeFromCollections: (data) => hidden(data),
    // e.g. "Clover — Kinder doe for sale, Chehalis, WA"
    title: (data) => {
      const short = data.nickname || data.name;
      const sale = data.status === "for-sale" ? " for sale" : "";
      return `${short} — ${data.site.breed} ${data.sex || "goat"}${sale}, ${data.site.location}`;
    },
    description: (data) => {
      const blurb = data.goatGraph?.goats?.[data.id]?.blurb || "";
      let price = "";
      if (data.status === "for-sale") {
        // site.show_prices: false means "inquire for price" everywhere, including share previews
        price = data.site.show_prices && data.price ? `For sale: ${data.price}. ` : "For sale, inquire for price. ";
      }
      return `${price}${blurb}`.trim();
    },
    // Reference goats (outside sires, ancestors) get a page but stay out of search results
    noindex: (data) => data.status === "reference",

    // Resized photos for the gallery (see lib/images.js)
    gallery: async (data) => {
      const photos = Array.isArray(data.photos) ? data.photos : [];
      const out = [];
      for (const p of photos) {
        if (!p || !p.image) continue;
        const img = await galleryImage(p.image, outDir(data));
        if (img) out.push({ ...p, img });
      }
      return out;
    },

    // Share preview: the main photo, 1200px wide, as an absolute URL
    shareImage: async (data) => {
      const first = Array.isArray(data.photos) && data.photos[0];
      const base = siteUrl(data);
      if (!first || !first.image || !base) return null;
      const img = await shareImage(first.image, outDir(data));
      return img ? { ...img, url: base + img.url, alt: first.caption || data.name } : null;
    },

    pageUrl: (data) => {
      const base = siteUrl(data);
      return base ? `${base}/goats/${data.id}/` : "";
    },

    // QR code for the printed sale sheet, linking back to this page
    qrSvg: async (data) => {
      const base = siteUrl(data);
      if (!base || data.status === "reference") return "";
      return QRCode.toString(`${base}/goats/${data.id}/`, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
    },
  },
};
