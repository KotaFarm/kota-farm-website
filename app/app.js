/* ──────────────────────────────────────────────────────────────
   Farm App — Kovana Natural Farm
   - Auth via Vercel serverless functions (/api/auth/*)
   - Harvest entries, activities, offline queue
   ────────────────────────────────────────────────────────────── */

(function () {
    'use strict';

    var LS_API   = 'farmapp_api';
    var LS_QUEUE = 'farmapp_queue';
    var LS_FARM  = 'farmapp_farm';
    var LS_TOKEN = 'farmapp_token';

    var state = {
        user: null,             // { email, name, picture } from /api/auth/me
        farms: [],
        farmId: localStorage.getItem(LS_FARM) || '',
        crops: [],
        selectedCrop: null,
        selectedQuality: 'HIGH',
        savedToday: []
    };

    // ── Helpers ─────────────────────────────────────────
    function $(id) { return document.getElementById(id); }

    function apiBase() {
        return (localStorage.getItem(LS_API) || FarmApp.config.API_BASE).replace(/\/+$/, '');
    }

    function token() {
        return localStorage.getItem(LS_TOKEN) || '';
    }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    function api(path, options) {
        options = options || {};
        options.headers = options.headers || {};
        options.credentials = 'include';  // send session cookie
        var devToken = token();
        if (devToken) options.headers['Authorization'] = 'Bearer ' + devToken;
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
        var payload = item.payload || item;
        api('/v1/harvests', { method: 'POST', body: JSON.stringify(payload), farmId: item.farmId })
            .then(function () {
                setQueue(getQueue().slice(1));
                syncQueue();
                loadToday();
            })
            .catch(function (err) {
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

    // ── Auth (Google via Vercel /api/auth/*) ────────────

    function checkAuth() {
        // Check for auth errors in URL (from callback redirect)
        var params = new URLSearchParams(window.location.search);
        var authError = params.get('auth_error');
        if (authError) {
            var msg = $('loginMsg');
            msg.textContent = '⚠️ Login failed: ' + authError.replace(/_/g, ' ');
            msg.className = 'msg err';
            // Clean URL
            history.replaceState(null, '', window.location.pathname);
        }

        // Check session with the server
        fetch('/api/auth/me', { credentials: 'include' })
            .then(function (res) {
                if (!res.ok) throw new Error('not_authenticated');
                return res.json();
            })
            .then(function (user) {
                state.user = user;
                refreshAuthUI();
                onSignedIn();
            })
            .catch(function () {
                state.user = null;
                refreshAuthUI();

                // Dev fallback: if on localhost with a dev token, unlock anyway
                if (isDevHost() && token()) {
                    onSignedIn();
                }
            });
    }

    function initAuth() {
        $('googleBtn').addEventListener('click', function () {
            window.location.href = '/api/auth/google';
        });

        $('logoutBtn').addEventListener('click', function () {
            fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                .then(function () {
                    state.user = null;
                    refreshAuthUI();
                });
        });

        checkAuth();
    }

    function onSignedIn() {
        loadFarms();
        loadCrops();
        loadToday();
        loadActivities();
        syncQueue();
    }

    function refreshAuthUI() {
        var signedIn = !!state.user;
        var email = signedIn ? state.user.email : '';
        var devToken = isDevHost() && !!token();
        var unlocked = signedIn || devToken;

        $('loginCard').classList.toggle('hidden', unlocked);
        $('appMain').classList.toggle('hidden', !unlocked);
        $('userEmail').textContent = email;
        $('logoutBtn').classList.toggle('hidden', !signedIn);

        if (!unlocked) {
            $('farmSelect').classList.add('hidden');
            $('farmLabel').classList.add('hidden');
        } else if (state.farms.length) {
            renderFarmSelect();
        }
    }

    // ── Farms (root-level switcher) ─────────────────────
    function loadFarms() {
        api('/v1/farms', { farmId: '' })
            .then(function (data) {
                state.farms = asArray(data);
                if (!state.farms.length) return;

                var valid = state.farms.some(function (f) { return f.id === state.farmId; });
                if (!valid) {
                    state.farmId = state.farms[0].id;
                    localStorage.setItem(LS_FARM, state.farmId);
                }
                renderFarmSelect();
            })
            .catch(function () {});
    }

    function renderFarmSelect() {
        var sel = $('farmSelect');
        var label = $('farmLabel');
        sel.innerHTML = '';

        if (state.farms.length === 1) {
            label.textContent = state.farms[0].name;
            label.classList.remove('hidden');
            sel.classList.add('hidden');
            return;
        }

        state.farms.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            if (f.id === state.farmId) opt.selected = true;
            sel.appendChild(opt);
        });
        label.classList.add('hidden');
        sel.classList.remove('hidden');
    }

    function onFarmChange() {
        state.farmId = $('farmSelect').value;
        localStorage.setItem(LS_FARM, state.farmId);
        state.selectedCrop = null;
        loadCrops();
        loadToday();
        loadActivities();
    }

    // ── Crops ───────────────────────────────────────────
    function loadCrops() {
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
            btn.innerHTML = '<span class="name">' + escapeHtml(name) + '</span>';
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
                    msg.textContent = '⚠️ Session expired — please sign in again';
                    msg.className = 'msg err';
                } else {
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
            li.innerHTML = '<span>' + escapeHtml(item.entry.crop) +
                (item.pending ? '<span class="pending-tag">⏳ pending</span>' : '') +
                '</span><span class="qty">' + escapeHtml(item.entry.weightKg) + ' kg</span>';
            list.appendChild(li);
        });
    }

    // ── Settings (developer-only) ───────────────────────
    function isDevHost() {
        return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    }

    function initSettings() {
        if (!isDevHost()) {
            $('settingsBtn').classList.add('hidden');
            return;
        }
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

    // ── Activities ──────────────────────────────────────
    var selectedPhotoFile = null;

    function initActivities() {
        $('activityDate').value = todayStr();

        $('photoBtn').addEventListener('click', function () { $('activityPhoto').click(); });

        $('activityPhoto').addEventListener('change', function () {
            var file = this.files && this.files[0];
            if (!file) return;
            selectedPhotoFile = file;
            $('photoPreview').src = URL.createObjectURL(file);
            $('photoPreviewWrap').classList.remove('hidden');
            $('photoBtn').classList.add('hidden');
        });

        $('photoRemove').addEventListener('click', function () {
            selectedPhotoFile = null;
            $('activityPhoto').value = '';
            $('photoPreviewWrap').classList.add('hidden');
            $('photoBtn').classList.remove('hidden');
        });

        $('saveActivityBtn').addEventListener('click', saveActivity);
    }

    /** Upload photo via /api/upload (Vercel Blob). Returns URL or null. */
    function uploadActivityPhoto(file) {
        if (!file) return Promise.resolve(null);
        var formData = new FormData();
        formData.append('file', file);
        return fetch('/api/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Upload failed');
            return res.json();
        })
        .then(function (data) { return data.url; });
    }

    function saveActivity() {
        var msg = $('activityMsg');
        msg.className = 'msg';

        var desc = $('activityDesc').value.trim();
        if (!desc) { msg.textContent = '⚠️ Describe what was done'; msg.className = 'msg err'; return; }

        $('saveActivityBtn').disabled = true;
        msg.textContent = selectedPhotoFile ? 'Uploading photo…' : 'Saving…';

        uploadActivityPhoto(selectedPhotoFile)
            .then(function (photoUrl) {
                var entry = {
                    activityDate: $('activityDate').value || todayStr(),
                    description: desc
                };
                if (photoUrl) entry.photos = [{ url: photoUrl }];
                return api('/v1/activities', { method: 'POST', body: JSON.stringify(entry) });
            })
            .then(function () {
                msg.textContent = '✅ Saved!';
                msg.className = 'msg ok';
                $('activityDesc').value = '';
                $('photoRemove').click();
                loadActivities();
            })
            .catch(function (err) {
                msg.textContent = '⚠️ ' + (err.message || 'Could not save') +
                    (navigator.onLine ? '' : ' — photo entries need network');
                msg.className = 'msg err';
            })
            .then(function () { $('saveActivityBtn').disabled = false; });
    }

    function loadActivities() {
        api('/v1/activities?limit=20')
            .then(function (data) {
                var list = $('activityList');
                var items = asArray(data);
                list.innerHTML = '';
                if (!items.length) {
                    list.innerHTML = '<li class="muted">No activities yet</li>';
                    return;
                }
                items.forEach(function (a) {
                    var li = document.createElement('li');
                    var date = String(a.activityDate || '').slice(0, 10);
                    var thumb = (a.photos && a.photos[0])
                        ? '<img class="activity-thumb" src="' + escapeHtml(a.photos[0].url) + '" alt="" loading="lazy">'
                        : '';
                    li.innerHTML = thumb + '<div><div class="activity-date">' + date + '</div>' +
                        '<div>' + escapeHtml(a.description) + '</div></div>';
                    list.appendChild(li);
                });
            })
            .catch(function () {});
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ── Bottom navigation ───────────────────────────────
    function initNav() {
        var tabs = document.querySelectorAll('.tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                document.querySelectorAll('.view').forEach(function (v) { v.classList.add('hidden'); });
                $('view-' + tab.dataset.view).classList.remove('hidden');
            });
        });
    }

    // ── Init ────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        $('harvestDate').value = todayStr();
        renderQuality();
        initSettings();
        initNav();
        initActivities();
        $('farmSelect').addEventListener('change', onFarmChange);
        $('saveBtn').addEventListener('click', save);
        initAuth();

        updateBanner();
        syncQueue();

        window.addEventListener('online',  function () { updateBanner(); syncQueue(); });
        window.addEventListener('offline', updateBanner);
    });

})();
