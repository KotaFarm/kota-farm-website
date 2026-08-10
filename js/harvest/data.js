/* ──────────────────────────────────────────────────────────────
   Harvest — data loading pipeline
   ────────────────────────────────────────────────────────────── */

(function (Harvest) {
    'use strict';

    // Crop lookups, populated from the Crops tab. Initialised up front so
    // resolution is safe even if the fetch never runs.
    //   cropsById   — "9" → { name, description }   (AppSheet Ref keys)
    //   cropsByName — "cowpea" → { name, description }  (normalised names,
    //                 so free-text rows typed before the Crops table existed
    //                 still match: "Cow Pea", "cow-pea" and "Cowpea" all
    //                 collapse to the same key)
    Harvest.cropsById = Harvest.cropsById || {};
    Harvest.cropsByName = Harvest.cropsByName || {};

    // Strip case, spaces and punctuation so spelling drift doesn't create
    // duplicate crops in the charts and calendar.
    function normalizeCropName(s) {
        return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
    }

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
            iThumb = headers.findIndex(function (h) { return h.indexOf('thumbnail') !== -1; }),
            iPh = headers.findIndex(function (h) { return h.indexOf('photo') !== -1; }),
            iN  = idx('notes');
        return rows.filter(function (r) { return r[iDate]; }).map(function (r) {
            // Prefer thumbnail column; fall back to photo column
            var photo = (iThumb >= 0 && r[iThumb] && r[iThumb].trim()) ? r[iThumb] : (iPh >= 0 ? r[iPh] : '');
            return {
                date: r[iDate], crop: r[iCrop], weight: r[iWt],
                quality: r[iQ], photoUrl: photo, notes: r[iN]
            };
        });
    }

    // 3b. Crops lookup tab → { id: { name, description } }.
    //     AppSheet's Crop column is a Ref, so the Harvest tab stores the Crops
    //     row key rather than the label. Everything downstream (charts, search,
    //     BASELINE matching) treats entry.crop as a display name, so IDs are
    //     resolved here at ingest and never leak further into the app.
    function cropsFromCsv(csv) {
        var rows = parseCsv(csv);
        if (!rows.length) return {};

        var cols = Harvest.CROPS_COLUMNS || { id: 'id', name: 'crop', description: 'description' };
        var headers = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
        var iId   = headers.indexOf(cols.id);
        var iName = headers.indexOf(cols.name);
        var iDesc = headers.indexOf(cols.description);

        // Without both an id and a name column there's nothing to map.
        if (iId === -1 || iName === -1) return {};

        var byId = {};
        var byName = {};
        rows.forEach(function (r) {
            var id   = String(r[iId] || '').trim();
            var name = String(r[iName] || '').trim();
            if (!id || !name) return;
            var entry = {
                name: name,
                description: iDesc >= 0 ? String(r[iDesc] || '').trim() : ''
            };
            byId[id] = entry;
            byName[normalizeCropName(name)] = entry;
        });
        return { byId: byId, byName: byName };
    }

    // Resolve a Harvest "Crop" cell to a Crops-table entry.
    //   1. Treat it as a Ref key   → "9" matches the Cowpea row
    //   2. Treat it as a crop name → "Cow Pea" matches "Cowpea"
    //   3. Give up; the raw value is displayed as typed
    // Step 2 is what keeps rows logged before the Crops table existed from
    // showing up as separate crops purely because of spelling.
    function lookupCrop(value) {
        var raw = String(value == null ? '' : value).trim();
        if (!raw) return null;
        return Harvest.cropsById[raw]
            || Harvest.cropsByName[normalizeCropName(raw)]
            || null;
    }

    function resolveCropName(value) {
        var entry = lookupCrop(value);
        if (entry) return entry.name;
        return String(value == null ? '' : value).trim();
    }

    // 4. Normalize incoming rows (any shape) → internal model.
    //    Writes into Harvest.state.allData.
    function ingest(rawList) {
        var parseDate = Harvest.utils.parseDate;
        Harvest.state.allData = rawList.map(function (r) {
            var cropInfo = lookupCrop(r.crop);
            return {
                date: r.date,
                crop: cropInfo ? cropInfo.name : String(r.crop == null ? '' : r.crop).trim(),
                cropDescription: cropInfo ? cropInfo.description : '',
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

    // 6a. Harvest rows from whichever source is configured.
    function fetchRows() {
        var cfg = Harvest.config;
        if (cfg.API) return fetchJson(cfg.API);
        if (cfg.CSV_URL) return fetchText(cfg.CSV_URL).then(rowsFromCsv);
        return Promise.resolve(Harvest.SAMPLE_DATA);
    }

    // 6b. Crops lookup. Never rejects — an unreachable or unpublished Crops
    //     tab must not take the whole page down with it.
    function fetchCrops() {
        var url = Harvest.config.CROPS_CSV_URL;
        if (!url) return Promise.resolve();
        return fetchText(url)
            .then(function (csv) {
                var maps = cropsFromCsv(csv);
                Harvest.cropsById = maps.byId;
                Harvest.cropsByName = maps.byName;
            })
            .catch(function () {
                Harvest.cropsById = {};
                Harvest.cropsByName = {};
            });
    }

    // 6c. Orchestrator — both sources load in parallel, then render.
    //
    //     Note the two-argument .then(): the rejection handler is attached to
    //     the fetch, NOT chained after applyData. A .catch() here would also
    //     swallow render-time errors and silently substitute SAMPLE_DATA,
    //     which previously made a broken chart look like a data problem.
    function load() {
        Promise.all([fetchCrops(), fetchRows()]).then(
            function (results) { applyData(results[1]); },
            function () { applyData(Harvest.SAMPLE_DATA); }
        );
    }

    Harvest.data = {
        fetchText: fetchText,
        fetchJson: fetchJson,
        parseCsv: parseCsv,
        rowsFromCsv: rowsFromCsv,
        cropsFromCsv: cropsFromCsv,
        resolveCropName: resolveCropName,
        lookupCrop: lookupCrop,
        normalizeCropName: normalizeCropName,
        ingest: ingest,
        applyData: applyData,
        load: load
    };

})(window.Harvest = window.Harvest || {});
