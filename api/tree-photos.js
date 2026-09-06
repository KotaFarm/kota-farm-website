/**
 * /api/tree-photos — resolves AppSheet image paths to displayable Drive URLs.
 *
 * Why this exists:
 *   AppSheet stores "Progress_Images/32809586.Photo Full.033606.jpg" in the
 *   sheet — a path, not a URL. Drive only serves files by an opaque per-file
 *   ID assigned at upload, and there is no folder+filename URL form. The
 *   browser can't do the lookup either: Drive sends no CORS headers on folder
 *   listings, so a fetch from the page is blocked.
 *
 *   So the translation has to happen server-side. This walks the Progress
 *   images folder once, and returns { filename: thumbnailUrl }. The website
 *   matches on the basename of whatever the sheet holds.
 *
 *   The alternative was a per-photo thumbnail column filled by Apps Script.
 *   This keeps everything in one repo instead of a second codebase.
 *
 * Env:
 *   GOOGLE_DRIVE_API_KEY — Drive API key, restricted to the Drive API.
 *                          Only reads publicly-shared files; it cannot
 *                          authenticate as a user, so private Drive is safe.
 */

const FOLDER_ID = '1x_tQp3hjLo7-7um3u2ExSOxjUR6jW5fq';
const THUMB_WIDTH = 800;

// Guard against a pathological folder tree eating the function's time budget.
const MAX_FOLDERS = 25;
const MAX_FILES = 2000;

function json(res, status, body) {
    res.status(status).setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(body));
}

// One page of a folder's children. Drive paginates at 1000.
async function listFolder(folderId, apiKey, pageToken) {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', `'${folderId}' in parents and trashed = false`);
    url.searchParams.set('fields', 'nextPageToken, files(id, name, mimeType)');
    url.searchParams.set('pageSize', '1000');
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const r = await fetch(url.toString());
    if (!r.ok) {
        const text = await r.text();
        throw new Error(`Drive ${r.status}: ${text.slice(0, 200)}`);
    }
    return r.json();
}

/**
 * Walk the folder and its subfolders, building { filename: fileId }.
 * Recursion matters: AppSheet nests images in a per-table subfolder
 * (Progress_Images), so the configured id may be the parent or the
 * image folder itself — both work.
 */
async function buildIndex(rootId, apiKey) {
    const index = {};
    const queue = [rootId];
    let folders = 0;
    let files = 0;

    while (queue.length && folders < MAX_FOLDERS && files < MAX_FILES) {
        const folderId = queue.shift();
        folders++;

        let pageToken;
        do {
            const page = await listFolder(folderId, apiKey, pageToken);
            for (const f of page.files || []) {
                if (f.mimeType === 'application/vnd.google-apps.folder') {
                    queue.push(f.id);
                } else {
                    index[f.name] = f.id;
                    files++;
                }
            }
            pageToken = page.nextPageToken;
        } while (pageToken && files < MAX_FILES);
    }

    return { index, folders, files };
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return json(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_DRIVE_API_KEY not configured');
        return json(res, 500, { ok: false, error: 'server_misconfigured' });
    }

    try {
        const { index, folders, files } = await buildIndex(FOLDER_ID, apiKey);

        const photos = {};
        for (const [name, id] of Object.entries(index)) {
            photos[name] = `https://drive.google.com/thumbnail?id=${id}&sz=w${THUMB_WIDTH}`;
        }

        // File IDs never change once uploaded, so this is safe to cache hard.
        // New photos appear within the stale window.
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
        return json(res, 200, { ok: true, count: files, folders, photos });
    } catch (err) {
        console.error('tree-photos failed:', err.message);
        return json(res, 502, { ok: false, error: 'drive_unreachable' });
    }
};
