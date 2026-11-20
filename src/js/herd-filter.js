// Keeps the "Kids" filter accurate: a kid is under a year old today, even if
// the site hasn't been rebuilt in months. Filtering itself is done in CSS.
(() => {
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  document.querySelectorAll(".herd .card[data-born]").forEach((card) => {
    card.toggleAttribute("data-kid", new Date(card.dataset.born) > yearAgo);
  });
})();
