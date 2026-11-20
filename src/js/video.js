// Tap-to-play videos. Without JavaScript, each preview is a normal link that
// opens the video on YouTube or Vimeo. With it, tapping swaps the preview for
// the player, so nothing heavy loads until someone wants to watch.
document.addEventListener("click", (event) => {
  const link = event.target.closest("a.video-link[data-embed]");
  if (!link) return;
  event.preventDefault();
  const frame = document.createElement("iframe");
  frame.src = link.dataset.embed;
  frame.title = link.textContent.trim() || "Video";
  frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  frame.allowFullscreen = true;
  frame.className = "video-frame";
  link.replaceWith(frame);
});
