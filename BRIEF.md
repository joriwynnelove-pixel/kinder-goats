# Kinder Goat Herd Website — Project Brief for Claude Code

Nov 19, 2026 · @Jori

Source: https://claude.ai/artifact/3NM7gzcrCNfpB5jSezAmpn (exported 2026-11-20; the online doc is the master copy)

## How to use this brief

Paste everything below this section into Claude Code as your first message, then add: "Start with Phase 1 only and stop for my review." Building in phases lets you check the parent–offspring links work before any real goats go in.

- Export this doc as Markdown and save it in the project folder as `BRIEF.md` so Claude Code can reread it in later sessions.
- Fill in the open questions in the last section before Phase 3, or let Claude Code use the stated defaults.
- Everything after this section is written to Claude Code.

## Project overview

Build a free-to-host website for a small Kinder goat herd (Lingering Seasons Farm, Chehalis, WA) where every goat has its own page, linked to its dam, sire and offspring like an online pedigree. The site should help buyers trust the herd's quality and should double as a template other breeders can copy.

**Goals**

1. One page per goat with photos, description, records and links to parents and offspring.
2. Relationships built automatically: entering a goat's dam and sire is enough to show it on their pages as offspring.
3. Links to each goat's entry in the Kinder Goat Breeders Association (KGBA) online pedigree database.
4. Easy for a non-programmer to add goats and photos through a web form.
5. Free hosting with an optional custom domain.
6. Reusable as a template: another breeder changes one settings file and their own goats, nothing else.

**Users:** the herd owner (adds and updates goats, a few times a month, often from a phone) and buyers (browse on phones, mostly arriving from Facebook groups).

## Tech stack and hosting

Use a static site generator with goats stored as plain files in a GitHub repository. No server, no database, no login system to maintain.

| Piece | Choice | Why |
| --- | --- | --- |
| Site generator | Eleventy (11ty) | Simple, fast, handles data files well; Astro is an acceptable alternative if you have a strong reason |
| Goat data | One Markdown file per goat with YAML front matter, in `goats/` | Readable, editable by hand or by form, works with any CMS |
| Photos | One folder per goat in `images/goats/<goat-id>/` | Keeps photos with their goat; easy to find |
| Image handling | Eleventy Image plugin | Auto-resizes and compresses uploads so phone photos load fast |
| Editing interface | Pages CMS (preferred) or Decap CMS | Web form for adding goats and uploading photos, no code |
| Hosting | GitHub Pages by default; document Netlify and Cloudflare Pages as alternatives | All free, all support a custom domain |
| Deployment | GitHub Actions builds and publishes on every change | Saving in the CMS updates the live site in a few minutes |

Check current versions and setup steps for each tool before installing; don't rely on memory. Use plain CSS (no framework) and keep JavaScript to small enhancements like photo galleries and filters. The site must work with JavaScript off.

## Goat data model

Every goat is one file. Only `id`, `name` and `sex` are required; every other field is optional, and the page simply hides anything left blank. Goats the farm doesn't own (outside sires, grandparents) are entered the same way with `status: reference` and as little detail as is known.

| Field | Type | Notes |
| --- | --- | --- |
| id | text | URL-safe slug, e.g. `ls-clover`; used for links and photo folder |
| name | text | Full registered name |
| nickname | text | Barn name |
| sex | doe / buck / wether | Required |
| status | for-sale / reserved / retained / sold / deceased / reference | Drives badges and filters |
| price | text | Shown only when for sale |
| registration_number | text | KGBA registration number |
| tattoo | text | Left and right ear |
| birth_date | date | Page shows age from this |
| color, horn_status | text | Horn status: polled, disbudded, horned |
| breeder, owner | text | Default to farm from settings |
| dam, sire | goat id | Links to another goat file; may be blank |
| pedigree_url | URL | Full link to the KGBA online pedigree entry |
| photos | list of image + caption + date | First photo is the main photo |
| description | Markdown body | Temperament, conformation, notes |
| milk_records | list of date, days in milk, lbs, butterfat %, protein % | From KGBA Milk Test Program or own tests |
| evaluations | list of date, type, score or placing, notes | Appraisals and show results |
| health_tests | list of date, test, result | CAE, CL, Johne's; can also be herd-level in settings |
| kidding_history | list of date, number of kids, notes | Litter size, ease, mothering |
| featured | yes / no | Shows on the home page |

Example goat file (invented data, use it for samples):

```markdown
---
id: ls-clover
name: Lingering Seasons Clover
nickname: Clover
sex: doe
status: retained
registration_number: "K-00000"
birth_date: 2023-03-14
color: Black with white belt
horn_status: disbudded
dam: ls-maple
sire: outside-buck-thunder
pedigree_url: ""
photos:
  - image: /images/goats/ls-clover/side-2025.jpg
    caption: Side view, 2 years
    date: 2025-05-01
milk_records:
  - date: 2025-06-10
    days_in_milk: 60
    lbs: 4.2
    butterfat: 6.1
kidding_history:
  - date: 2025-04-10
    kids: 3
    notes: Kidded unassisted, excellent mother
---
Calm, friendly doe with a well-attached udder...
```

## Pages and layout

The individual goat page is the heart of the site; design it first and mobile-first.

**Goat page, top to bottom**

1. Name, nickname, status badge (For Sale, Reserved, Sold) and price if for sale.
2. Photo gallery: large main photo, tap to enlarge, swipe through the rest with captions and dates.
3. Quick facts box: sex, age and birth date, registration number, tattoo, color, horn status, breeder, plus a "View KGBA pedigree" button.
4. Description.
5. Records, each only if it has data: milk records table, evaluations and show results, health tests, kidding history.
6. Parents: two side-by-side cards (dam and sire), each with photo, name, registration number and a one-line blurb from the start of that goat's description. A card links to the parent's page if the parent has one; otherwise it shows the name and its KGBA pedigree link if known.
7. Grandparents: a compact four-name row under the parent cards, linked where pages exist.
8. Offspring: a grid of photo cards, newest first, built automatically (next section). Hidden if none.
9. "Interested in this goat?" contact button that pre-fills the goat's name.

**Other pages**

- **Home:** farm intro, featured goats, link to For Sale.
- **Herd:** all goats as photo cards, filterable by does, bucks, kids, for sale, with retired and deceased goats under a separate "Herd history" filter. Reference goats are excluded.
- **For Sale:** goats with for-sale or reserved status.
- **Planned breedings:** pairings for the coming season with photos of both parents, expected kidding month and a waitlist note.
- **About and sales policy:** the farm story, health testing practices, deposit and pickup terms.
- **Contact:** a form using a free form service (Netlify Forms, Formspree or similar) with a plain email fallback.

## Automatic relationships

Relationships are stored in one direction only: each goat names its `dam` and `sire`. Everything else is computed at build time, so the owner never types offspring by hand.

- **Offspring:** a goat's offspring are all goats whose `dam` or `sire` is that goat's id.
- **Grandparents:** the parents' parents, looked up through the same fields.
- **Siblings (optional, nice to have):** goats sharing both parents, shown as a small "Full siblings" row.
- **Missing parents:** if `dam` or `sire` names an id with no file, show the raw name as text and log a build warning rather than failing.
- **Bad data:** warn at build time if a goat lists itself as a parent, if a dam is not a doe, or if a sire is not a buck.

Write this as one small, well-commented data module (for example `_data/goatGraph.js`) with simple tests, so template users can trust it and fix it.

## KGBA pedigree linking

Link out to the KGBA online pedigree for each goat; never copy or scrape KGBA's data. The owner pastes the full pedigree URL into `pedigree_url` for each goat.

- Show a "View KGBA pedigree" button on the goat page and a smaller link on parent cards when `pedigree_url` is set. Open in a new tab.
- When `pedigree_url` is blank, hide the button. Optionally show "Search KGBA pedigrees" pointing to the database's main page, set once in settings as `registry_search_url`.
- Don't build pedigree links from registration numbers unless you first confirm the KGBA site's URL pattern supports it; if it does, add it as an optional fallback, switched on in settings.
- KGBA notes its online pedigrees are separate from the registry, so some registered goats are missing online. The site should never treat a missing link as an error. ([KGBA](https://kindergoatbreeders.com/?p=2366))
- Keep all registry wording in settings (`registry_name`, `registry_search_url`) so breeders of other breeds can point to their own registry.

## Sales and buyer-trust features

The site's job is to make buyers confident, so records and photos matter more than decoration.

- **Records front and center:** milk, evaluation, health test and kidding sections on each goat page, plus a herd health statement (testing dates and results) on the About page, set in settings.
- **Dated photos:** captions show the goat's age at the time; encourage kid, yearling and mature photos, plus udder photos for does.
- **Daughters of bucks:** on buck pages, show female offspring first in the offspring grid.
- **Social sharing previews:** every goat page sets Open Graph tags (title, main photo, short description, price if for sale) so links posted in Facebook groups show a photo card.
- **Printable sale sheet:** a print stylesheet that turns any goat page into one page with main photo, quick facts, parents and a QR code linking back to the page.
- **Search engines:** page titles like "Clover — Kinder doe for sale, Chehalis WA", a sitemap and descriptive image alt text.
- **Fast on phones:** compressed images, lazy loading, no heavy scripts.

## Social media

Link to the farm's social accounts everywhere, and show recent posts in a way that never needs a login token, so nothing breaks when the site sits untouched.

- **Account links:** list each account in settings (Facebook, Instagram, YouTube, TikTok, others optional). Show icons in the footer and on the Contact page; hide any left blank.
- **Featured posts (default):** a CMS list where the owner pastes the web address of any public Facebook, Instagram or Threads post. The site embeds them in a "Latest from the farm" strip on the home page. Meta's embed service has worked without an access token since June 2026 ([Meta for Developers](https://developers.facebook.com/blog/post/2026/06/15/tokenless-access-to-meta-oembed-apis/)). These don't update on their own; the owner adds new ones when they want.
- **Posts on goat pages:** an optional `social_posts` field on each goat (list of post URLs) embeds that goat's posts on its page.
- **Auto-updating feed (optional):** a settings field for pasting embed code from a feed widget service (for example Elfsight or Smash Balloon's TileSet). Off by default; the setup guide should note that free tiers are limited and the feed depends on that company.
- **Don't connect directly to the Instagram or Facebook APIs.** A live feed through Meta still needs tokens that must be renewed ([WP Mayor](https://wpmayor.com/meta-tokenless-oembed-wordpress/)).
- Load embeds only when scrolled into view so they don't slow pages down.

## Blog

Add a simple blog for farm news, kidding announcements and goat care posts, managed in the same CMS as the goats.

- **Posts:** one Markdown file per post in `blog/` with title, date, cover photo, short summary, tags and optional `goats` (a list of goat ids).
- **Goat links:** a post that lists goats shows their photo cards at the bottom, and each of those goat pages shows a "Mentioned in the blog" list. Kidding announcements can link the dam, sire and new kids this way.
- **Pages:** blog index (newest first, cover photo and summary), one page per post, tag pages, and the latest three posts on the home page.
- **RSS feed** so readers can follow along, plus social preview tags on every post.
- **Template:** the blog can be turned off in settings, and sample content includes two invented posts.

## Template and sharing

Another breeder should be able to launch their own site in under an hour without writing code.

- **One settings file** (`_data/site.json` or `site.yml`): farm name, herd prefix, location, logo, contact email, two or three theme colors, fonts, registry name and URLs, herd health statement, social links, form service settings.
- **No hard-coded farm details** anywhere in templates; check with a search for the farm name before release.
- **Sample content:** five invented goats (a doe, her dam, an outside reference sire, her buck kid and her doe kid) so a new user sees every feature working, plus a one-command way to delete them.
- **GitHub template repository** with a "Use this template" button and a pre-configured Pages CMS or Decap config.
- **Plain-language setup guide** (`SETUP.md`) with screenshots: copy the template, turn on GitHub Pages, connect the CMS, add a custom domain, add your first goat. Write for someone who has never used GitHub.
- **Breed-neutral labels:** field names and page text avoid Kinder-specific wording except where pulled from settings.
- **License:** MIT, with a credit line in the footer that users may remove.

## Out of scope

Don't build these; each adds cost, upkeep or security risk the site doesn't need.

- User accounts or buyer logins
- Online payments or deposits (link to the sales policy instead)
- A database server or backend API
- Google sign-in, Google Cloud, Apps Script or any other Google service. Google deletes OAuth clients that go unused for six months, which would break a site left alone over a slow season.
- Scheduled GitHub Actions (timed or nightly jobs). GitHub turns these off after 60 days without repository activity. Deploys run only when a change is saved or when started by hand.
- Any service that needs an access token renewed on a schedule, including direct Instagram or Facebook API connections
- Scraping or copying data from the KGBA website
- Inbreeding coefficient calculations (KGBA's pedigree tool already covers linebreeding)

The site must keep running for a year or more with no edits. Before release, check that nothing in it depends on a login, token or timed job to stay up.

## Build phases and acceptance checks

Work in five phases and stop for review at the end of each one.

1. **Core pages with sample goats.** Eleventy project, data model, relationship module with tests, goat page, Herd page, five sample goats with placeholder photos. *Done when:* the sample doe's page shows both parents, grandparents and both kids, and each kid's page links back to her.
2. **Design and mobile polish.** Settings-driven theme, photo gallery, status badges, filters, print sheet with QR code, social preview tags. *Done when:* pages look right on a phone-width screen and a shared link shows a photo preview.
3. **Editing and hosting.** CMS config with forms for every field and photo upload, GitHub Actions deploy to GitHub Pages (on save only), contact form, blog, social links and featured post embeds. *Done when:* adding a goat through the CMS from a phone puts it live without touching code.
4. **Real herd.** Replace samples with the farm's goats; fix any build warnings about missing parents.
5. **Template release.** Remove farm details from templates, restore sample goats in the template branch or repo, write `SETUP.md`, enable "Use this template". *Done when:* someone follows `SETUP.md` from scratch and launches a site.

**Open questions for the owner** (use the default in brackets if unanswered)

- [ ] Site name and whether a custom domain will be bought now or later [farm name, free GitHub address for now]
- [ ] Theme colors and logo [earthy greens and cream, text logo]
- [ ] Show prices publicly or "inquire" only [show prices]
- [ ] Herd health testing details for the About page [placeholder text]
- [ ] Contact form email address [placeholder in settings]

## Decisions made during the build (2026-11-20)

These were added in Claude Code after Phase 1 review and aren't in the online doc.

- **Herd name not yet registered with KGBA:** farm name, herd prefix and every theme color and font must stay in `src/_data/site.json` only, easy to change.
- **Parents:** `dam` / `sire` accept a goat id (linked) or a plain name (text, no warning). Id-like values with no file still warn.
- **Health test reports:** each health test can have a `report` (photo or PDF) that opens full size. Whole-herd tests live in `herd_health_tests` in settings and show on every herd goat's page; the About page (Phase 3) should show them too.
- **Contact button:** for-sale and reserved goats say "Interested in <name>?" (reserved adds a backup-buyer note); other herd goats say "Interested in <name>'s kids?"; no button for reference, sold or deceased goats, or wethers not for sale.
- **Videos:** `videos` list of YouTube/Vimeo links with caption and date, shown as tap-to-play previews. No video files in the repository.
- **Phase 2 additions:** a For Sale page (for-sale and reserved goats) is in the menu. Herd filters work without JavaScript (CSS `:has()`); "Kids" means under one year, re-checked in the browser so it stays right without rebuilds. `site.url` must be set for share previews and QR codes.
- **Prices:** inquire only (answer to open question). `show_prices: false` in settings; `price` stays in goat files so it can be switched on later.
- **Owners never edit files (Phase 3 requirement):** everything an owner changes is done through the web editor (CMS), in forms: add/edit/delete goats (every field, parents picked from a list of goats or typed as a plain name), photo, lab report and video uploads/links, herd health tests, blog posts, and all settings (farm name, colors with a color picker, logo, show prices, site address, social links). Sample goats are hidden with a settings switch instead of a command. The site gets an "Owner login" / "Add a goat" link to the editor. Only first-time setup happens on GitHub's website, by clicking through `SETUP.md`.
- **Phase 3 build notes:** editor is Pages CMS (`.pages.yml`); owners without GitHub accounts are invited by email as collaborators. Goat files created in the editor have no `id`; the file name is the id. Parents picked in the editor are saved as file paths (`src/goats/x.md`) and normalised by `goatIdFrom()`; `dam_name` / `sire_name` hold plain names. Colors come from six presets in `src/_data/themes.json` plus optional custom hex values (Pages CMS has no color picker). `show_samples` and `blog_enabled` switches. Contact form posts to a form service set in `form_endpoint` (blank = email only). Social embeds use the public Facebook/Instagram/Threads embed pages (no tokens). Deploy workflow runs on push to main and by hand only; path prefix and `SITE_URL` come from `actions/configure-pages`.
- **HEIC uploads:** iPhone HEIC/HEIF photos are allowed in every photo and report field. `lib/heic.js` converts them to JPEG in `src/images/_converted/` before each build (heic-decode, pure JS; sharp can't read HEIC), tracked by content fingerprint and cached in the deploy workflow. Pages always link the JPEG; HEIC originals aren't published.
- **Pages CMS quirks (found 2026-11-20):** its `image` field ignores the configured extensions (validation falls back to its built-in list without HEIC), so every photo field uses `type: file` instead (no thumbnail, but HEIC works). Extension checks are case-sensitive, so lists include `HEIC`/`JPG` too. Uploads fail with 413 above about 3.3 MB (the editor sends files base64-encoded, so its host's ~4.5 MB request limit shrinks by a quarter); tell owners "under 3 MB". iPhone 24 MP photos are too big, 12 MP HEIC usually fits. Photo entries with no photo (left by a failed upload) are skipped by the build.
- **Publishing:** live on GitHub Pages from the public repo `joriwynnelove-pixel/kinder-goats`; Pages CMS connected. Pages CMS drops blank fields when it saves `site.json`, so templates must tolerate any missing setting (checked: they do).

## Future wishlist

- **Read registration papers from a photo (optional add-on, not planned).** Owner uploads a photo of a KGBA certificate; an AI vision model (Claude) fills in registered name, number, birth date, sex (D/B suffix), color, horns, tattoo, breeder name, sire, dam and all four grandparents. Tested by hand on a real KGBA Certificate of Merit: every field was readable.
  - Privacy design: paper photos go to a separate **private** repo (its own Pages CMS project), never the public site repo. A GitHub Action there reads the photo and writes only an allow-list of fields to the public repo through a write-only deploy key, so breeder addresses, member numbers and signatures are never stored publicly. API key lives only in the private repo's secrets. New goats arrive hidden as "Waiting for your review".
  - Estimated cost a few cents per paper; needs an Anthropic API key, so it must stay an opt-in switch for template users.
  - Alternatives rejected: deleting the photo after reading (still in public git history); private site repo (needs paid GitHub Pro for Pages); separate upload page on Cloudflare (extra account and password).
  - Related improvement already done (2026-11-20): grandparent name fields for outside parents (`dam_dam_name`, `dam_sire_name`, `sire_dam_name`, `sire_sire_name`); `tattoo` already existed.
