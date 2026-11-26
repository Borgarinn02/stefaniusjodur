# Stefaníusjóður

Ný vefsíða fyrir Minningarsjóð frú Stefaníu Guðmundsdóttur, byggð með [Astro](https://astro.build).

## Keyra

```sh
npm install
npm run dev      # http://localhost:4321/stefaniusjodur/
npm run build    # static site in dist/
```

## Where things live

| What | Where |
|---|---|
| Award recipients (one file each) | `src/content/styrkthegar/<year>-<name>.md` |
| Award ceremonies | `src/content/styrkveitingar/<year>.md` |
| General pages (Um sjóðinn, Stefanía, Saga, Stjakinn…) | `src/content/sidur/*.md` |
| Gallery list (title + description per photo) | `src/data/myndasafn.json` |
| News & events (Í brennidepli) | `src/content/brennidepill/<yyyy-mm-dd>-<slug>.md` |
| Board members (Stjórn) | `src/data/stjorn.json` (photos in `public/images/stjorn/`) |
| Images | `public/images/` (portraits in `styrkthegar/`, gallery in `myndasafn/`) |
| Layout, navigation | `src/layouts/Base.astro` |
| Styling (colours and fonts as tokens at the top) | `src/styles/global.css` |
| Trophy (3D placeholder) | `src/components/Stjakinn.astro` |

## Adding a new recipient

1. Add the portrait to `public/images/styrkthegar/`, for example `2026A.jpg`.
2. Create `src/content/styrkthegar/2026-firstname-lastname.md`:

   ```md
   ---
   name: "Fullt Nafn"
   year: 2026
   photo: "/images/styrkthegar/2026A.jpg"
   photoCredit: "Ljósmyndari"
   ---

   Umfjöllun um styrkþegann…
   ```

3. Optional: add the ceremony write-up as `src/content/styrkveitingar/2026.md`, with `title`, `year` and `season` in the frontmatter.
4. Commit and push.

The home page automatically shows the newest year's recipients.

## Source material

`_source/` holds the old site as scraped from the Wayback Machine (the original domain is gone).
See `_source/README.md` for what is missing. `npm run import-source` regenerates the content from it.
**Don't re-run it after editing content by hand**, because it overwrites `src/content/`.

## Hosting

Every push to `main` builds the site and deploys it to GitHub Pages through `.github/workflows/deploy.yml`:
https://borgarinn02.github.io/stefaniusjodur/

The site is served under the `/stefaniusjodur/` sub-path, so internal links in templates go through `u()` from `src/lib/url.ts`.
Links inside Markdown content are prefixed automatically.
To move to a custom domain, set `SITE` and `BASE = '/'` in `astro.config.mjs`.

## Adding a news item or event (Í brennidepli)

Create `src/content/brennidepill/2026-12-01-titill.md`:

```md
---
title: "Titill"
date: 2026-12-01          # publish date, used for sorting
eventDate: 2026-12-06     # optional: makes it an event and shows this date
summary: "Ein til tvær setningar sem birtast á forsíðu og í lista."
image: "/images/mynd.jpg" # optional
featured: true            # optional: show it large at the top of the home page
draft: true               # optional: hidden on the live site
---

Meginmál fréttarinnar…
```

## Search

Search uses [Pagefind](https://pagefind.app). The index is built after `astro build`,
so search works with `npm run build && npm run preview` and on the live site, but not in `npm run dev`.
