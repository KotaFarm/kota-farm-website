# Vercel caching policy — notes on `vercel.json`

The rules in `vercel.json` are intentionally conservative and trade a little
inconvenience for a lot of repeat-visit speed. This file explains the reasoning
so future edits don't unknowingly regress it.

## What gets a 1-year immutable cache

Images (`jpg / jpeg / png / webp / gif / svg / avif / ico`), fonts
(`woff / woff2 / ttf / otf / eot`), and video (`mp4 / webm / mov / m4v`) all
get:

```
Cache-Control: public, max-age=31536000, immutable
```

"Immutable" means the browser will never re-fetch these files until the URL
itself changes. This is safe because:

1. Farm photos don't change once uploaded — if one does need to change,
   re-upload under a new filename.
2. The service worker (`sw.js`) still revalidates on the background where
   it can, so a refreshed page eventually pulls new versions.
3. Vercel's edge also caches, so first-hit latency stays low.

## What gets a 1-week must-revalidate cache

CSS and JS (`css / js / mjs`) get:

```
Cache-Control: public, max-age=604800, must-revalidate
```

One week, because the site isn't bundled — filenames aren't fingerprinted
(there's no `main.abc123.js`). A returning visitor who hasn't cleared their
cache in a few days will get a stale JS file; a forced reload fixes it,
and a week is short enough that edits roll out to everyone within a day or
two of normal browsing.

## What the service worker gets

`/sw.js` is explicitly:

```
Cache-Control: no-cache, no-store, must-revalidate
```

If the browser caches `sw.js` itself, it can never be replaced, and we lose
the ability to ship a new service worker. Vercel's edge will still serve it
fast.

## What's NOT covered (and why that's fine)

HTML files get Vercel's default short cache. That's what we want — it's how
new blog posts and edits show up right away for everyone.

## If you add a new asset type

If you start hosting self-uploaded fonts or a new image format, either the
existing regex covers it or you add a new block. The regex `(.*)\.(…)` at the
start means anything under any folder qualifies.

## How to verify in production

```bash
curl -I https://kotaearth.com/gallery/the-land/farm-sunset.webp \
  | grep -i cache-control
# → cache-control: public, max-age=31536000, immutable
```
