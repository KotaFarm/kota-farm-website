# Google OAuth Setup — Farm Manager App

Auth runs entirely on Vercel serverless functions. No Supabase needed.

---

## How it works

1. User clicks "Sign in with Google" → redirects to `/api/auth/google`
2. `/api/auth/google` redirects to Google's OAuth consent screen
3. Google redirects back to `/api/auth/callback` with an authorization code
4. `/api/auth/callback` exchanges the code for tokens, fetches user info, sets an HttpOnly session cookie, and redirects to `/app/`
5. Frontend calls `/api/auth/me` to check if the user is signed in
6. `/api/auth/logout` clears the cookie

---

## Step 1 — Create Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Name: `Farm Manager`
7. **Authorized redirect URIs** — add:
   - `https://your-domain.vercel.app/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for local dev)
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

If you haven't configured the OAuth consent screen yet:
- Go to **APIs & Services → OAuth consent screen**
- User type: **External** (unless you have Google Workspace)
- Fill in app name, support email
- Add scopes: `openid`, `email`, `profile`
- Add your email as a test user (while in "Testing" mode)

---

## Step 2 — Set Vercel environment variables

Go to your Vercel project → **Settings → Environment Variables**. Add these three:

| Name | Value | Environments |
|------|-------|--------------|
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` | Production, Preview, Development |
| `AUTH_SECRET` | Random 32+ char string (run `openssl rand -hex 32`) | Production, Preview, Development |

---

## Step 3 — Deploy

```bash
git add api/auth/
git commit -m "Add Google OAuth via Vercel serverless functions"
git push
```

Vercel auto-detects the `api/auth/*.js` files as serverless functions.

---

## Step 4 — Test

1. Open `https://your-domain.vercel.app/app/`
2. Click "Sign in with Google"
3. Complete Google login
4. You should be redirected back to the app, signed in
5. Check the cookie: `farm_session` should be set (HttpOnly, not visible in JS)

---

## Files

| File | Purpose |
|------|---------|
| `api/auth/google.js` | Redirects to Google OAuth consent |
| `api/auth/callback.js` | Exchanges code for tokens, sets session cookie |
| `api/auth/me.js` | Returns current user from cookie (or 401) |
| `api/auth/logout.js` | Clears session cookie |
| `app/config.js` | App config (API_BASE now points to `/api`) |
| `app/app.js` | Frontend (uses `/api/auth/*` instead of Supabase) |

---

## Security notes

- Session is an HMAC-signed cookie (not a JWT — simpler, same security for this use case)
- Cookie is `HttpOnly` + `Secure` + `SameSite=Lax` — not accessible from JavaScript
- CSRF protection via `oauth_state` cookie during the OAuth flow
- Session expires after 7 days
- `AUTH_SECRET` must stay secret — rotate it to invalidate all sessions
