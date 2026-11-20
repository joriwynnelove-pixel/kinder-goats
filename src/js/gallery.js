// Photo gallery enhancements. The page already works without this file:
// photos swipe sideways and each one links to its full-size copy.
// This adds: thumbnails that scroll the strip smoothly, and a full-screen
// viewer with swipe, arrow keys and captions.
(() => {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;
  const track = gallery.querySelector(".gallery-track");
  const slides = [...gallery.querySelectorAll(".slide")];
  const thumbs = [...gallery.querySelectorAll(".gallery-thumbs a")];
  if (!track || !slides.length) return;

  // --- Thumbnails: scroll the strip instead of jumping the page ---
  const showSlide = (i, smooth = true) => {
    track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: smooth ? "smooth" : "auto" });
  };
  thumbs.forEach((t, i) =>
    t.addEventListener("click", (e) => {
      e.preventDefault();
      showSlide(i);
    })
  );
  // Highlight the thumbnail for the photo in view
  if ("IntersectionObserver" in window && thumbs.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = slides.indexOf(entry.target);
          thumbs.forEach((t, j) => t.toggleAttribute("aria-current", j === i));
        }
      },
      { root: track, threshold: 0.6 }
    );
    slides.forEach((s) => io.observe(s));
  }

  // --- Full-screen viewer ---
  if (typeof HTMLDialogElement !== "function") return;
  const items = slides.map((s) => ({
    src: s.querySelector(".slide-link").getAttribute("href"),
    alt: s.querySelector("img").alt,
    caption: s.querySelector("figcaption")?.innerHTML || "",
  }));

  const box = document.createElement("dialog");
  box.className = "lightbox";
  box.setAttribute("aria-label", "Photo viewer");
  box.innerHTML = `
    <button class="lb-close" type="button" aria-label="Close">×</button>
    <button class="lb-prev" type="button" aria-label="Previous photo">‹</button>
    <figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-caption"></figcaption></figure>
    <button class="lb-next" type="button" aria-label="Next photo">›</button>`;
  document.body.append(box);
  const img = box.querySelector(".lb-img");
  const cap = box.querySelector(".lb-caption");
  const multi = items.length > 1;
  box.querySelector(".lb-prev").hidden = !multi;
  box.querySelector(".lb-next").hidden = !multi;
  let current = 0;

  const show = (i) => {
    current = (i + items.length) % items.length;
    img.src = items[current].src;
    img.alt = items[current].alt;
    cap.innerHTML = items[current].caption;
  };
  const open = (i) => {
    show(i);
    box.showModal();
  };
  const close = () => {
    box.close();
    showSlide(current, false); // leave the page on the photo they ended on
  };

  slides.forEach((s, i) =>
    s.querySelector(".slide-link").addEventListener("click", (e) => {
      e.preventDefault();
      open(i);
    })
  );
  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
  box.querySelector(".lb-next").addEventListener("click", () => show(current + 1));
  box.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  // Tap the dark background to close
  box.addEventListener("click", (e) => {
    if (e.target === box) close();
  });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  // Swipe left/right on phones
  let startX = null;
  box.addEventListener("pointerdown", (e) => (startX = e.clientX));
  box.addEventListener("pointerup", (e) => {
    if (startX === null || !multi) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });
})();
