// POST /api/auth/logout — clear session cookie and redirect to app

module.exports = function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        res.setHeader('Allow', 'POST, GET');
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    res.setHeader('Set-Cookie', 'farm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');

    if (req.method === 'GET') {
        return res.redirect('/app/');
    }

    res.json({ ok: true });
};
