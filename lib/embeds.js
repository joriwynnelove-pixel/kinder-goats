// Turns a pasted social media or video link into something the page can show.
// No API keys or access tokens are used anywhere: Facebook, Instagram and
// Threads all offer public embed pages for public posts, and YouTube/Vimeo
// offer public players. Nothing here can expire.

/** YouTube / Vimeo link -> tap-to-play preview info (see js/video.js). */
export function videoInfo(url) {
  const u = String(url || "").trim();
  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (yt) {
    return {
      kind: "youtube",
      url: u,
      embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`,
      thumb: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
    };
  }
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) {
    return { kind: "vimeo", url: u, embed: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&dnt=1`, thumb: "" };
  }
  return { kind: "link", url: u, embed: "", thumb: "" };
}

/**
 * Public Facebook / Instagram / Threads post link -> embed frame info.
 * Returns { kind, url, src, height } or { kind: "link", url } for anything else.
 */
export function socialEmbed(url) {
  const u = String(url || "").trim();
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    return { kind: "link", url: u };
  }
  const host = parsed.hostname.replace(/^(www|m|web)\./, "");
  const enc = encodeURIComponent(u);

  if (host === "facebook.com" || host === "fb.watch") {
    const isVideo = /\/videos\/|\/watch|\/reel\/|fb\.watch/.test(u);
    return isVideo
      ? { kind: "facebook", url: u, src: `https://www.facebook.com/plugins/video.php?href=${enc}&show_text=true&width=500`, height: 560 }
      : { kind: "facebook", url: u, src: `https://www.facebook.com/plugins/post.php?href=${enc}&show_text=true&width=500`, height: 620 };
  }
  if (host === "instagram.com") {
    const m = parsed.pathname.match(/^\/(?:[^/]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (m) {
      return { kind: "instagram", url: u, src: `https://www.instagram.com/${m[1]}/${m[2]}/embed/captioned/`, height: 720 };
    }
  }
  if (host === "threads.net" || host === "threads.com") {
    const m = parsed.pathname.match(/^\/@[^/]+\/post\/[A-Za-z0-9_-]+/);
    if (m) {
      return { kind: "threads", url: u, src: `https://www.threads.net${m[0]}/embed`, height: 600 };
    }
  }
  return { kind: "link", url: u };
}
