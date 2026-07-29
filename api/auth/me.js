// GET /api/auth/me — return current user from session cookie, or 401

const crypto = require('crypto');

function parseCookies(header) {
    var map = {};
    (header || '').split(';').forEach(function (pair) {
        var parts = pair.trim().split('=');
        if (parts.length >= 2) map[parts[0]] = parts.slice(1).join('=');
    });
    return map;
}

function verifySession(cookie, secret) {
    if (!cookie) return null;
    var parts = cookie.split('.');
    if (parts.length !== 2) return null;

    var b64 = parts[0];
    var sig = parts[1];
    var expected = crypto.createHmac('sha256', secret).update(b64).digest('base64url');

    if (sig !== expected) return null;

    try {
        var payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
        // Check expiry
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch (e) {
        return null;
    }
}

module.exports = function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    var authSecret = process.env.AUTH_SECRET;

    // Local dev bypass: skip auth when no secret is configured
    if (!authSecret) {
        return res.json({
            email: 'dev@localhost',
            name: 'Dev Mode',
            picture: ''
        });
    }

    var cookies = parseCookies(req.headers.cookie);
    var user = verifySession(cookies.farm_session, authSecret);

    if (!user) {
        return res.status(401).json({ error: 'not_authenticated' });
    }

    res.json({
        email: user.email,
        name: user.name,
        picture: user.picture
    });
};
