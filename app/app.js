/* ──────────────────────────────────────────────────────────────
   Farm App — harvest entry logic
   - Loads crops from the API (with Hindi labels from config.js)
   - Saves harvests via POST /v1/harvests
   - Offline queue: entries wait in localStorage and sync
     automatically when the network returns
   ────────────────────────────────────────────────────────────── */

(function () {
    'use strict';

    var LS_TOKEN = 'farmapp_token';
    var LS_API   = 'farmapp_api';
    var LS_QUEUE = 'farmapp_queue';
    var LS_FARM  = 'farmapp_farm';

    var state = {
        farms: [],
        farmId: localStorage.getItem(LS_FARM) || '',
        crops: [],
        selectedCrop: null,
        selectedQuality: 'HIGH',
        savedToday: []          // entries confirmed by the server today
    };

    // ── Helpers ─────────────────────────────────────────
    function $(id) { return document.getElementById(id); }

    function apiBase() {
        return (localStorage.getItem(LS_API) || FarmApp.config.API_BASE).replace(/\/+$/, '');
    }
    function token() { return localStorage.getItem(LS_TOKEN) || ''; }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    // The farm is chosen once, at root level (header switcher); every
    // request carries it. options.farmId overrides (used by the offline
    // queue so entries sync to the farm they were entered for).
    function api(path, options) {
        options = options || {};
        options.headers = options.headers || {};
        options.headers['Authorization'] = 'Bearer ' + token();
        var farmId = options.farmId || state.farmId;
        if (farmId) options.headers['X-Farm-Id'] = farmId;
        if (options.body) options.headers['Content-Type'] = 'application/json';
        return fetch(apiBase() + path, options).then(function (res) {
            if (!res.ok) {
                return res.text().then(function (t) {
                    var msg = 'HTTP ' + res.status;
                    try { msg = (JSON.parse(t).error || {}).message || msg; } catch (e) {}
                    var err = new Error(msg);
                    err.status = res.status;
                    throw err;
                });
            }
            return res.status === 204 ? null : res.json();
        });
    }

    // Accept both bare arrays and {data:[...]} shapes
    function asArray(x) {
        if (Array.isArray(x)) return x;
        if (x && Array.isArray(x.data)) return x.data;
        if (x && Array.isArray(x.items)) return x.items;
        return [];
    }

    // ── Offline queue ───────────────────────────────────
    function getQueue() {
        try { return JSON.parse(localStorage.getItem(LS_QUEUE)) || []; }
        catch (e) { return []; }
    }
    function setQueue(q) { localStorage.setItem(LS_QUEUE, JSON.stringify(q)); }

    function enqueue(entry) {
        var q = getQueue();
        q.push(entry);
        setQueue(q);
        updateBanner();
        renderToday();
    }

    function syncQueue() {
        var q = getQueue();
        if (!q.length || !navigator.onLine) { updateBanner(); return; }

        var item = q[0];
        var payload = item.payload || item;          // tolerate old queue format
        api('/v1/harvests', { method: 'POST', body: JSON.stringify(payload), farmId: item.farmId })
            .then(function () {
                setQueue(getQueue().slice(1));
                syncQueue();            // next one
                loadToday();
            })
            .catch(function (err) {
                // 4xx = bad entry, drop it so the queue doesn't jam.
                // Network/5xx = keep and retry later.
                if (err.status && err.status >= 400 && err.status < 500 && err.status !== 401) {
                    setQueue(getQueue().slice(1));
                }
                updateBanner();
            });
    }

    function updateBanner() {
        var q = getQueue();
        var banner = $('netBanner');
        if (!navigator.onLine) {
            banner.textContent = '📴 Offline — entries are saved on this phone and will sync automatically';
            banner.classList.remove('hidden');
        } else if (q.length) {
            banner.textContent = '⏳ Syncing ' + q.length + ' pending ' + (q.length === 1 ? 'entry' : 'entries') + '…';
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    }

    // ── Farms (root-level switcher) ─────────────────────
    function loadFarms() {
        if (!token()) return;
        api('/v1/farms', { farmId: '' })     // farm list itself is farm-agnostic
            .then(function (data) {
                state.farms = asArray(data);
                if (!state.farms.length) return;

                // Keep stored selection if still valid, else default to first
                var valid = state.farms.some(function (f) { return f.id === state.farmId; });
                if (!valid) {
                    state.farmId = state.farms[0].id;
                    localStorage.setItem(LS_FARM, state.farmId);
                }
                renderFarmSelect();
            })
            .catch(function () { /* switcher stays as-is; API errors surface elsewhere */ });
    }

    function renderFarmSelect() {
        var sel = $('farmSelect');
        sel.innerHTML = '';
        state.farms.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            if (f.id === state.farmId) opt.selected = true;
            sel.appendChild(opt);
        });
    }

    function onFarmChange() {
        state.farmId = $('farmSelect').value;
        localStorage.setItem(LS_FARM, state.farmId);
        // Everything below the root reloads in the new farm's context
        state.selectedCrop = null;
        loadCrops();
        loadToday();
    }

    // ── Crops ───────────────────────────────────────────
    function loadCrops() {
        if (!token()) {
            $('cropMsg').textContent = 'Set the token in ⚙️ Settings first';
            return;
        }
        api('/v1/crops')
            .then(function (data) {
                state.crops = asArray(data);
                renderCropGrid();
            })
            .catch(function (err) {
                $('cropMsg').textContent = 'Could not load crops (' + err.message + ')';
            });
    }

    function renderCropGrid() {
        var grid = $('cropGrid');
        grid.innerHTML = '';
        if (!state.crops.length) {
            grid.innerHTML = '<p class="msg">No crops found</p>';
            return;
        }
        state.crops.forEach(function (crop) {
            var name = crop.name || crop;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'crop-btn';
            btn.innerHTML = '<span class="name">' + name + '</span>';
            btn.addEventListener('click', function () {
                state.selectedCrop = name;
                grid.querySelectorAll('.crop-btn').forEach(function (b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
            });
            grid.appendChild(btn);
        });
    }

    // ── Quality buttons ─────────────────────────────────
    function renderQuality() {
        var row = $('qualityRow');
        row.innerHTML = '';
        FarmApp.QUALITY.forEach(function (q) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'q-btn' + (q.value === state.selectedQuality ? ' selected' : '');
            btn.textContent = q.label;
            btn.addEventListener('click', function () {
                state.selectedQuality = q.value;
                row.querySelectorAll('.q-btn').forEach(function (b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
            });
            row.appendChild(btn);
        });
    }

    // ── Save ────────────────────────────────────────────
    function save() {
        var msg = $('saveMsg');
        msg.className = 'msg';

        var weight = parseFloat($('weightKg').value);
        if (!state.selectedCrop) { msg.textContent = '⚠️ Choose a crop'; msg.className = 'msg err'; return; }
        if (!weight || weight <= 0) { msg.textContent = '⚠️ Enter the weight'; msg.className = 'msg err'; return; }

        var entry = {
            harvestDate: $('harvestDate').value || todayStr(),
            crop: state.selectedCrop,
            weightKg: weight,
            quality: state.selectedQuality
        };
        var notes = $('notes').value.trim();
        if (notes) entry.notes = notes;

        $('saveBtn').disabled = true;

        api('/v1/harvests', { method: 'POST', body: JSON.stringify(entry) })
            .then(function () {
                msg.textContent = '✅ Saved!';
                msg.className = 'msg ok';
                resetForm();
                loadToday();
            })
            .catch(function (err) {
                if (err.status === 401) {
                    msg.textContent = '⚠️ Token invalid or expired — set a new one in ⚙️ Settings';
                    msg.className = 'msg err';
                } else {
                    // Network problem → queue it (tagged with the farm it was entered for)
                    enqueue({ payload: entry, farmId: state.farmId });
                    msg.textContent = '📴 No network — saved on this phone, will sync automatically';
                    msg.className = 'msg ok';
                    resetForm();
                }
            })
            .then(function () { $('saveBtn').disabled = false; });
    }

    function resetForm() {
        $('weightKg').value = '';
        $('notes').value = '';
        state.selectedCrop = null;
        document.querySelectorAll('.crop-btn').forEach(function (b) { b.classList.remove('selected'); });
    }

    // ── Today's entries ─────────────────────────────────
    function loadToday() {
        if (!token()) { renderToday(); return; }
        api('/v1/harvests')
            .then(function (data) {
                var t = todayStr();
                state.savedToday = asArray(data).filter(function (h) {
                    return String(h.harvestDate || h.harvest_date || '').slice(0, 10) === t;
                });
                renderToday();
            })
            .catch(function () { renderToday(); });
    }

    function renderToday() {
        var list = $('todayList');
        list.innerHTML = '';

        var pending = getQueue().map(function (e) { return { entry: e.payload || e, pending: true }; });
        var saved = state.savedToday.map(function (h) {
            return {
                entry: {
                    crop: (h.crop && h.crop.name) || h.crop || '?',
                    weightKg: h.weightKg || h.weight_kg
                },
                pending: false
            };
        });
        var all = saved.concat(pending);

        if (!all.length) {
            list.innerHTML = '<li class="muted">No entries yet</li>';
            return;
        }
        all.forEach(function (item) {
            var li = document.createElement('li');
            li.innerHTML = '<span>' + item.entry.crop +
                (item.pending ? '<span class="pending-tag">⏳ pending</span>' : '') +
                '</span><span class="qty">' + item.entry.weightKg + ' kg</span>';
            list.appendChild(li);
        });
    }

    // ── Settings ────────────────────────────────────────
    function initSettings() {
        $('apiBase').value = localStorage.getItem(LS_API) || FarmApp.config.API_BASE;
        $('apiToken').value = token();

        $('settingsBtn').addEventListener('click', function () {
            $('settingsPanel').classList.toggle('hidden');
        });

        $('saveSettings').addEventListener('click', function () {
            localStorage.setItem(LS_API, $('apiBase').value.trim());
            localStorage.setItem(LS_TOKEN, $('apiToken').value.trim());
            $('settingsMsg').textContent = '✅ Saved';
            $('settingsMsg').className = 'msg ok';
            loadFarms();
            loadCrops();
            loadToday();
            syncQueue();
        });
    }

    // ── Init ────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        $('harvestDate').value = todayStr();
        renderQuality();
        initSettings();
        $('farmSelect').addEventListener('change', onFarmChange);
        loadFarms();
        loadCrops();
        loadToday();
        updateBanner();
        syncQueue();

        window.addEventListener('online',  function () { updateBanner(); syncQueue(); });
        window.addEventListener('offline', updateBanner);

        // If no token yet, open settings so the first step is obvious
        if (!token()) $('settingsPanel').classList.remove('hidden');
    });

})();
