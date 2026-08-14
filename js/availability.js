/* ──────────────────────────────────────────────────────────────
   Availability — what's actually for sale right now.

   Derives status from three published Google Sheet tabs:
     Crops   — the master list. Names, descriptions, shelf life.
     Harvest — every picking event.
     Sale    — every sale.

   WHY NOT "harvested minus sold":
     That treats perishables as permanent inventory. Okra reads 55 kg
     harvested against 3 kg sold, because the harvest log starts in
     February and the Sale sheet in August — everything eaten, gifted or
     spoiled between was never recorded as a sale. The balance only grows,
     so every crop eventually looks permanently in stock.

   THE MODEL — a rolling window the length of each crop's shelf life:

     sellable  = harvested_in_window * (1 - HOME_RESERVE)
     remaining = sellable - sold_in_window

     available    remaining > LOW_STOCK_KG
     low          remaining > 0
     unavailable  otherwise

   The sales window runs a few days longer than the harvest window, because
   a sale can legitimately draw on produce picked just before the window
   opened; without that, a good selling day reads as Unavailable.

   Crop naming comes entirely from the Crops tab. Nothing crop-specific is
   hardcoded — add a row to the sheet and it flows through to the site.
   ────────────────────────────────────────────────────────────── */

(function (global) {
    'use strict';

    var PUBLISH_BASE =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZb8u89bi2HsIKPs5YVB-Sd8aeX7MiOWhTySr-K7K0mr977JfSOUIC84XEGjs4nQUmfnaDoNIBIPTR/pub';

    var TABS = { crops: '1369701246', harvest: '100', sale: '62849887' };

    // ── Tunables ──────────────────────────────────────────────
    var CONFIG = {
        // Share of each harvest held back for the household rather than sold.
        homeReserve: 0.20,
        // Below this many kg remaining, a crop is "low" rather than "available".
        lowStockKg: 0.5,
        // Used only when a crop has no "Shelf Life (days)" value in the sheet.
        // A single fallback on purpose — per-crop shelf life belongs in the
        // sheet where the farm can edit it without touching code.
        defaultShelfLifeDays: 7,
        // Sales window = shelf life + this.
        saleWindowGraceDays: 3
    };

    var DAY_MS = 86400000;

    // ── CSV ───────────────────────────────────────────────────
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

    function rowsToObjects(csv) {
        var rows = parseCsv(csv);
        if (!rows.length) return [];
        var headers = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
        return rows.map(function (cells) {
            var o = {};
            headers.forEach(function (h, i) { o[h] = (cells[i] || '').trim(); });
            return o;
        });
    }

    // Tolerant header lookup — "weight (kg)" matches a "weight" candidate.
    function pick(row, candidates) {
        var keys = Object.keys(row);
        for (var i = 0; i < keys.length; i++) {
            for (var j = 0; j < candidates.length; j++) {
                if (keys[i] === candidates[j] || keys[i].indexOf(candidates[j]) === 0) {
                    return row[keys[i]];
                }
            }
        }
        return '';
    }

    function parseDate(str) {
        if (!str) return null;
        var s = String(str).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s + 'T00:00:00');
        var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);          // M/D/YYYY
        if (m) return new Date(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
        var d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function normalizeName(s) {
        return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function csvUrl(gid) {
        return PUBLISH_BASE + '?gid=' + gid + '&single=true&output=csv';
    }

    function fetchText(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        });
    }

    // ── Core computation (pure — exported for testing) ────────
    function compute(cropsCsv, harvestCsv, saleCsv, nowMs) {
        var now = nowMs || Date.now();
        var daysAgo = function (d) { return d ? (now - d.getTime()) / DAY_MS : Infinity; };

        var byId = {};
        var byName = {};
        var order = [];

        rowsToObjects(cropsCsv).forEach(function (r) {
            var id = pick(r, ['id']);
            var name = pick(r, ['crop', 'name']);
            if (!id || !name) return;
            var shelf = parseFloat(pick(r, ['shelf life', 'shelf']));
            var rec = {
                id: id,
                name: name,
                description: pick(r, ['description', 'desc']),
                shelfLifeDays: shelf > 0 ? shelf : CONFIG.defaultShelfLifeDays,
                shelfLifeFromSheet: shelf > 0,
                harvestedKg: 0,
                soldKg: 0,
                lastHarvest: null,
                lastSale: null
            };
            byId[id] = rec;
            byName[normalizeName(name)] = rec;
            order.push(rec);
        });

        // A Crop cell may hold a Ref ID or a plain typed name.
        function resolve(value) {
            var raw = String(value == null ? '' : value).trim();
            if (!raw) return null;
            return byId[raw] || byName[normalizeName(raw)] || null;
        }

        rowsToObjects(harvestCsv).forEach(function (r) {
            var crop = resolve(pick(r, ['crop']));
            if (!crop) return;
            var date = parseDate(pick(r, ['date']));
            if (!date) return;
            var kg = parseFloat(pick(r, ['weight'])) || 0;
            if (!crop.lastHarvest || date > crop.lastHarvest) crop.lastHarvest = date;
            if (daysAgo(date) <= crop.shelfLifeDays) crop.harvestedKg += kg;
        });

        rowsToObjects(saleCsv).forEach(function (r) {
            var crop = resolve(pick(r, ['crop']));
            if (!crop) return;
            var date = parseDate(pick(r, ['date']));
            if (!date) return;
            var kg = parseFloat(pick(r, ['quantity'])) || 0;
            if (!crop.lastSale || date > crop.lastSale) crop.lastSale = date;
            if (daysAgo(date) <= crop.shelfLifeDays + CONFIG.saleWindowGraceDays) crop.soldKg += kg;
        });

        return order.map(function (c) {
            var sellable = c.harvestedKg * (1 - CONFIG.homeReserve);
            var remaining = Math.max(0, sellable - c.soldKg);
            var status = remaining > CONFIG.lowStockKg ? 'available'
                       : remaining > 0                 ? 'low'
                       : 'unavailable';
            return {
                id: c.id,
                name: c.name,
                description: c.description,
                status: status,
                available: status !== 'unavailable',
                remainingKg: Math.round(remaining * 100) / 100,
                harvestedKg: Math.round(c.harvestedKg * 100) / 100,
                soldKg: Math.round(c.soldKg * 100) / 100,
                shelfLifeDays: c.shelfLifeDays,
                shelfLifeFromSheet: c.shelfLifeFromSheet,
                lastHarvest: c.lastHarvest,
                daysSinceHarvest: c.lastHarvest ? Math.floor(daysAgo(c.lastHarvest)) : null
            };
        }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    // ── Public: fetch all three tabs and compute ──────────────
    // Never rejects for a single bad tab — Crops alone is enough to render
    // the catalogue, just with everything marked unavailable.
    function load() {
        return Promise.all([
            fetchText(csvUrl(TABS.crops)),
            fetchText(csvUrl(TABS.harvest)).catch(function () { return ''; }),
            fetchText(csvUrl(TABS.sale)).catch(function () { return ''; })
        ]).then(function (r) {
            return compute(r[0], r[1], r[2]);
        });
    }

    var Availability = {
        load: load,
        compute: compute,
        config: CONFIG,
        normalizeName: normalizeName,
        parseDate: parseDate,
        rowsToObjects: rowsToObjects
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = Availability;
    global.Availability = Availability;

})(typeof window !== 'undefined' ? window : globalThis);
