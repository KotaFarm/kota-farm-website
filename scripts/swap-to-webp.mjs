#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
//  Swap image refs to .webp — Kovana Natural Farm
//
//  What this does:
//    1. Walks every .html and *-config.js file in the repo.
//    2. For every reference to a .jpg / .jpeg / .png file, checks whether
//       a .webp sibling exists on disk (produced by optimize-images.mjs).
//    3. If a .webp sibling exists, rewrites the reference to .webp.
//    4. Leaves og:image / twitter:image meta tags untouched — some social
//       crawlers still don't consistently resolve WebP previews, and the
//       jpeg fallback on disk is fine for them.
//    5. Leaves external URLs (anything under //kotanaturalfarm.in/… or
//       http(s)://…) untouched, because we can't verify a .webp sibling
//       is actually deployed there. (These appear mainly in canonical
//       og:url / sitemap-ish places.)
//
//  Rationale:
//    The original JPEG/PNG stays on disk as a fallback. Anywhere a WebP
//    was produced, the WebP is smaller (the optimiser deletes WebPs that
//    aren't smaller than the original), so swapping is always a win.
//
//  Usage:
//    node scripts/swap-to-webp.mjs            # dry-run
//    node scripts/swap-to-webp.mjs --write    # actually edit files
// ──────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

const TARGET_FILE_RE = /\.(html|js)$/i;
const SKIP_DIRS      = new Set(['node_modules', '.git', '.next', 'dist', 'build', '_site', 'scripts']);

// Only touch config files for JS — not every JS file.
function wantFile(relPath) {
    const base = path.basename(relPath);
    if (relPath.endsWith('.html')) return true;
    if (base.endsWith('-config.js')) return true;
    return false;
}

async function* walk(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
            yield* walk(full);
        } else if (entry.isFile() && TARGET_FILE_RE.test(entry.name)) {
            const rel = path.relative(ROOT, full);
            if (wantFile(rel)) yield full;
        }
    }
}

// We match image paths inside the three contexts they realistically
// appear: double-quoted strings, single-quoted strings, and CSS
// url(...) values. This also handles filenames with spaces (common
// for WhatsApp-origin photos), which a bare word-boundary regex
// would chop in half.
//
// The captured group (1) is the path itself — no quotes, no url(…).
const QUOTED_REFS = [
    { re: /"([^"]+?\.(?:jpe?g|png))"/gi,        wrap: (t) => '"' + t + '"' },
    { re: /'([^']+?\.(?:jpe?g|png))'/gi,        wrap: (t) => "'" + t + "'" },
    { re: /url\(([^)]+?\.(?:jpe?g|png))\)/gi,   wrap: (t) => 'url(' + t + ')' }
];

// Skip lines (by content) we should not modify. This is a belt-and-braces
// approach; we also check for social-meta lines via the line itself.
function shouldSkipOccurrence(fullLine, token) {
    // External URLs — we can't verify WebP exists on that domain.
    if (/^\/\//.test(token)) return true;
    if (/^https?:\/\//i.test(token)) return true;
    // og:image / twitter:image — keep jpeg for social crawlers.
    if (/property=["']og:image["']/i.test(fullLine))       return true;
    if (/name=["']twitter:image["']/i.test(fullLine))      return true;
    if (/property=["']og:image:secure_url["']/i.test(fullLine)) return true;
    return false;
}

function resolveCandidates(filePath, token) {
    // Return an array of possible on-disk locations a given token
    // could resolve to. We try them in order and swap if ANY one has
    // a .webp sibling.
    const dirOfFile = path.dirname(filePath);
    const base      = path.basename(filePath);
    let t = token;
    if (t.startsWith('./')) t = t.slice(2);

    const out = [];

    // Site-root absolute.
    if (t.startsWith('/')) {
        out.push(path.join(ROOT, t.slice(1)));
        return out;
    }

    // Relative to the file that contains the reference.
    out.push(path.resolve(dirOfFile, t));

    // gallery-config.js entries are prefixed with 'gallery/' at runtime
    // by main.js — try that too.
    if (base === 'gallery-config.js') {
        out.push(path.resolve(ROOT, 'gallery', t));
    }

    // Site-root as an additional fallback (some HTML uses root-relative
    // paths without a leading slash, rare but possible).
    out.push(path.resolve(ROOT, t));

    return out;
}

function webpVersion(absPath) {
    return absPath.replace(/\.(jpe?g|png)$/i, '.webp');
}

function relFromRoot(p) {
    return path.relative(ROOT, p);
}

async function processFile(filePath) {
    const src = await fs.readFile(filePath, 'utf8');
    const lines = src.split('\n');
    let changed = false;
    const swaps = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let lineChanged = false;

        for (const { re, wrap } of QUOTED_REFS) {
            re.lastIndex = 0;
            line = line.replace(re, (full, inner) => {
                // `inner` is the path without the surrounding quotes / url().
                if (shouldSkipOccurrence(line, inner)) return full;

                const candidates = resolveCandidates(filePath, inner);
                const hasWebp    = candidates.some(c => existsSync(webpVersion(c)));
                if (!hasWebp) return full;

                const swappedInner = inner.replace(/\.(jpe?g|png)$/i, '.webp');
                swaps.push({ line: i + 1, from: inner, to: swappedInner });
                lineChanged = true;
                return wrap(swappedInner);
            });
        }

        if (lineChanged) {
            lines[i] = line;
            changed  = true;
        }
    }

    return { changed, newSrc: lines.join('\n'), swaps };
}

async function main() {
    let fileCount    = 0;
    let totalSwaps   = 0;
    const perFile    = [];

    for await (const f of walk(ROOT)) {
        const { changed, newSrc, swaps } = await processFile(f);
        if (!changed) continue;
        fileCount++;
        totalSwaps += swaps.length;
        perFile.push({ file: relFromRoot(f), swaps });
        if (WRITE) {
            await fs.writeFile(f, newSrc, 'utf8');
        }
    }

    // Report.
    for (const entry of perFile) {
        console.log(`\n${entry.file}  (${entry.swaps.length} swap${entry.swaps.length === 1 ? '' : 's'})`);
        for (const s of entry.swaps) {
            console.log(`  L${s.line}: ${s.from}  ->  ${s.to}`);
        }
    }

    console.log('\n──────────────────────────────────────────────');
    console.log(`  Files ${WRITE ? 'updated' : 'would update'}: ${fileCount}`);
    console.log(`  Total swaps:           ${totalSwaps}`);
    if (!WRITE) {
        console.log('  (dry-run — pass --write to apply)');
    }
    console.log('──────────────────────────────────────────────');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
