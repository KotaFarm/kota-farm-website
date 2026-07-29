// GET /api/auth/callback — Google redirects here after consent
// Exchanges the authorization code for tokens, extracts user info,
// stores a signed session cookie, and redirects to the app.

const crypto = require('crypto');

// ── Helpers ──────────────────────────────────────────────────

function parseCookies(header) {
    var map = {};
    (header || '').split(';').forEach(function (pair) {
        var parts = pair.trim().split('=');
        if (parts.length >= 2) map[parts[0]] = parts.slice(1).join('=');
    });
    return map;
}

// HMAC-sign a JSON payload → base64url(payload).base64url(sig)
function signSession(payload, secret) {
    var json = JSON.stringify(payload);
    var b64 = Buffer.from(json).toString('base64url');
    var sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
    return b64 + '.' + sig;
}

// ── Handler ──────────────────────────────────────────────────

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    var clientId     = process.env.GOOGLE_CLIENT_ID;
    var clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    var authSecret   = process.env.AUTH_SECRET;

    if (!clientId || !clientSecret || !authSecret) {
        return res.status(500).json({ error: 'server_misconfigured' });
    }

    var code  = req.query.code;
    var state = req.query.state;
    var error = req.query.error;

    if (error) {
        return res.redirect('/app/?auth_error=' + encodeURIComponent(error));
    }
    if (!code || !state) {
        return res.redirect('/app/?auth_error=missing_params');
    }

    // Verify CSRF state
    var cookies = parseCookies(req.headers.cookie);
    if (!cookies.oauth_state || cookies.oauth_state !== state) {
        return res.redirect('/app/?auth_error=state_mismatch');
    }

    // Clear the state cookie
    res.setHeader('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; Max-Age=0');

    // Exchange code for tokens
    var proto = req.headers['x-forwarded-proto'] || 'https';
    var host  = req.headers['x-forwarded-host'] || req.headers.host;
    var redirectUri = proto + '://' + host + '/api/auth/callback';

    var tokenRes;
    try {
        tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }).toString()
        });
    } catch (e) {
        return res.redirect('/app/?auth_error=token_exchange_failed');
    }

    if (!tokenRes.ok) {
        return res.redirect('/app/?auth_error=token_exchange_failed');
    }

    var tokens = await tokenRes.json();

    // Get user info from Google
    var userRes;
    try {
        userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: 'Bearer ' + tokens.access_token }
        });
    } catch (e) {
        return res.redirect('/app/?auth_error=userinfo_failed');
    }

    if (!userRes.ok) {
        return res.redirect('/app/?auth_error=userinfo_failed');
    }

    var user = await userRes.json();

    // Build session payload
    var session = {
        email: user.email,
        name: user.name || '',
        picture: user.picture || '',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600  // 7 days
    };

    var signed = signSession(session, authSecret);

    // Set session cookie (7 days, HttpOnly, Secure)
    var cookieStr = 'farm_session=' + signed +
        '; Path=/' +
        '; HttpOnly' +
        '; SameSite=Lax' +
        '; Max-Age=' + (7 * 24 * 3600) +
        '; Secure';

    res.setHeader('Set-Cookie', cookieStr);
    res.redirect('/app/');
};
