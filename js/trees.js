/* ──────────────────────────────────────────────────────────────
   Tree progress — data layer + rendering

   Three sheets joined:
     Trees     — one row per tagged tree (Tag, Crop ref, Zone, Status)
     Progress  — many rows per tree (Date, four photo paths, Notes)
     Crops     — species names, so nothing is hardcoded here

   Photos: the sheet holds AppSheet paths, not URLs. /api/tree-photos
   returns { filename: driveThumbnailUrl }; we match on basename. If that
   endpoint is unavailable (local dev, or Drive down) the page still
   renders — cards just show a leaf placeholder instead of a photo.
   ────────────────────────────────────────────────────────────── */

(function (global) {
    'use strict';

    var PUB = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZb8u89bi2HsIKPs5YVB-Sd8aeX7MiOWhTySr-K7K0mr977JfSOUIC84XEGjs4nQUmfnaDoNIBIPTR/pub';

    var TABS = {
        trees: '1245833071',
        progress: '487978654',
        crops: '1369701246'
    };

    // Photo columns, in the order they should appear in the viewer.
    var PHOTO_KINDS = [
        { header: 'photo full',   label: 'Whole tree' },
        { header: 'photo trunk',  label: 'Trunk' },
        { header: 'photo leaves', label: 'Leaves' },
        { header: 'photo extra',  label: 'Detail' }
    ];

    // ── CSV ───────────────────────────────────────────────
    function parseCsv(csv) {
        return String(csv).trim().split(/\r?\n/).map(function (line) {
            var cells = [], cur = '', inQuotes = false;
            for (var i = 0; i < line.length; i++) {
                var ch = line[i];
                if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
                else if (ch === '"') inQuotes = !inQuotes;
                else if (ch === ',' && !inQuotes) { cells.push(cur); cur = ''; }
                else cur += ch;
            }
            cells.push(cur);
            return cells;
        });
    }

    // Rows as objects keyed by lowercased header.
    function rowsToObjects(csv) {
        var rows = parseCsv(csv);
        if (rows.length < 2) return [];
        var headers = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
        return rows.map(function (r) {
            var o = {};
            headers.forEach(function (h, i) { o[h] = (r[i] || '').trim(); });
            return o;
        }).filter(function (o) { return o.id; });
    }

    function csvUrl(gid) { return PUB + '?gid=' + gid + '&single=true&output=csv'; }

    function fetchText(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        });
    }

    // ── Dates ─────────────────────────────────────────────
    function parseDate(str) {
        if (!str) return null;
        var s = String(str).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s + 'T00:00:00');
        var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (m) return new Date(+m[3], +m[1] - 1, +m[2]);
        var d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function fmtDate(d) {
        if (!d) return '';
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // "3 months" / "12 days" — how long a tree has been followed.
    function sinceLabel(d) {
        if (!d) return '';
        var days = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (days < 1) return 'today';
        if (days === 1) return '1 day';
        if (days < 31) return days + ' days';
        var months = Math.round(days / 30.4);
        if (months < 12) return months + (months === 1 ? ' month' : ' months');
        var years = (days / 365).toFixed(1).replace(/\.0$/, '');
        return years + (years === '1' ? ' year' : ' years');
    }

    // ── Photos ────────────────────────────────────────────
    // Sheet holds "Progress_Images/32809586.Photo Full.033606.jpg"; the
    // endpoint keys on the bare filename.
    function basename(path) {
        return String(path || '').split('/').pop().trim();
    }

    function loadPhotoMap() {
        return fetch('/api/tree-photos')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { return (d && d.ok && d.photos) ? d.photos : {}; })
            .catch(function () { return {}; });
    }

    // ── Load + join ───────────────────────────────────────
    function load() {
        return Promise.all([
            fetchText(csvUrl(TABS.trees)),
            fetchText(csvUrl(TABS.progress)).catch(function () { return ''; }),
            fetchText(csvUrl(TABS.crops)).catch(function () { return ''; }),
            loadPhotoMap()
        ]).then(function (r) {
            return build(r[0], r[1], r[2], r[3]);
        });
    }

    function build(treesCsv, progressCsv, cropsCsv, photoMap) {
        // Species lookup — names come from the sheet, never hardcoded.
        var cropName = {};
        rowsToObjects(cropsCsv).forEach(function (c) {
            cropName[c.id] = c.crop || '';
        });

        var trees = {};
        var order = [];
        rowsToObjects(treesCsv).forEach(function (t) {
            trees[t.id] = {
                id: t.id,
                tag: t.tag || '',
                species: cropName[t.crop] || t.crop || 'Unknown',
                zone: t.zone || '',
                status: t.status || '',
                tagged: parseDate(t['tagged date']),
                notes: t.notes || '',
                visits: []
            };
            order.push(t.id);
        });

        rowsToObjects(progressCsv).forEach(function (p) {
            var tree = trees[p.tree];
            if (!tree) return;

            var photos = [];
            PHOTO_KINDS.forEach(function (kind) {
                var file = basename(p[kind.header]);
                if (!file) return;
                var url = photoMap[file];
                if (url) photos.push({ label: kind.label, url: url });
            });

            tree.visits.push({
                id: p.id,
                date: parseDate(p.date),
                notes: p.notes || '',
                photos: photos
            });
        });

        // Newest visit first — the current state of the tree leads.
        Object.keys(trees).forEach(function (id) {
            trees[id].visits.sort(function (a, b) {
                return (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0);
            });
        });

        return order.map(function (id) { return trees[id]; })
                    .sort(function (a, b) { return a.tag.localeCompare(b.tag); });
    }

    global.TreeProgress = {
        load: load,
        build: build,
        parseCsv: parseCsv,
        rowsToObjects: rowsToObjects,
        parseDate: parseDate,
        fmtDate: fmtDate,
        sinceLabel: sinceLabel,
        basename: basename,
        PHOTO_KINDS: PHOTO_KINDS,
        TABS: TABS
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = global.TreeProgress;

})(typeof window !== 'undefined' ? window : globalThis);
