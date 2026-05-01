# Phase 1 Backend Setup — `/api/subscribe`

This document walks through getting the new Vercel-backed newsletter signup live.
Estimated time: **15 minutes** end-to-end.

The function lives at `api/subscribe.js`. The frontend (`js/produce.js`) now calls
it instead of POSTing directly to the Apps Script. Vercel will auto-detect the
`api/` folder on your next deploy — no extra config needed.

---

## What changed in the code

1. **New file** `api/subscribe.js` — Vercel serverless function. Validates emails,
   rate-limits via Upstash Redis (optional), and forwards valid submissions to
   the existing Google Apps Script.
2. **Modified** `js/produce.js` — the notify-me form now POSTs to `/api/subscribe`
   instead of directly to the Apps Script. The old `mode: 'no-cors'` hack and the
   `setTimeout(600)` fake-success are gone. Real success and real errors are
   surfaced to the user.
3. **Modified** `css/produce.css` — small addition for error message styling.

The Apps Script itself does not need any change. The notify-me sheet keeps
working exactly as before.

---

## Step 1 — Set the Apps Script URL as a Vercel env var

Your Apps Script URL used to live in `js/produce.js` line 6 (still there for the
GET availability call — we'll move that later). The function reads it from an
env var instead, so it stays out of the browser.

1. Go to the Vercel dashboard → your project → **Settings → Environment Variables**.
2. Add a new variable:
   - **Name:** `FARM_API_URL`
   - **Value:** `https://script.google.com/macros/s/AKfycbxo11Ng9wAQb7Q9djhdyhDEiBoAL2NG-j5hGbQWyGbsk-oA3aQUP9lwA6DNa80WXtiyHQ/exec`
   - **Environments:** check Production, Preview, and Development
3. Save.

> If you ever rotate the Apps Script URL, you change it here once. No code change.

---

## Step 2 — Provision Upstash Redis (optional but recommended)

Rate limiting is what keeps a public form from being flooded by bots. The
function works without Upstash (it just skips the rate check), but you'll want
this on for production.

The easiest path is the Vercel Marketplace integration — it sets the env vars
for you:

1. Vercel dashboard → **Storage** tab in your project → **Connect Database**.
2. Pick **Upstash Redis**. Pick the free tier (10,000 commands/day, plenty).
3. Pick the region closest to your users — for India, choose `ap-south-1`
   (Mumbai) if available, otherwise `us-east-1`.
4. Click **Create**. Vercel automatically adds these env vars to your project:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

That's it. The function detects them and turns rate limiting on automatically.

> Don't want to use Upstash right now? Skip this step. The function will deploy
> and work; it just won't rate-limit. You can add it later without code changes.

---

## Step 3 — Deploy

Push to the branch Vercel watches (`main` or whichever you've configured):

```bash
git add api/subscribe.js js/produce.js css/produce.css api/SETUP.md
git commit -m "Add /api/subscribe Vercel function for notify-me signup"
git push
```

Vercel will:
- Detect `api/subscribe.js` as a serverless function.
- Install `@upstash/redis` (already in `package.json`).
- Deploy. Takes ~1–2 minutes.

You'll see the function listed under **Functions** in the Vercel dashboard once
the deploy finishes.

---

## Step 4 — Test

### From the live site
1. Open the produce page on your deployed site.
2. Scroll to the "🔔 Get availability updates" strip at the bottom.
3. Enter a real test email. Submit.
4. You should see "✓ Subscribed — we'll keep you posted!" appear (the form hides).
5. Open your subscriber Google Sheet — the email should be there.

### Try a bad email
1. Open in a private/incognito window (so localStorage doesn't say "subscribed").
2. Enter `not-an-email` and submit.
3. You should see "⚠ That email looks invalid — please check." in red.
4. Form re-enables so the user can correct and retry.

### Check the function logs
Vercel dashboard → your project → **Logs** → filter by function `api/subscribe`.
You'll see each invocation, the IP, and the result. Useful for spotting abuse.

---

## How rate limits behave

With Upstash configured:

| Limit | What it blocks |
|---|---|
| **10 requests / hour / IP** | A bot or browser hammering submit |
| **3 requests / hour / email** | Same email retried repeatedly (test/typo loops) |

Both windows reset every hour. Limits are tunable in `api/subscribe.js`
(`MAX_PER_IP_PER_HOUR`, `MAX_PER_EMAIL_PER_HOUR`).

Without Upstash configured, neither limit is enforced — the function still
validates and forwards, just without throttling.

---

## What the function returns (for reference)

Successful subscribe:
```json
{ "ok": true }
```

Already on the list (if Apps Script returns this signal):
```json
{ "ok": true, "alreadySubscribed": true }
```

Validation failures (HTTP 400):
```json
{ "ok": false, "error": "invalid_email" }
{ "ok": false, "error": "email_required" }
{ "ok": false, "error": "email_too_long" }
{ "ok": false, "error": "disposable_email" }
```

Rate limited (HTTP 429):
```json
{ "ok": false, "error": "rate_limited" }
{ "ok": false, "error": "too_many_attempts" }
```

Server-side issues (HTTP 5xx):
```json
{ "ok": false, "error": "server_misconfigured" }
{ "ok": false, "error": "upstream_error" }
{ "ok": false, "error": "upstream_unreachable" }
```

The frontend maps every code to a user-friendly message (see `ERROR_MESSAGES` in
`js/produce.js`).

---

## What's next (Phase 2 preview)

Once this is humming, the same pattern scales to:

- `/api/place-order` — replace the WhatsApp-only ordering flow with proper
  on-site checkout. Writes to Supabase Postgres.
- `/api/submit-review` — anonymous per-vegetable reviews with the same spam
  filter shape.
- `/api/availability` — wrap the GET that currently goes straight to Apps
  Script, so cache control and rate limits live on Vercel too.

Each one is ~80% copy-paste from this file with a different validator and a
different upstream.
