# Kovana Natural Farm — Website & Farm App

Two things live in this repo, deployed together on Vercel:

| Path | What | Audience |
|------|------|----------|
| `/` (root) | **Public website** — Kovana Natural Farm pages | Visitors |
| `/app/` | **Farm Manager app** — harvest/expense/plant entry (login required) | Farm team |

The backend API for the app is a separate repo: [`farm-manager-api`](https://github.com/KotaFarm/farm-manager-api).

## Structure

```
├── index.html, produce.html, …   Website pages (root = URL, don't move)
├── *-config.js                   Content configs — edit these to change
│                                 gallery/diary/blog/plants (no code needed)
├── css/, js/                     Website styles and scripts
├── gallery/, site-images/,       Media
│   blog/, diary/, practices/,
│   press/
├── api/                          Vercel serverless functions (newsletter)
├── sw.js                         Service worker (bump CACHE_NAME on big changes)
│
├── app/                          ── FARM MANAGER APP ── self-contained:
│   ├── index.html                  app shell (login, tabs)
│   ├── app.js / app.css            logic & styles
│   └── config.js                   API URL + Supabase project keys
│
├── docs/                         Not deployed: guides, architecture notes,
│   └── legacy/                   retired code kept for reference
├── scripts/                      Maintenance scripts (image optimization etc.)
└── memory/                       Project notes (not deployed)
```

## Working locally

```bash
python3 -m http.server 5500        # website: http://localhost:5500
                                   # app:     http://localhost:5500/app/
```

The app needs the API running — see the farm-manager-api README.

## Rules of thumb

- Website pages and media stay at root — their paths are public URLs.
- Anything not served to visitors goes in `docs/`.
- To add gallery/diary/blog content, edit the matching `*-config.js` — see
  `docs/HOW-TO-ADD-PHOTOS.txt`.
