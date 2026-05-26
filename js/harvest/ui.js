/* ──────────────────────────────────────────────────────────────
   Harvest — UI module
   Owns: shared state, filters, tiles, photo grid, modal,
   crop search, share link, top-level renderAll, wireFilters.
   ────────────────────────────────────────────────────────────── */

(function (Harvest) {
    'use strict';

    // ── Shared state ───────────────────────────────────
    Harvest.state = {
        allData: [],
        currentPeriod: 'all',
        currentCrop: '',
        charts: { crops: null, recent: null, trend: null },
        // Crop-search internals
        cropList: [],
        cropEntryCount: {},
        activeSuggestionIdx: -1
    };

    // utils.js is loaded before this file (see script order in harvest.html),
    // so Harvest.utils.* is already defined here.
    var esc = Harvest.utils.esc;

    // ── Filters ────────────────────────────────────────
    function applyFilters(data) {
        var st = Harvest.state;
        var now = new Date();
        var cutoff = null;
        if (st.currentPeriod === 'month') {
            cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (st.currentPeriod === '3months') {
            cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        } else if (st.currentPeriod === 'year') {
            cutoff = new Date(now.getFullYear(), 0, 1);
        }
        return data.filter(function (e) {
            if (cutoff && (!e._date || e._date < cutoff)) return false;
            if (st.currentCrop && e.crop !== st.currentCrop) return false;
            return true;
        });
    }

    // Merge the lifetime baseline into a {crop: kg} object — only when
    // looking at All Time, and respecting the active crop filter.
    function withBaseline(cropTotals) {
        var st = Harvest.state;
        if (st.currentPeriod !== 'all') return cropTotals;
        var merged = {};
        Object.keys(cropTotals).forEach(function (k) { merged[k] = cropTotals[k]; });
        Object.keys(Harvest.BASELINE).forEach(function (crop) {
            if (st.currentCrop && st.currentCrop !== crop) return;
            merged[crop] = (merged[crop] || 0) + Harvest.BASELINE[crop];
        });
        return merged;
    }

    // ── Hero metric tiles ──────────────────────────────
    function renderTiles(filtered) {
        var crops = {};
        var dates = {};
        filtered.forEach(function (e) {
            crops[e.crop] = (crops[e.crop] || 0) + (e.weight || 0);
            if (e.date) dates[e.date] = true;
        });
        var cropsMerged = withBaseline(crops);
        var totalKg = Object.keys(cropsMerged).reduce(function (s, k) { return s + cropsMerged[k]; }, 0);
        var topCrop = Object.keys(cropsMerged).sort(function (a, b) { return cropsMerged[b] - cropsMerged[a]; })[0];
        var topCropKg = topCrop ? cropsMerged[topCrop] : 0;

        var tiles = document.getElementById('hv-tiles');
        tiles.innerHTML = [
            '<div class="hv-tile hv-tile-accent">',
                '<span class="hv-tile-icon">⚖️</span>',
                '<div class="hv-tile-label">Total Harvested</div>',
                '<div class="hv-tile-value">' + totalKg.toFixed(1) + '<span class="hv-tile-unit">kg</span></div>',
                '<div class="hv-tile-sub">Across ' + filtered.length + ' harvest entries</div>',
            '</div>',
            '<div class="hv-tile">',
                '<span class="hv-tile-icon">🌱</span>',
                '<div class="hv-tile-label">Crops Harvested</div>',
                '<div class="hv-tile-value">' + Object.keys(cropsMerged).length + '</div>',
                '<div class="hv-tile-sub">Different varieties</div>',
            '</div>',
            '<div class="hv-tile">',
                '<span class="hv-tile-icon">📅</span>',
                '<div class="hv-tile-label">Harvest Days</div>',
                '<div class="hv-tile-value">' + Object.keys(dates).length + '</div>',
                '<div class="hv-tile-sub">Days with harvest activity</div>',
            '</div>',
            '<div class="hv-tile">',
                '<span class="hv-tile-icon">🏆</span>',
                '<div class="hv-tile-label">Top Crop</div>',
                '<div class="hv-tile-value" style="font-size:1.7rem;">' + (topCrop ? esc(topCrop) : '—') + '</div>',
                '<div class="hv-tile-sub">' + (topCrop ? topCropKg.toFixed(1) + ' kg total' : 'No data') + '</div>',
            '</div>'
        ].join('');
    }

    // ── Photo grid (always full dataset, latest 12 with photos) ────
    function renderGrid() {
        var driveThumb = Harvest.utils.driveThumb;
        var grid = document.getElementById('hv-grid');
        var withPhotos = Harvest.state.allData
            .filter(function (e) { return !!driveThumb(e.photoUrl); })
            .slice()
            .sort(function (a, b) {
                return (b._date ? b._date.getTime() : 0) - (a._date ? a._date.getTime() : 0);
            })
            .slice(0, 12);

        if (!withPhotos.length) {
            grid.outerHTML = '<div class="hv-empty" id="hv-grid"><span class="hv-empty-icon">🌱</span><p>No harvest photos to show yet — add a Photo URL to a row in the sheet.</p></div>';
            return;
        }
        grid.innerHTML = withPhotos.map(function (e, idx) {
            var thumb = driveThumb(e.photoUrl);
            var month = e._date ? e._date.toLocaleDateString('en-IN', { month: 'long' }) : '';
            return ''
                + '<article class="hv-card" data-idx="' + idx + '" tabindex="0" role="button" aria-label="View harvest details">'
                +   '<img src="' + esc(thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\';">'
                +   (month ? '<span class="hv-card-month">' + esc(month) + '</span>' : '')
                + '</article>';
        }).join('');

        Array.prototype.forEach.call(grid.querySelectorAll('.hv-card'), function (card) {
            card.addEventListener('click', function () { openModal(withPhotos[parseInt(card.dataset.idx)]); });
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(withPhotos[parseInt(card.dataset.idx)]);
                }
            });
        });
        updateCarouselNav();
    }

    // ── Carousel navigation ────────────────────────────
    function updateCarouselNav() {
        var grid = document.getElementById('hv-grid');
        var prev = document.getElementById('hv-carousel-prev');
        var next = document.getElementById('hv-carousel-next');
        if (!grid || !prev || !next) return;
        var atStart = grid.scrollLeft <= 4;
        var atEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4;
        prev.disabled = atStart;
        next.disabled = atEnd;
    }
    function scrollCarousel(direction) {
        var grid = document.getElementById('hv-grid');
        if (!grid) return;
        var amount = Math.round(grid.clientWidth * 0.8);
        grid.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }

    // ── Modal ──────────────────────────────────────────
    function openModal(entry) {
        var driveThumb = Harvest.utils.driveThumb;
        var overlay = document.getElementById('hv-modal-overlay');
        var img = document.getElementById('hv-modal-img');
        var body = document.getElementById('hv-modal-body');
        var thumb = driveThumb(entry.photoUrl);
        if (thumb) {
            img.src = thumb;
            img.alt = '';
            img.style.display = '';
        } else {
            img.style.display = 'none';
        }
        var month = entry._date ? entry._date.toLocaleDateString('en-IN', { month: 'long' }) : '';
        body.innerHTML = month
            ? '<div style="text-align:center;font-family:Crimson Pro,serif;font-size:1.5rem;font-weight:600;color:var(--earth-dark);letter-spacing:0.5px;">' + esc(month) + '</div>'
            : '';
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal(e) {
        if (e && e.target && e.target.id !== 'hv-modal-overlay' && e.target.tagName !== 'BUTTON') return;
        document.getElementById('hv-modal-overlay').classList.remove('open');
        document.body.style.overflow = '';
    }
    // Expose for inline onclick attributes in HTML.
    window.closeHarvestModal = closeModal;
    window.openHarvestModal = openModal;

    // ── Crop search (autocomplete) ─────────────────────
    function buildCropList() {
        var st = Harvest.state;
        var crops = {};
        st.allData.forEach(function (e) {
            if (!e.crop) return;
            crops[e.crop] = (crops[e.crop] || 0) + 1;
        });
        Object.keys(Harvest.BASELINE).forEach(function (c) { crops[c] = crops[c] || 0; });
        st.cropEntryCount = crops;
        st.cropList = Object.keys(crops).sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
    }

    function highlightMatch(name, query) {
        if (!query) return esc(name);
        var idx = name.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return esc(name);
        return esc(name.slice(0, idx))
            + '<span class="hv-crop-suggestion-match">' + esc(name.slice(idx, idx + query.length)) + '</span>'
            + esc(name.slice(idx + query.length));
    }

    function renderSuggestions(query) {
        var box = document.getElementById('hv-crop-suggestions');
        if (!box) return;
        var st = Harvest.state;
        var q = (query || '').trim().toLowerCase();
        var matches = q
            ? st.cropList.filter(function (c) { return c.toLowerCase().indexOf(q) !== -1; })
            : st.cropList.slice();

        if (!matches.length) {
            box.innerHTML = '<div class="hv-crop-suggestion-empty">No crop matches "' + esc(query) + '"</div>';
            box.classList.add('open');
            st.activeSuggestionIdx = -1;
            return;
        }

        box.innerHTML = matches.map(function (c, i) {
            var n = st.cropEntryCount[c] || 0;
            var sub = n > 0 ? n + (n === 1 ? ' entry' : ' entries') : 'baseline only';
            return '<div class="hv-crop-suggestion" data-crop="' + esc(c) + '" data-idx="' + i + '" role="option">'
                + '<span>' + highlightMatch(c, q) + '</span>'
                + '<span class="hv-crop-suggestion-count">' + esc(sub) + '</span>'
                + '</div>';
        }).join('');
        box.classList.add('open');
        st.activeSuggestionIdx = -1;

        Array.prototype.forEach.call(box.querySelectorAll('.hv-crop-suggestion'), function (el) {
            // mousedown so it fires before the input's blur event closes the box
            el.addEventListener('mousedown', function (ev) {
                ev.preventDefault();
                selectCrop(el.dataset.crop);
            });
        });
    }

    function closeSuggestions() {
        var box = document.getElementById('hv-crop-suggestions');
        if (box) box.classList.remove('open');
        Harvest.state.activeSuggestionIdx = -1;
    }

    function selectCrop(crop) {
        var input = document.getElementById('hv-crop-search');
        var clear = document.getElementById('hv-crop-clear');
        if (input) input.value = crop;
        if (clear) clear.classList.add('visible');
        Harvest.state.currentCrop = crop;
        closeSuggestions();
        renderAll();
    }

    function clearCrop() {
        var input = document.getElementById('hv-crop-search');
        var clear = document.getElementById('hv-crop-clear');
        if (input) { input.value = ''; input.focus(); }
        if (clear) clear.classList.remove('visible');
        Harvest.state.currentCrop = '';
        renderSuggestions('');
        renderAll();
    }

    function moveActiveSuggestion(direction) {
        var box = document.getElementById('hv-crop-suggestions');
        if (!box) return;
        var items = box.querySelectorAll('.hv-crop-suggestion');
        if (!items.length) return;
        var st = Harvest.state;
        st.activeSuggestionIdx = (st.activeSuggestionIdx + direction + items.length) % items.length;
        Array.prototype.forEach.call(items, function (el, i) {
            el.classList.toggle('active', i === st.activeSuggestionIdx);
            if (i === st.activeSuggestionIdx) el.scrollIntoView({ block: 'nearest' });
        });
    }

    // ── WhatsApp share (text + URL) ────────────────────
    function updateShareLink() {
        var btn = document.getElementById('hv-share-btn');
        if (!btn) return;
        var crops = {};
        Harvest.state.allData.forEach(function (e) { crops[e.crop] = (crops[e.crop] || 0) + (e.weight || 0); });
        Object.keys(Harvest.BASELINE).forEach(function (c) { crops[c] = (crops[c] || 0) + Harvest.BASELINE[c]; });
        var totalKg = Object.keys(crops).reduce(function (s, k) { return s + crops[k]; }, 0);
        var topCrop = Object.keys(crops).sort(function (a, b) { return crops[b] - crops[a]; })[0];
        var msg = '🌱 Kota Natural Farm — Live Harvest\n\n'
                + '✓ ' + totalKg.toFixed(1) + ' kg harvested\n'
                + '✓ ' + Object.keys(crops).length + ' crops grown\n'
                + (topCrop ? '✓ Top crop: ' + topCrop + ' (' + crops[topCrop].toFixed(1) + ' kg)\n' : '')
                + '\nAll naturally grown — no chemicals, no synthetic fertiliser.\n\n'
                + 'See the live tracker: ' + window.location.href;
        btn.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    }

    // ── Top-level render orchestrator ──────────────────
    function renderAll() {
        var filtered = applyFilters(Harvest.state.allData);
        renderTiles(filtered);
        Harvest.charts.renderCrops(filtered);
        Harvest.charts.renderRecent(filtered);
        Harvest.charts.renderTrend(filtered);
        renderGrid();
        updateShareLink();
    }

    // ── Wire up DOM event handlers ─────────────────────
    function wireFilters() {
        var btns = document.querySelectorAll('#hv-period-filter .hv-filter-btn');
        Array.prototype.forEach.call(btns, function (b) {
            b.addEventListener('click', function () {
                Array.prototype.forEach.call(btns, function (x) { x.classList.remove('active'); });
                b.classList.add('active');
                Harvest.state.currentPeriod = b.dataset.period;
                renderAll();
            });
        });

        // Crop search wiring
        var search = document.getElementById('hv-crop-search');
        var clearBtn = document.getElementById('hv-crop-clear');
        if (search) {
            search.addEventListener('focus', function () { renderSuggestions(search.value); });
            search.addEventListener('input', function () {
                if (clearBtn) clearBtn.classList.toggle('visible', !!search.value);
                renderSuggestions(search.value);
                if (Harvest.state.currentCrop && search.value !== Harvest.state.currentCrop) {
                    Harvest.state.currentCrop = '';
                    renderAll();
                }
            });
            search.addEventListener('keydown', function (e) {
                var box = document.getElementById('hv-crop-suggestions');
                var open = box && box.classList.contains('open');
                if (e.key === 'ArrowDown') {
                    if (!open) renderSuggestions(search.value);
                    moveActiveSuggestion(1); e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                    moveActiveSuggestion(-1); e.preventDefault();
                } else if (e.key === 'Enter') {
                    var items = box ? box.querySelectorAll('.hv-crop-suggestion') : [];
                    var pick = Harvest.state.activeSuggestionIdx >= 0
                        ? items[Harvest.state.activeSuggestionIdx]
                        : items[0];
                    if (pick) { e.preventDefault(); selectCrop(pick.dataset.crop); }
                } else if (e.key === 'Escape') {
                    closeSuggestions();
                }
            });
            search.addEventListener('blur', function () {
                setTimeout(closeSuggestions, 150);
            });
        }
        if (clearBtn) clearBtn.addEventListener('click', clearCrop);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });

        // Carousel arrows
        var prev = document.getElementById('hv-carousel-prev');
        var next = document.getElementById('hv-carousel-next');
        if (prev) prev.addEventListener('click', function () { scrollCarousel(-1); });
        if (next) next.addEventListener('click', function () { scrollCarousel(1); });
        var grid = document.getElementById('hv-grid');
        if (grid) grid.addEventListener('scroll', updateCarouselNav, { passive: true });
        window.addEventListener('resize', updateCarouselNav);
    }

    // Public surface — anything called from other modules / boot.
    Harvest.ui = {
        applyFilters: applyFilters,
        withBaseline: withBaseline,
        renderTiles: renderTiles,
        renderGrid: renderGrid,
        renderAll: renderAll,
        wireFilters: wireFilters,
        buildCropList: buildCropList,
        openModal: openModal,
        closeModal: closeModal
    };

})(window.Harvest = window.Harvest || {});
