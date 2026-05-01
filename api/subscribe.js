/**
 * /api/subscribe — Newsletter signup proxy.
 *
 * Why this exists:
 *   The frontend used to POST directly to a Google Apps Script URL with
 *   `mode: 'no-cors'`. That worked, but had three problems:
 *     1. The browser couldn't read the response, so we faked success with
 *        a setTimeout. If the upstream failed, the email was lost silently.
 *     2. The Apps Script URL sat in public JS, inviting direct spam.
 *     3. Validation lived only on the client and was easy to bypass.
 *
 *   This function fixes all three:
 *     - Server-side regex + length + disposable-domain check
 *     - Optional rate limiting via Upstash Redis (per IP and per email)
 *     - The Apps Script URL lives in FARM_API_URL env var, never in the browser
 *     - Returns proper JSON so the UI can show real success/failure
 *
 * Env vars expected:
 *   FARM_API_URL              — Apps Script web app URL (required)
 *   Redis credentials (optional, for rate limiting). The function accepts
 *   either naming convention so it works with whichever one Vercel provisioned:
 *     - Vercel KV integration:   KV_REST_API_URL + KV_REST_API_TOKEN
 *     - Direct Upstash:          UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   If neither pair is set, rate limiting is silently skipped.
 */

const { Redis } = require('@upstash/redis');

// ── Config ────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LEN = 254;

// Per-IP cap is generous; per-email cap blocks accidental retries.
const MAX_PER_IP_PER_HOUR = 10;
const MAX_PER_EMAIL_PER_HOUR = 3;
const RATE_WINDOW_S = 3600;

// Tiny disposable-email blocklist. Keep small; expand as you see abuse.
const DISPOSABLE_DOMAINS = new Set([
    'tempmail.com', 'mailinator.com', 'guerrillamail.com',
    '10minutemail.com', 'throwawaymail.com', 'yopmail.com',
    'trashmail.com', 'fakeinbox.com', 'getnada.com',
    'maildrop.cc', 'sharklasers.com'
]);

// ── Redis (optional) ──────────────────────────────────────────────
// Falls back gracefully if Redis isn't configured — the function still
// works, just without rate limiting. Supports both env var conventions:
// Vercel KV (KV_REST_API_*) and direct Upstash (UPSTASH_REDIS_REST_*).
let redis = null;
const redisUrl   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
try {
    if (redisUrl && redisToken) {
        redis = new Redis({ url: redisUrl, token: redisToken });
    }
} catch (_) {
    redis = null;
}

// ── Helpers ───────────────────────────────────────────────────────
function clientIp(req) {
    const fwd = (req.headers['x-forwarded-for'] || '').toString();
    return fwd.split(',')[0].trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';
}

async function checkRateLimit(key, max) {
    if (!redis) return { ok: true };
    try {
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, RATE_WINDOW_S);
        }
        return { ok: count <= max, count };
    } catch (err) {
        // If Redis is having a bad day, don't block legit users.
        console.warn('Rate limit check failed:', err.message);
        return { ok: true };
    }
}

function json(res, status, body) {
    res.status(status).setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(body));
}

// ── Handler ───────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return json(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    // Vercel parses JSON bodies automatically when content-type is set.
    // Be defensive in case it's a string.
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); }
        catch { return json(res, 400, { ok: false, error: 'invalid_json' }); }
    }
    body = body || {};

    const rawEmail = (body.email || '').toString();
    const email = rawEmail.trim().toLowerCase();
    const source = (body.source || 'website').toString().slice(0, 64);

    // ── Validation ───────────────────────────────────────────────
    if (!email) {
        return json(res, 400, { ok: false, error: 'email_required' });
    }
    if (email.length > MAX_EMAIL_LEN) {
        return json(res, 400, { ok: false, error: 'email_too_long' });
    }
    if (!EMAIL_RE.test(email)) {
        return json(res, 400, { ok: false, error: 'invalid_email' });
    }
    const domain = email.split('@')[1];
    if (DISPOSABLE_DOMAINS.has(domain)) {
        return json(res, 400, { ok: false, error: 'disposable_email' });
    }

    // ── Rate limiting (per IP, then per email) ───────────────────
    const ip = clientIp(req);
    const ipCheck = await checkRateLimit(`rl:subscribe:ip:${ip}`, MAX_PER_IP_PER_HOUR);
    if (!ipCheck.ok) {
        return json(res, 429, { ok: false, error: 'rate_limited' });
    }
    const emailCheck = await checkRateLimit(`rl:subscribe:email:${email}`, MAX_PER_EMAIL_PER_HOUR);
    if (!emailCheck.ok) {
        return json(res, 429, { ok: false, error: 'too_many_attempts' });
    }

    // ── Forward to upstream (existing Apps Script for now) ───────
    const upstreamUrl = process.env.FARM_API_URL;
    if (!upstreamUrl) {
        console.error('FARM_API_URL not configured');
        return json(res, 500, { ok: false, error: 'server_misconfigured' });
    }

    try {
        const upstream = await fetch(upstreamUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source }),
            redirect: 'follow'
        });

        // Apps Script may return JSON, plain text, or HTML. Handle all.
        const ct = (upstream.headers.get('content-type') || '').toLowerCase();
        let upstreamData;
        if (ct.includes('application/json')) {
            upstreamData = await upstream.json();
        } else {
            const text = await upstream.text();
            try { upstreamData = JSON.parse(text); }
            catch { upstreamData = { ok: upstream.ok, raw: text.slice(0, 200) }; }
        }

        if (!upstream.ok || upstreamData.ok === false) {
            // Surface a known sub-state if upstream said "already subscribed"
            if (upstreamData && upstreamData.error === 'already_subscribed') {
                return json(res, 200, { ok: true, alreadySubscribed: true });
            }
            console.error('Upstream rejected:', upstream.status, upstreamData);
            return json(res, 502, { ok: false, error: 'upstream_error' });
        }

        return json(res, 200, { ok: true });
    } catch (err) {
        console.error('Upstream fetch failed:', err);
        return json(res, 502, { ok: false, error: 'upstream_unreachable' });
    }
};
