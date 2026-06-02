#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
//  Verify performance pass — Kovana Natural Farm
//
//  Sanity-checks the performance changes end-to-end:
//    1. vercel.json parses and has every rule we rely on.
//    2. sw.js parses, references a bumped cache version, and its
//       SHELL_URLS all exist on disk.
//    3. Every image ref in every HTML/config file resolves to a real
//       file on disk (catches typos, missing webp after swap).
//    4. Every image referenced in SHELL_URLS exists.
//    5. No `.jpg` ref anywhere still has a `.webp` sibling that
//       should have been swapped — i.e. swap-to-webp.mjs is caught up.
// ──────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
function fail(msg)  { fails.push(msg); }
function ok(msg)    { console.log('  OK  ' + msg); }

// ── 1. vercel.json ────────────────────────────────────────────────────────
console.log('\n[1] vercel.json');
{
    const raw = await fs.readFile(path.join(ROOT, 'vercel.json'), 'utf8');
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { fail('vercel.json invalid JSON: ' + e.message); }

    const sources = (parsed?.headers || []).map(h => h.source).join(' ');
    for (const needed of ['X-Content-Type-Options', 'max-age=31536000', 'must-revalidate', 'sw.js']) {
        if (raw.includes(needed)) ok('has "' + needed + '"');
        else fail('vercel.json missing "' + needed + '"');
    }
}

// ── 2. sw.js ──────────────────────────────────────────────────────────────
console.log('\n[2] sw.js');
{
    const sw = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
    const verMatch = sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
    if (!verMatch) fail('CACHE_NAME not found');
    else if (!verMatch[1].match(/-v\d+$/)) fail('CACHE_NAME does not end with -vN: ' + verMatch[1]);
    else ok('CACHE_NAME = ' + verMatch[1]);

    // Extract SHELL_URLS array via literal parsing.
    const shellMatch = sw.match(/SHELL_URLS\s*=\s*\[([\s\S]*?)\]/);
    if (!shellMatch) fail('SHELL_URLS not found');
    else {
        const urls = [...shellMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
        for (const u of urls) {
            if (u === '/') continue;
            const disk = path.join(ROOT, u.replace(/^\//, ''));
            if (existsSync(disk)) ok('shell resource exists: ' + u);
            else fail('SHELL_URLS points to missing file: ' + u);
        }
    }

    if (sw.includes('trimImageCache')) ok('has trimImageCache helper');
    else fail('sw.js missing trimImageCache');
}

// ── 3 & 5. Image refs across HTML/config files ────────────────────────────
console.log('\n[3] Image references in HTML + config JS');
const REF_PATTERNS = [
    /"([^"]+?\.(?:jpe?g|png|webp))"/gi,
    /'([^']+?\.(?:jpe?g|png|webp))'/gi,
    /url\(([^)]+?\.(?:jpe?g|png|webp))\)/gi,
];
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'scripts']);

async function* walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(full);
        else if (/\.html$/i.test(entry.name) || /-config\.js$/.test(entry.name)) yield full;
    }
}

function isExternal(ref) {
    return /^https?:\/\//i.test(ref) || ref.startsWith('//');
}

function resolveCandidates(filePath, token) {
    const dirOfFile = path.dirname(filePath);
    const base = path.basename(filePath);
    let t = token;
    if (t.startsWith('./')) t = t.slice(2);
    const out = [];
    if (t.startsWith('/')) { out.push(path.join(ROOT, t.slice(1))); return out; }
    out.push(path.resolve(dirOfFile, t));
    if (base === 'gallery-config.js') out.push(path.resolve(ROOT, 'gallery', t));
    out.push(path.resolve(ROOT, t));
    return out;
}

let missing = 0;
let jpgWithWebpSibling = 0;
let checked = 0;

for await (const file of walk(ROOT)) {
    const src = await fs.readFile(file, 'utf8');
    for (const re of REF_PATTERNS) {
        re.lastIndex = 0;
        for (const m of src.matchAll(re)) {
            const ref = m[1];
            if (isExternal(ref)) continue;
            checked++;
            const candidates = resolveCandidates(file, ref);
            if (!candidates.some(c => existsSync(c))) {
                missing++;
                fail('broken ref: ' + path.relative(ROOT, file) + ' → ' + ref);
            }
            if (/\.jpe?g$/i.test(ref)) {
                const webpCandidates = candidates.map(c => c.replace(/\.jpe?g$/i, '.webp'));
                if (webpCandidates.some(c => existsSync(c))) {
                    jpgWithWebpSibling++;
                    fail('unswapped .jpg (webp exists): ' + path.relative(ROOT, file) + ' → ' + ref);
                }
            }
        }
    }
}
ok('checked ' + checked + ' image refs');
if (missing === 0) ok('zero broken refs');
if (jpgWithWebpSibling === 0) ok('zero unswapped .jpg refs (webp always picked when available)');

// ── Final verdict ─────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────');
if (fails.length === 0) {
    console.log('  ALL CHECKS PASSED');
} else {
    console.log('  FAILURES (' + fails.length + '):');
    for (const f of fails) console.log('    - ' + f);
    process.exitCode = 1;
}
console.log('──────────────────────────────────────────────');
