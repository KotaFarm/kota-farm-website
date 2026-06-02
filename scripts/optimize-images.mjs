#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
//  Image optimiser — Kovana Natural Farm
//
//  What this does:
//    1. Walks the whole repo looking for .jpg / .jpeg / .png images.
//    2. For every image that doesn't already have a matching .webp sibling
//       (or has one that's out-of-date), generates a .webp in the same
//       folder at quality 82, downsizing anything wider than MAX_WIDTH.
//    3. Strips EXIF / colour-profile metadata.
//    4. Leaves the original JPEG/PNG alone — it stays on disk as a
//       fallback and is preserved in git.
//
//  Usage:
//    node scripts/optimize-images.mjs            # optimise every image
//    node scripts/optimize-images.mjs --force    # rebuild .webp even if
//                                                # up-to-date
//    node scripts/optimize-images.mjs path/...   # limit to a sub-path
//
//  Typical output:
//    optimised: gallery/practices/irrigation/sprinkler.jpeg
//      5.16 MB  ->  412.3 KB  (WebP, 2000x1500, -92%)
//    ...
//    --- Total saved: 41.7 MB across 142 images ---
//
//  Requirements:
//    npm install --no-save sharp
// ──────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let sharp;
try {
    sharp = (await import('sharp')).default;
} catch (err) {
    console.error("This script needs 'sharp'. Install it with:");
    console.error("    npm install --no-save sharp");
    process.exit(1);
}

// ─── Config ────────────────────────────────────────────────────────────────
//
//  MAX_WIDTH = 1600 is plenty for 2× retina at ~800px render width, which
//  covers every hero / card / photo-grid image on this site.
//
//  QUALITY = 78 is visually indistinguishable from 82-85 for foliage /
//  landscape photography, but produces noticeably smaller files on the
//  already-compressed WhatsApp images that dominate this site.
//
//  KEEP_IF_NOT_SMALLER: when WebP is >= the original JPEG size (common for
//  aggressively pre-compressed WhatsApp photos), we delete the WebP — there's
//  no point shipping a worse-compressed alternate format. HTML uses <picture>
//  with a WebP <source> and a JPEG <img> fallback, so browsers transparently
//  fall back to the JPEG for those images.
// ──────────────────────────────────────────────────────────────────────────
const MAX_WIDTH       = 1600;
const QUALITY         = 78;
const SKIP_DIRS       = new Set([
    'node_modules', '.git', '.next', 'dist', 'build', '_site', 'scripts'
]);
const IMAGE_EXT_RE    = /\.(jpe?g|png)$/i;

// ─── Args ──────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const FORCE      = args.includes('--force');
const ROOT       = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const subpaths   = args.filter(a => !a.startsWith('--'));
const startPaths = subpaths.length > 0
    ? subpaths.map(p => path.resolve(process.cwd(), p))
    : [ROOT];

// ─── Helpers ───────────────────────────────────────────────────────────────
function humanSize(bytes) {
    if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    if (bytes > 1024)        return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}

async function* walkImages(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch { return; }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
            yield* walkImages(full);
        } else if (entry.isFile() && IMAGE_EXT_RE.test(entry.name)) {
            yield full;
        }
    }
}

function webpPathFor(imgPath) {
    return imgPath.replace(IMAGE_EXT_RE, '.webp');
}

function needsRebuild(src, dest) {
    if (!existsSync(dest)) return true;
    try {
        return statSync(src).mtimeMs > statSync(dest).mtimeMs;
    } catch {
        return true;
    }
}

async function optimiseOne(src) {
    const dest = webpPathFor(src);
    const rel  = path.relative(ROOT, src);

    if (!FORCE && !needsRebuild(src, dest)) {
        return { src, skipped: true };
    }

    const inputStat  = await fs.stat(src);
    const image      = sharp(src, { failOn: 'none' }).rotate(); // respect EXIF orientation
    const meta       = await image.metadata();
    const targetW    = meta.width && meta.width > MAX_WIDTH ? MAX_WIDTH : null;

    const pipeline = targetW
        ? image.resize({ width: targetW, withoutEnlargement: true })
        : image;

    await pipeline
        .webp({ quality: QUALITY, effort: 5 })
        .withMetadata({ exif: {}, icc: undefined })  // strip EXIF/ICC
        .toFile(dest);

    const outStat = await fs.stat(dest);
    const outMeta = await sharp(dest).metadata();

    // If WebP isn't actually smaller, scrap it and keep only the JPEG.
    // (Very common for images already hard-compressed by WhatsApp.)
    if (outStat.size >= inputStat.size) {
        await fs.unlink(dest);
        console.log(
            `kept JPEG: ${rel}  (WebP would be ${humanSize(outStat.size)}, ` +
            `no smaller than ${humanSize(inputStat.size)})`
        );
        return { src, skipped: false, kept: 'jpeg', inSize: inputStat.size, outSize: inputStat.size };
    }

    const saved = inputStat.size - outStat.size;
    const pct   = ((saved / inputStat.size) * 100).toFixed(0);

    console.log(
        `optimised: ${rel}\n` +
        `  ${humanSize(inputStat.size)}  ->  ${humanSize(outStat.size)}  ` +
        `(WebP, ${outMeta.width}x${outMeta.height}, -${pct}%)`
    );

    return { src, dest, inSize: inputStat.size, outSize: outStat.size, skipped: false, kept: 'webp' };
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
    const images = [];
    for (const start of startPaths) {
        const isFile = existsSync(start) && (await fs.stat(start)).isFile();
        if (isFile) {
            images.push(start);
        } else {
            for await (const f of walkImages(start)) images.push(f);
        }
    }

    if (images.length === 0) {
        console.log('No JPEG/PNG images found.');
        return;
    }

    console.log(`Found ${images.length} source image(s). Optimising...\n`);

    let totalIn     = 0;
    let totalOut    = 0;
    let webpMade    = 0;
    let keptJpeg    = 0;
    let skipped     = 0;
    let failed      = 0;

    for (const img of images) {
        try {
            const r = await optimiseOne(img);
            if (r.skipped) {
                skipped++;
            } else if (r.kept === 'webp') {
                webpMade++;
                totalIn  += r.inSize;
                totalOut += r.outSize;
            } else if (r.kept === 'jpeg') {
                keptJpeg++;
            }
        } catch (err) {
            failed++;
            console.error(`FAILED: ${path.relative(ROOT, img)}\n  ${err.message}`);
        }
    }

    console.log('\n──────────────────────────────────────────────');
    console.log(`  WebP produced:    ${webpMade}   (replaces JPEG delivery)`);
    console.log(`  JPEG kept as-is:  ${keptJpeg}   (WebP wasn't smaller)`);
    console.log(`  Skipped:          ${skipped}   (already up to date)`);
    if (failed) console.log(`  Failed:           ${failed}`);
    if (webpMade > 0) {
        const saved = totalIn - totalOut;
        const pct   = ((saved / totalIn) * 100).toFixed(0);
        console.log(`  Source weight:    ${humanSize(totalIn)}`);
        console.log(`  WebP weight:      ${humanSize(totalOut)}`);
        console.log(`  Saved on WebP:    ${humanSize(saved)}  (-${pct}%)`);
    }
    console.log('──────────────────────────────────────────────');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
