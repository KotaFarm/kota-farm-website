/* ──────────────────────────────────────────────────────────────
   Harvest — data loading pipeline
   ────────────────────────────────────────────────────────────── */

(function (Harvest) {
    'use strict';

    /*
     * Caching note: we deliberately do NOT bust the cache with a
     * &t=Date.now() query string. Google Sheets serves published CSVs
     * with Cache-Control: max-age=~300 (≈5 min), so repeat page loads
     * within that window come from the browser cache — zero round-trip.
     * New sheet edits surface within ~5 min as the cache expires.
     * Hard-refresh (Cmd+Shift+R) forces a fresh fetch on demand.
     */

    // 1. Network primitives — thin wrappers, easy to swap/mock.
    function fetchText(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        });
    }
    function fetchJson(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }

    // 2. CSV parser — handles quoted fields with embedded commas
    //    and "" escapes. If the sheet ever grows multi-line cells
    //    or fancier quoting, swap this for PapaParse.
    function parseCsv(csv) {
        return csv.trim().split(/\r?\n/).map(function (line) {
            var cells = []; var cur = ''; var inq = false;
            for (var i = 0; i < line.length; i++) {
                var ch = line[i];
                if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
                else if (ch === '"') inq = !inq;
                else if (ch === ',' && !inq) { cells.push(cur); cur = ''; }
                else cur += ch;
            }
            cells.push(cur);
            return cells;
        });
    }

    // 3. Map raw CSV → plain row objects. Header names are matched
    //    loosely so small renames ("Crop Quality" vs "Quality") or
    //    column reorders in the sheet don't break ingest.
    function rowsFromCsv(csv) {
        var rows = parseCsv(csv);
        var headers = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
        var idx = function (name) { return headers.indexOf(name); };
        var iDate = idx('date'),
            iCrop = idx('crop'),
            iWt = headers.findIndex(function (h) { return h.indexOf('weight') === 0; }),
            iQ  = headers.findIndex(function (h) { return h.indexOf('crop quality') === 0 || h === 'quality' || h.indexOf('grade') !== -1; }),
            iPh = headers.findIndex(function (h) { return h.indexOf('photo') !== -1; }),
            iN  = idx('notes');
        return rows.filter(function (r) { return r[iDate]; }).map(function (r) {
            return {
                date: r[iDate], crop: r[iCrop], weight: r[iWt],
                quality: r[iQ], photoUrl: r[iPh], notes: r[iN]
            };
        });
    }

    // 4. Normalize incoming rows (any shape) → internal model.
    //    Writes into Harvest.state.allData.
    function ingest(rawList) {
        var parseDate = Harvest.utils.parseDate;
        Harvest.state.allData = rawList.map(function (r) {
            return {
                date: r.date,
                crop: r.crop,
                weight: parseFloat(r.weight) || 0,
                quality: r.quality || '',
                photoUrl: r.photoUrl || r.photo || '',
                notes: r.notes || '',
                _date: parseDate(r.date)
            };
        });
    }

    // 5. Single landing function — every data source funnels here.
    function applyData(rows) {
        ingest(rows);
        Harvest.ui.buildCropList();
        Harvest.ui.renderAll();
    }

    // 6. Orchestrator — picks the live source, falls back to
    //    SAMPLE_DATA if the network is unhappy. Add new sources
    //    by adding another branch above the default.
    function load() {
        var cfg = Harvest.config;
        if (cfg.API) {
            fetchJson(cfg.API)
                .then(applyData)
                .catch(function () { applyData(Harvest.SAMPLE_DATA); });
            return;
        }
        if (cfg.CSV_URL) {
            fetchText(cfg.CSV_URL)
                .then(function (csv) { applyData(rowsFromCsv(csv)); })
                .catch(function () { applyData(Harvest.SAMPLE_DATA); });
            return;
        }
        applyData(Harvest.SAMPLE_DATA);
    }

    Harvest.data = {
        fetchText: fetchText,
        fetchJson: fetchJson,
        parseCsv: parseCsv,
        rowsFromCsv: rowsFromCsv,
        ingest: ingest,
        applyData: applyData,
        load: load
    };

})(window.Harvest = window.Harvest || {});
