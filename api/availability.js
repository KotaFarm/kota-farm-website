/**
 * /api/availability — Vegetable availability proxy.
 *
 * Why this exists:
 *   The frontend used to GET the Google Apps Script /exec URL directly,
 *   which meant the URL shipped in public JS (js/produce.js, js/main.js)
 *   and could be hit/spammed by anyone — bypassing the protections that
 *   /api/subscribe added for the same upstream.
 *
 *   This proxy keeps the Apps Script URL server-side (FARM_API_URL env
 *   var, same as /api/subscribe) and adds a short CDN cache so repeat
 *   visitors don't hammer the upstream at all.
 *
 * Env vars expected:
 *   FARM_API_URL — Apps Script web app URL (required, already set for
 *                  /api/subscribe)
 *
 * No dependencies — uses the built-in fetch (Node 18+).
 */

function json(res, status, body) {
    res.status(status).setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return json(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    const upstreamUrl = process.env.FARM_API_URL;
    if (!upstreamUrl) {
        console.error('FARM_API_URL not configured');
        return json(res, 500, { ok: false, error: 'server_misconfigured' });
    }

    try {
        const upstream = await fetch(upstreamUrl, { redirect: 'follow' });
        if (!upstream.ok) {
            return json(res, 502, { ok: false, error: 'upstream_error' });
        }

        // Apps Script may serve JSON with a text/html content type.
        const text = await upstream.text();
        let data;
        try { data = JSON.parse(text); }
        catch { return json(res, 502, { ok: false, error: 'upstream_invalid' }); }

        // Cache at the CDN edge for 5 min; serve stale while revalidating.
        // Matches the sheet's own ~5 min publish latency.
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return json(res, 200, data);
    } catch (err) {
        console.error('Upstream fetch failed:', err);
        return json(res, 502, { ok: false, error: 'upstream_unreachable' });
    }
};
