// Settings shared by every blog post in this folder.
import { shareImage } from "../../lib/images.js";

/** Hidden when the blog is off, or for sample posts when samples are off. */
const hidden = (data) =>
  data.site.blog_enabled === false || (data.sample === true && data.site.show_samples === false);

export default {
  layout: "layouts/post.njk",
  tags: ["posts"],
  ogType: "article",
  eleventyComputed: {
    permalink: (data) => (hidden(data) ? false : `/blog/${data.page.fileSlug}/`),
    eleventyExcludeFromCollections: (data) => hidden(data),
    description: (data) => data.summary || "",
    shareImage: async (data) => {
      if (!data.cover || !data.siteUrl) return null;
      const img = await shareImage(data.cover, data.eleventy?.directories?.output || "_site");
      return img ? { ...img, url: data.siteUrl + img.url, alt: data.title } : null;
    },
  },
};
