/* ──────────────────────────────────────────────────────────────
   Harvest — pure helpers
   No DOM, no network, no shared state. Easy to reason about and test.
   ────────────────────────────────────────────────────────────── */

(function (Harvest) {
    'use strict';

    // HTML-escape any value safely (handles null/undefined).
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Tolerant date parser — handles several formats commonly typed
    // into spreadsheets. Returns a Date or null.
    function parseDate(str) {
        if (!str) return null;
        var s = String(str).trim();
        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s + 'T00:00:00');
        // M/D/YYYY or MM/DD/YYYY
        var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (m) return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]));
        // DD-Month-YYYY or DD Month YYYY (e.g. "26-April-2026")
        var months = {
            jan: 0, feb: 1, mar: 2, apr: 3, april: 3, may: 4,
            jun: 5, june: 5, jul: 6, july: 6, aug: 7,
            sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
            january: 0, february: 1, march: 2, august: 7,
            september: 8, october: 9, november: 10, december: 11
        };
        m = s.match(/^(\d{1,2})[\s\-\/]([A-Za-z]+)[\s\-\/](\d{4})/);
        if (m) {
            var mi = months[m[2].toLowerCase()];
            if (mi != null) return new Date(parseInt(m[3]), mi, parseInt(m[1]));
        }
        var d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function fmtDate(d) {
        if (!d) return '';
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function monthKey(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function monthLabel(key) {
        var p = key.split('-');
        var d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, 1);
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }

    // Convert a Drive share URL → thumbnail URL the browser can render.
    // Returns '' for unrecognized inputs so junk text in a Photo URL cell
    // does not produce a broken image tile.
    function driveThumb(url) {
        if (!url) return '';
        var s = String(url);
        var m = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w800';
        m = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w800';
        // Bare http(s) image URL also acceptable
        if (/^https?:\/\/.+\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(s)) return s;
        return '';
    }

    // Soft fallback emoji per crop for cards without photos.
    function cropEmoji(crop) {
        var k = String(crop).toLowerCase();
        var map = {
            tomato: '🍅', brinjal: '🍆', okra: '🌶️', 'green chilli': '🌶️', chilli: '🌶️',
            carrot: '🥕', beetroot: '🍠', potato: '🥔', garlic: '🧄', onion: '🧅',
            palak: '🥬', methi: '🌿', coriander: '🌿', mint: '🌿',
            'green peas': '🫛', peas: '🫛', corn: '🌽', wheat: '🌾',
            chana: '🫘', urad: '🫘', dal: '🫘', 'methi seeds': '🌱',
            lemon: '🍋', mango: '🥭', guava: '🍐', pomegranate: '🍎',
            mandarin: '🍊', orange: '🍊', papaya: '🥭', papita: '🥭',
            jackfruit: '🍈', mulberry: '🫐', amla: '🍏'
        };
        for (var key in map) { if (k.indexOf(key) !== -1) return map[key]; }
        return '🌾';
    }

    Harvest.utils = {
        esc: esc,
        parseDate: parseDate,
        fmtDate: fmtDate,
        monthKey: monthKey,
        monthLabel: monthLabel,
        driveThumb: driveThumb,
        cropEmoji: cropEmoji
    };

})(window.Harvest = window.Harvest || {});
