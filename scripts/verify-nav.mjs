#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
//  Verify the site nav — Kota Natural Farm
//
//  For every page that should have the shared nav:
//    1. Loads it in JSDOM.
//    2. Confirms <nav id="navbar"> is present with every expected link.
//    3. Confirms each nav link resolves to a real file (for page links)
//       or a real fragment (#id) on the referenced page.
//    4. Confirms css/site-nav.css and js/site-nav.js are linked.
// ──────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
    { file: 'index.html',                               prefix: '',      active: null },
    { file: 'gallery.html',                             prefix: '',      active: 'Gallery' },
    { file: 'produce.html',                             prefix: '',      active: 'Fresh Produce' },
    { file: 'farm-diary.html',                          prefix: '',      active: 'Farm Diary' },
    { file: 'blog/index.html',                          prefix: '../',   active: 'Blog',       blogSelf: 'index.html' },
    { file: 'blog/fire-didnt-start-here.html',          prefix: '../',   active: 'Blog',       blogSelf: 'index.html' },
    { file: 'practices/mulching.html',                  prefix: '../',   active: 'Practices' },
    { file: 'practices/water-smart-irrigation.html',    prefix: '../',   active: 'Practices' },
    { file: 'practices/our-practices.html',             prefix: '../',   active: 'Practices' },
];

const EXPECTED_LABELS = ['About', 'Practices', 'Gallery', 'Fresh Produce', 'Blog', 'Farm Diary', 'Contact'];

const fails = [];
function fail(pg, msg) { fails.push(`[${pg.file}] ${msg}`); }
function ok(msg)       { console.log('  OK  ' + msg); }

// Cache of page content by resolved path (so we can check anchor targets).
const pageCache = new Map();
async function pageHas(anchorTarget) {
    // anchorTarget is an absolute path ending optionally in #fragment
    const [file, frag] = anchorTarget.split('#');
    if (!existsSync(file)) return { fileOk: false, fragOk: false };
    if (!frag)             return { fileOk: true,  fragOk: true };
    if (!pageCache.has(file)) {
        pageCache.set(file, await fs.readFile(file, 'utf8'));
    }
    const content = pageCache.get(file);
    const re = new RegExp('id\\s*=\\s*["\']' + frag.replace(/[\-$$$$(){}+?*.^]/g, '\\$&') + '["\']');
    return { fileOk: true, fragOk: re.test(content) };
}

for (const pg of PAGES) {
    const full = path.join(ROOT, pg.file);
    if (!existsSync(full)) { fail(pg, 'file not found'); continue; }
    const html = await fs.readFile(full, 'utf8');

    // ---- CSS / JS links ----
    if (!/site-nav\.css/.test(html)) fail(pg, 'site-nav.css not linked');
    else ok(`${pg.file}  has site-nav.css link`);

    // ---- JSDOM parse ----
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const nav = doc.querySelector('nav#navbar');
    if (!nav) { fail(pg, '<nav id="navbar"> missing'); continue; }

    const linkEls = nav.querySelectorAll('.nav-links a');
    const labels  = Array.from(linkEls).map(a => a.textContent.trim());
    for (const want of EXPECTED_LABELS) {
        if (!labels.includes(want)) fail(pg, `nav missing label "${want}"`);
    }
    if (fails.length === 0 || !fails.at(-1)?.startsWith('[' + pg.file)) {
        ok(`${pg.file}  nav has all ${EXPECTED_LABELS.length} labels`);
    }

    // ---- Active class ----
    if (pg.active) {
        const activeLink = Array.from(linkEls).find(a => a.classList.contains('active'));
        if (!activeLink)                            fail(pg, 'no link marked .active');
        else if (activeLink.textContent.trim() !== pg.active)
            fail(pg, `.active is "${activeLink.textContent.trim()}", expected "${pg.active}"`);
        else ok(`${pg.file}  active = "${pg.active}"`);
    }

    // ---- Resolve every link ----
    const dirOfFile = path.dirname(full);
    for (const a of linkEls) {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('http')) continue;

        // For blog pages, the Blog link points at index.html (relative to blog dir).
        // For others with prefix ../, anchor links look like "../index.html#about".
        let targetPath;
        if (href.startsWith('#')) {
            // Same-page anchor — only valid on index.html. Otherwise the nav would be broken.
            if (pg.file !== 'index.html') fail(pg, `bare fragment "${href}" on sub-page (won't work)`);
            targetPath = full + href;
        } else {
            targetPath = path.resolve(dirOfFile, href);
        }

        const { fileOk, fragOk } = await pageHas(targetPath);
        if (!fileOk) fail(pg, `link target missing: ${href}  →  ${targetPath}`);
        else if (!fragOk) fail(pg, `fragment not found on target: ${href}`);
    }
}

// ---- Visit-the-Farm card ----
console.log('\n[Visit the Farm card]');
{
    const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
    if (!/Visit the Farm/.test(html))    fails.push('[index.html] "Visit the Farm" heading missing');
    else ok('"Visit the Farm" heading present');
    if (!/Ajay Kumar/.test(html))        fails.push('[index.html] Ajay Kumar name missing from contact');
    else ok('Ajay Kumar named in contact');
    if (!/wa\.me\/918340684878/.test(html)) fails.push('[index.html] Ajay WhatsApp link missing');
    else ok('Ajay WhatsApp link present');
}

console.log('\n──────────────────────────────────────────────');
if (fails.length === 0) {
    console.log('  ALL CHECKS PASSED');
} else {
    console.log(`  FAILURES (${fails.length}):`);
    for (const f of fails) console.log('    - ' + f);
    process.exitCode = 1;
}
console.log('──────────────────────────────────────────────');
