// ─────────────────────────────────────────────────────────────
// Farm Diary — Kota Natural Farm
// ─────────────────────────────────────────────────────────────
// Diary entries now live in a Google Sheet (tab name: "Diary").
//
// To add or edit entries:
//   1. Open the Diary sheet
//   2. Add / edit / reorder rows  (newest first is conventional)
//   3. For photos: paste a Google Drive share link
//      (right-click image → Share → Anyone with the link → Viewer)
//   4. Changes go live within ~5 minutes
//
// Sheet columns (header row required, lowercase, in any order):
//   date  | title | tag | photo | note
//
// One-time setup: paste the published CSV URL into DIARY_CSV_URL below.
//   File → Share → Publish to web → Diary tab → CSV → Publish → copy URL
// ─────────────────────────────────────────────────────────────

(function () {
    'use strict';

    // Published CSV URL for the Diary tab of the Kota Farm sheet.
    // Republish (File → Share → Publish to web) if you ever rotate the link.
    var DIARY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZb8u89bi2HsIKPs5YVB-Sd8aeX7MiOWhTySr-K7K0mr977JfSOUIC84XEGjs4nQUmfnaDoNIBIPTR/pub?gid=481797168&single=true&output=csv';

    // Empty until fetch completes — render code shows a loading state.
    window.DIARY_ENTRIES = [];

    // ── Helpers ────────────────────────────────────────────
    var MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

    // "2026-05-01" → "May 1, 2026". Pass through anything that doesn't match ISO.
    function formatDate(s) {
        if (!s) return '';
        var m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (!m) return String(s);
        return MONTHS[parseInt(m[2], 10) - 1] + ' ' + parseInt(m[3], 10) + ', ' + m[1];
    }

    // Drive share URL → embeddable thumbnail URL. Robust against surrounding
    // text like "__https://...__" that some paste flows leave behind.
    function imageUrl(cell, size) {
        if (!cell) return '';
        var s = String(cell).trim();
        var m = s.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (!m) m = s.match(/drive\.google\.com\/(?:open|uc)\?[^"\s]*id=([a-zA-Z0-9_-]+)/);
        if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w' + (size || 1600);
        return s; // already a URL or local path — pass through
    }

    // CSV parser — handles quoted fields with embedded commas and "" escapes.
    // Multi-line cells (newline inside quotes) are also supported.
    function parseCsv(text) {
        var rows = [];
        var cur = '', cells = [], inq = false;
        var t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        for (var i = 0; i < t.length; i++) {
            var ch = t[i];
            if (ch === '"' && t[i + 1] === '"') { cur += '"'; i++; continue; }
            if (ch === '"') { inq = !inq; continue; }
            if (ch === ',' && !inq) { cells.push(cur); cur = ''; continue; }
            if (ch === '\n' && !inq) { cells.push(cur); rows.push(cells); cells = []; cur = ''; continue; }
            cur += ch;
        }
        if (cur.length || cells.length) { cells.push(cur); rows.push(cells); }
        return rows.filter(function (r) {
            return r.length && r.some(function (c) { return c && c.trim(); });
        });
    }

    function rowsToEntries(rows) {
        if (!rows.length) return [];
        var headers = rows.shift().map(function (h) { return String(h).trim().toLowerCase(); });
        var col = function (name) { return headers.indexOf(name); };
        var iDate  = col('date');
        var iTitle = col('title');
        var iTag   = col('tag');
        var iPhoto = col('photo');
        var iNote  = col('note');

        return rows
            .filter(function (r) { return iDate >= 0 && r[iDate] && r[iDate].trim(); })
            .map(function (r) {
                var rawDate = (r[iDate] || '').trim();
                return {
                    date:     formatDate(rawDate),
                    _dateIso: rawDate,
                    title:    iTitle >= 0 ? (r[iTitle] || '').trim() : '',
                    tag:      iTag   >= 0 ? ((r[iTag] || 'farm').trim() || 'farm') : 'farm',
                    photo:    imageUrl(iPhoto >= 0 ? r[iPhoto] : ''),
                    note:     iNote  >= 0 ? (r[iNote] || '').trim() : ''
                };
            })
            .sort(function (a, b) {
                // Newest first; ISO dates sort lexically so this works as expected.
                return (b._dateIso || '').localeCompare(a._dateIso || '');
            });
    }

    function notify() {
        var ev;
        try { ev = new CustomEvent('diary:loaded'); }
        catch (e) {
            ev = document.createEvent('Event');
            ev.initEvent('diary:loaded', true, true);
        }
        window.dispatchEvent(ev);
    }

    // ── Load ───────────────────────────────────────────────
    if (!DIARY_CSV_URL) {
        // Not configured yet — render code will show "no entries" state.
        // Fire the event anyway so listeners stop waiting.
        setTimeout(notify, 0);
        return;
    }

    fetch(DIARY_CSV_URL)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (csv) {
            var entries = rowsToEntries(parseCsv(csv));
            window.DIARY_ENTRIES = entries;
        })
        .catch(function (err) {
            // Network failure (e.g. file:// CORS) — use sample data for local testing.
            if (window.console) console.warn('Diary CSV fetch failed, using sample data:', err && err.message);
            window.DIARY_ENTRIES = [
                { date: 'May 6, 2026', _dateIso: '2026-05-06', title: 'Irrigation system back online', tag: 'infra', photo: 'diary/tubewell-fire-rebuild.jpeg', note: 'After the fire destroyed the tubewell setup, staff rebuilt the entire drip irrigation connection from scratch. Filter, pressure gauge, zone valves, and the tubewell suction line — all reconnected and tested. The system is back up and running.' },
                { date: 'May 1, 2026', _dateIso: '2026-05-01', title: 'Fire at the Tubewell — and the Rebuild', tag: 'infra', photo: 'diary/tubewell-fire-rebuild.jpeg', note: 'A fire burned down the tubewell and drip irrigation setup. Staff worked endlessly to rebuild the irrigation connections — concrete pillars going up, stones and pipes being relaid.' },
                { date: 'April 30, 2026', _dateIso: '2026-04-30', title: 'Shade net damaged in storm', tag: 'infra', photo: 'diary/shade-net-storm-damage.jpeg', note: 'A strong windstorm collapsed the shade net nursery structure. The green mesh and supporting frame buckled under the wind pressure.' },
                { date: 'April 27, 2026', _dateIso: '2026-04-27', title: 'Bamboo arrives for trellis', tag: 'infra', photo: 'diary/bamboo-for-trellis.jpeg', note: 'Bamboo poles delivered for building trellises. These will support climbing vegetables and creeper plants.' },
                { date: 'April 21, 2026', _dateIso: '2026-04-21', title: 'First corn on the farm', tag: 'milestone', photo: 'diary/first-corn-on-the-farm.webp', note: 'Harvested our first corn cobs — a small but significant milestone for the farm.' },
                { date: 'March 26, 2026', _dateIso: '2026-03-26', title: 'Seedlings in the ground', tag: 'planting', photo: 'diary/seedlings-in-the-ground.jpg', note: 'First batch of seedlings transplanted into prepared beds. The growing season begins.' },
                { date: 'March 26, 2026', _dateIso: '2026-03-26', title: 'Organic fertilizer drums ready', tag: 'planting', photo: 'diary/organic-fertilizer-drums.jpg', note: 'Organic fertilizer prepared in blue drums — ready for application across the planting zones.' }
            ];
        })
        .then(notify); // fire whether success or failure
})();
