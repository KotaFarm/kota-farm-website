/* ──────────────────────────────────────────────────────────────
   Harvest highlight — fills the "kg harvested so far" card.

   Uses the harvest meter's own data source and pre-tracking
   baseline (js/harvest/config.js + js/harvest/data.js, loaded
   first), so the figure here always matches the "All Time"
   Total Harvested tile on harvest.html.

   Markup: any element with [data-harvest-highlight] containing
   [data-hh-total] (the number) and [data-hh-sub] (the small line).
   ────────────────────────────────────────────────────────────── */

(function () {
    'use strict';

    var cards = document.querySelectorAll('[data-harvest-highlight]');
    if (!cards.length) return;

    var H = window.Harvest;
    if (!H || !H.config || !H.config.CSV_URL || !H.data) { markNoData(); return; }

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function parseDate(str) {
        var s = String(str || '').trim();
        var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
        m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);            // M/D/YYYY
        if (m) return new Date(+m[3], +m[1] - 1, +m[2]);
        return null;
    }

    function formatKg(n) {
        return n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    function markNoData() {
        Array.prototype.forEach.call(cards, function (card) {
            card.classList.add('hh-nodata');
            var sub = card.querySelector('[data-hh-sub]');
            if (sub) sub.textContent = 'See what we’ve picked, crop by crop, straight from the farm log';
        });
    }

    function countUp(el, target) {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !window.requestAnimationFrame) { el.textContent = formatKg(target); return; }
        var start = null, duration = 900;
        function step(ts) {
            if (start === null) start = ts;
            var p = Math.min(1, (ts - start) / duration);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = formatKg(target * eased);
            if (p < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }

    function render(rows) {
        var logged = 0, latest = null;
        rows.forEach(function (r) {
            logged += parseFloat(r.weight) || 0;
            var d = parseDate(r.date);
            if (d && (!latest || d > latest)) latest = d;
        });
        var baseline = Object.keys(H.BASELINE || {}).reduce(function (s, k) { return s + H.BASELINE[k]; }, 0);
        var total = Math.round((logged + baseline) * 10) / 10;
        if (!(total > 0)) { markNoData(); return; }

        var subText = 'Across ' + rows.length + ' logged harvests' +
            (latest ? ' · latest ' + latest.getDate() + ' ' + MONTHS[latest.getMonth()] : '');

        Array.prototype.forEach.call(cards, function (card) {
            var num = card.querySelector('[data-hh-total]');
            var sub = card.querySelector('[data-hh-sub]');
            if (num) countUp(num, total);
            if (sub) sub.textContent = subText;
            card.setAttribute('aria-label', formatKg(total) + ' kg harvested so far. Open the live harvest meter.');
        });
    }

    H.data.fetchText(H.config.CSV_URL)
        .then(H.data.rowsFromCsv)
        .then(render, markNoData);
})();
