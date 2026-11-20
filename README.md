# Goat herd website

A free, static website for a small goat herd: one page per goat, linked to its dam, sire and offspring like an online pedigree. Built with [Eleventy](https://www.11ty.dev/). See `BRIEF.md` for the full plan.

## Editing the site (owners)

Owners do everything in the **web editor** at https://app.pagescms.org (also linked as **Owner login** in the site footer). It has forms for:

- **Goats:** add, edit or delete; photos, videos, lab reports, records, parents (picked from your goat list or typed as a name)
- **Blog posts**
- **Pages:** About page (story, sales policy) and Planned breedings
- **Farm settings:** name, color theme, logo, prices on/off, sample content on/off, contact email and form, social links, whole-herd health tests

Every save updates the live site in a few minutes. Owners without a GitHub account can be invited by email as Pages CMS collaborators. The editor's forms are defined in `.pages.yml`.

## Where things are

| Path | What it is |
| --- | --- |
| `src/_data/site.json` | Farm settings: name, location, registry, colors |
| `src/goats/*.md` | One file per goat (front matter + description) |
| `src/images/goats/<goat-id>/` | That goat's photos |
| `lib/goatGraph.js` | Works out offspring, grandparents and siblings; warns about bad data |
| `tests/goatGraph.test.js` | Tests for the relationship logic |
| `src/_includes/layouts/goat.njk` | The goat page |
| `src/herd.njk` | The Herd page |

## Run it on your computer

Node.js is installed in `~/.local/node`. In a terminal, from this folder:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

```bash
npm start
```

Then open http://localhost:8080. Other commands: `npm run build` (build to `_site/`), `npm test` (tests). To hide the sample goats, posts and breeding, turn off **Show sample content** in Farm settings (`show_samples`); `npm run remove-samples` deletes the sample goat files for good.

## Publishing

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages whenever something is saved (or when run by hand from the Actions tab). There's no timed schedule. The site address and sub-folder are worked out automatically.

## Change the farm name and colors

Everything about the farm lives in `src/_data/site.json` (Farm settings in the editor); templates never name a farm or breed.

- **Name:** `farm_name` (header, footer, page titles) and `herd_prefix`. Goat names are typed in each goat file, so rename those files' `name` too.
- **Colors:** pick a ready-made `theme_preset` (Pasture, Barn, Creek, Harvest, Heather, Charcoal; defined in `src/_data/themes.json`), or fill in custom `theme` colors like `#3f5a36` to override it.
- **Prices:** `show_prices` is `false`, so for-sale goats say "Inquire for price". Each goat's `price` is kept in its file; set `show_prices` to `true` to show them.
- **Logo:** put an image in `src/images/` and set `logo` to its path, e.g. `/images/logo.png`. Blank shows the farm name as text.
- **Site address:** filled in automatically on GitHub Pages. Set `url` only for a custom domain.
- **Registry:** `registry_name`, `registry_full_name` and `registry_search_url` (the KGBA online pedigree search by default).

## Pedigree links

Paste a goat's KGBA online pedigree address into its `pedigree_url`. A **View KGBA pedigree** button then shows in the Quick facts box, and a small pedigree link shows on that goat's card wherever it appears as a parent. With no `pedigree_url`, Quick facts shows **Search KGBA pedigrees** instead.

## Photos

List photos under `photos` in each goat file; the first is the main photo. Upload them as they come off the phone, including iPhone HEIC photos: the build turns HEIC into JPEG (`lib/heic.js`) and makes small, fast copies of every photo (`lib/images.js`). Lab reports can be HEIC too. On the page they swipe sideways, and tapping one opens it full screen.

## Sale sheets

Print any goat page (there's a **Print sale sheet** link under Quick facts, or use the browser's Print) for a one-page sheet with the main photo, price, quick facts, parents, grandparents and a QR code back to the page.

## Health test reports

Upload a photo, scan or PDF of the lab report and set `report` on the test:

```yaml
health_tests:
  - date: 2025-10-12
    test: CAE
    result: Negative
    lab: Name of lab
    report: /images/goats/ls-clover/cae-2025.jpg
```

Whole-herd tests go in `herd_health_tests` in `site.json` (photos in `src/images/health/`) and show on every herd goat's page. Crop or cover your address or account numbers before uploading.

## Videos

Upload videos to YouTube (Unlisted is fine) or Vimeo, then paste the link:

```yaml
videos:
  - url: https://youtu.be/VIDEO-ID
    caption: Clover on the milk stand
    date: 2026-05-01
```

The page shows a preview; the player loads only when someone taps it. Other links (e.g. Facebook) show as a plain link. Don't put video files in the site itself: phone videos are large and GitHub limits file and site size.

## Parents: ids or plain names

`dam` and `sire` can be another goat's `id` (links to its page) or a plain name like `Willow Creek Hazel` (shown as text, no warning). A value that looks like an id but has no file, such as `ls-mapel`, is shown as text and the build prints a `[goats]` warning.
