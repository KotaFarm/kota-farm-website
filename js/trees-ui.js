/* ──────────────────────────────────────────────────────────────
   Tree progress — rendering

   Three levels, because "how is Karanj doing across the farm?" is the
   question people actually arrive with:

     1. Species index — one card per species (Sheesham, Karanj, Neem…)
     2. Species view  — every tagged tree of that species, its zones
                        and recent activity
     3. Tree detail   — one tree's photo timeline

   Each level is deep-linkable (?species=Sheesham, ?tree=S-001) and
   pushes history, so Back walks out the way the visitor walked in.
   ────────────────────────────────────────────────────────────── */

(function () {
    'use strict';

    var T = window.TreeProgress;
    var LATEST_COUNT = 6;

    var trees = [];
    var activeSpecies = null;    // null = species index
    var activeZone = 'all';
    var query = '';
    var current = null;          // tree open in the detail overlay
    var currentKind = 0;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function agoLabel(d) {
        var s = T.sinceLabel(d);
        return s === 'today' ? 'today' : s + ' ago';
    }

    function fullSize(url) {
        return String(url || '').replace(/([?&]sz=)w\d+/, '$1w2000');
    }

    function leafPlaceholder() {
        return '<div class="tp-noimg" aria-hidden="true">'
             +   '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" '
             +        'stroke="currentColor" stroke-width="1.5">'
             +     '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>'
             +     '<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'
             +   '</svg>'
             + '</div>';
    }

    function heroOf(tree) {
        var latest = tree.visits[0];
        return latest && latest.photos.length ? latest.photos[0].url : '';
    }

    // ── Grouping ──────────────────────────────────────────
    function speciesGroups() {
        var by = {};
        trees.forEach(function (t) {
            var name = t.species || 'Unidentified';
            if (!by[name]) {
                by[name] = { name: name, trees: [], zones: {}, visits: 0, latest: null, hero: '' };
            }
            var g = by[name];
            g.trees.push(t);
            if (t.zone) g.zones[t.zone] = true;
            g.visits += t.visits.length;

            var v = t.visits[0];
            if (v && v.date && (!g.latest || v.date > g.latest)) g.latest = v.date;
            if (!g.hero) g.hero = heroOf(t);
        });

        return Object.keys(by).sort().map(function (k) {
            var g = by[k];
            g.zoneList = Object.keys(g.zones).sort();
            return g;
        });
    }

    // Trees shown at the current level, after species / zone / search.
    function visible() {
        var q = query.trim().toLowerCase();
        return trees.filter(function (t) {
            if (activeSpecies && (t.species || 'Unidentified') !== activeSpecies) return false;
            if (activeZone !== 'all' && (t.zone || 'Unzoned') !== activeZone) return false;
            if (!q) return true;
            return (t.tag + ' ' + t.species + ' ' + t.zone).toLowerCase().indexOf(q) !== -1;
        });
    }

    // ── Toolbar (zone chips + count) ──────────────────────
    function renderFilters() {
        var mount = document.getElementById('tp-filters');
        if (!mount) return;

        // Zones only matter once you're inside a species.
        if (!activeSpecies) { mount.innerHTML = ''; return; }

        var pool = trees.filter(function (t) {
            return (t.species || 'Unidentified') === activeSpecies;
        });
        var counts = {};
        pool.forEach(function (t) {
            var z = t.zone || 'Unzoned';
            counts[z] = (counts[z] || 0) + 1;
        });
        var zones = Object.keys(counts).sort();

        if (zones.length < 2) { mount.innerHTML = ''; return; }

        var html = '<div class="tp-chips" role="group" aria-label="Filter by area">'
                 + '<button type="button" class="tp-chip' + (activeZone === 'all' ? ' active' : '') + '"'
                 + ' data-zone="all">All areas <span class="tp-chip-n">' + pool.length + '</span></button>';
        zones.forEach(function (z) {
            html += '<button type="button" class="tp-chip' + (activeZone === z ? ' active' : '') + '"'
                 +  ' data-zone="' + esc(z) + '">' + esc(z)
                 +  ' <span class="tp-chip-n">' + counts[z] + '</span></button>';
        });
        html += '</div>';
        mount.innerHTML = html;

        Array.prototype.forEach.call(mount.querySelectorAll('.tp-chip'), function (btn) {
            btn.addEventListener('click', function () {
                activeZone = btn.dataset.zone;
                renderFilters();
                renderMain();
            });
        });
    }

    function renderBreadcrumb() {
        var el = document.getElementById('tp-crumb');
        if (!el) return;
        if (!activeSpecies) { el.innerHTML = ''; el.style.display = 'none'; return; }

        el.style.display = '';
        el.innerHTML = '<button type="button" class="tp-crumb-back" id="tp-crumb-back">'
                     +   '&larr; All species'
                     + '</button>'
                     + '<span class="tp-crumb-current">' + esc(activeSpecies) + '</span>';

        var back = document.getElementById('tp-crumb-back');
        if (back) back.addEventListener('click', function () { showAllSpecies('push'); });
    }

    // ── Level 1: species index ────────────────────────────
    function renderSpeciesIndex() {
        var mount = document.getElementById('tp-grid');
        var info = document.getElementById('tp-count');
        var groups = speciesGroups();

        var q = query.trim().toLowerCase();
        if (q) groups = groups.filter(function (g) {
            return g.name.toLowerCase().indexOf(q) !== -1;
        });

        if (info) {
            info.textContent = groups.length
                ? groups.length + (groups.length === 1 ? ' species' : ' species')
                : '';
        }

        if (!groups.length) {
            mount.innerHTML = '<p class="tp-empty">No species match that search.</p>';
            return;
        }

        mount.className = 'tp-grid';
        mount.innerHTML = groups.map(function (g) {
            return ''
              + '<button type="button" class="tp-card tp-species-card" data-species="' + esc(g.name) + '">'
              +   '<span class="tp-card-img">'
              +     (g.hero
                        ? '<img src="' + esc(g.hero) + '" alt="' + esc(g.name) + '" loading="lazy"'
                          + ' referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">'
                        : leafPlaceholder())
              +     '<span class="tp-card-tag">' + g.trees.length
              +        (g.trees.length === 1 ? ' tree' : ' trees') + '</span>'
              +   '</span>'
              +   '<span class="tp-card-body">'
              +     '<span class="tp-card-species">' + esc(g.name) + '</span>'
              +     '<span class="tp-card-meta">' + esc(g.zoneList.join(' · ') || '—') + '</span>'
              +     '<span class="tp-card-since">'
              +        g.visits + (g.visits === 1 ? ' visit' : ' visits')
              +        (g.latest ? ' · last ' + esc(agoLabel(g.latest)) : '')
              +     '</span>'
              +   '</span>'
              + '</button>';
        }).join('');

        Array.prototype.forEach.call(mount.querySelectorAll('.tp-species-card'), function (el) {
            el.addEventListener('click', function () { showSpecies(el.dataset.species, 'push'); });
        });
    }

    // ── Level 2: trees of one species ─────────────────────
    function renderTreeGrid() {
        var mount = document.getElementById('tp-grid');
        var info = document.getElementById('tp-count');
        var list = visible();

        if (info) {
            info.textContent = list.length + (list.length === 1 ? ' tree' : ' trees');
        }

        if (!list.length) {
            mount.innerHTML = '<p class="tp-empty">No trees match that filter.</p>';
            return;
        }

        mount.className = 'tp-grid';
        mount.innerHTML = list.map(function (tree) {
            var hero = heroOf(tree);
            var visits = tree.visits.length;
            return ''
              + '<button type="button" class="tp-card" data-tag="' + esc(tree.tag) + '">'
              +   '<span class="tp-card-img">'
              +     (hero
                        ? '<img src="' + esc(hero) + '" alt="' + esc(tree.species) + ' ' + esc(tree.tag) + '"'
                          + ' loading="lazy" referrerpolicy="no-referrer"'
                          + ' onerror="this.style.display=\'none\'">'
                        : leafPlaceholder())
              +     '<span class="tp-card-tag">' + esc(tree.tag) + '</span>'
              +   '</span>'
              +   '<span class="tp-card-body">'
              +     '<span class="tp-card-species">' + esc(tree.tag) + '</span>'
              +     '<span class="tp-card-meta">' + esc(tree.zone) + '</span>'
              +     '<span class="tp-card-since">'
              +        visits + (visits === 1 ? ' visit' : ' visits')
              +        (tree.visits[0] && tree.visits[0].date
                            ? ' · last ' + esc(agoLabel(tree.visits[0].date))
                            : '')
              +     '</span>'
              +   '</span>'
              + '</button>';
        }).join('');

        Array.prototype.forEach.call(mount.querySelectorAll('.tp-card'), function (el) {
            el.addEventListener('click', function () { openByTag(el.dataset.tag); });
        });
    }

    function renderMain() {
        if (activeSpecies) renderTreeGrid();
        else renderSpeciesIndex();
    }

    // ── Latest updates (species index only) ───────────────
    function renderLatest() {
        var mount = document.getElementById('tp-latest');
        var section = document.getElementById('tp-latest-section');
        if (!mount || !section) return;

        var all = [];
        trees.forEach(function (tree) {
            tree.visits.forEach(function (v) {
                if (v.date) all.push({ tree: tree, visit: v });
            });
        });
        all.sort(function (a, b) { return b.visit.date - a.visit.date; });

        // Only meaningful once there's activity beyond one visit per tree,
        // and only on the index — inside a species it would repeat the grid.
        if (activeSpecies || all.length < 2 || all.length === trees.length) {
            section.style.display = 'none';
            return;
        }
        section.style.display = '';

        mount.innerHTML = all.slice(0, LATEST_COUNT).map(function (item) {
            var photo = item.visit.photos[0];
            return ''
              + '<button type="button" class="tp-latest-card" data-tag="' + esc(item.tree.tag) + '">'
              +   '<span class="tp-latest-img">'
              +     (photo
                        ? '<img src="' + esc(photo.url) + '" alt="" loading="lazy"'
                          + ' referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">'
                        : leafPlaceholder())
              +   '</span>'
              +   '<span class="tp-latest-info">'
              +     '<span class="tp-latest-tag">' + esc(item.tree.tag) + ' · ' + esc(item.tree.species) + '</span>'
              +     '<span class="tp-latest-date">' + esc(agoLabel(item.visit.date)) + '</span>'
              +   '</span>'
              + '</button>';
        }).join('');

        Array.prototype.forEach.call(mount.querySelectorAll('.tp-latest-card'), function (el) {
            el.addEventListener('click', function () { openByTag(el.dataset.tag); });
        });
    }

    function renderIntro() {
        var el = document.getElementById('tp-intro');
        if (!el) return;
        var visits = trees.reduce(function (n, t) { return n + t.visits.length; }, 0);
        var species = speciesGroups().length;
        el.textContent = trees.length
            ? species + (species === 1 ? ' species' : ' species') + ' · '
              + trees.length + ' tagged trees · ' + visits + ' recorded visit'
              + (visits === 1 ? '' : 's')
            : '';
    }

    // ── Level switching + history ─────────────────────────
    // mode: 'push' adds a history entry, 'replace' swaps it, 'none' skips.
    function writeState(mode, state, url) {
        if (mode === 'none') return;
        try {
            if (mode === 'replace') history.replaceState(state, '', url);
            else history.pushState(state, '', url);
        } catch (e) {}
    }

    function showAllSpecies(mode) {
        activeSpecies = null;
        activeZone = 'all';
        renderBreadcrumb();
        renderFilters();
        renderLatest();
        renderMain();
        writeState(mode, {}, location.pathname);
    }

    function showSpecies(name, mode) {
        activeSpecies = name;
        activeZone = 'all';
        renderBreadcrumb();
        renderFilters();
        renderLatest();
        renderMain();
        writeState(mode, { species: name }, '?species=' + encodeURIComponent(name));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Level 3: tree detail ──────────────────────────────
    function openByTag(tag) {
        var tree = trees.filter(function (t) { return t.tag === tag; })[0];
        if (!tree) return;
        // Opening from "Latest updates" can cross into another species —
        // move the page there too, so closing lands somewhere coherent.
        if (activeSpecies !== tree.species) {
            activeSpecies = tree.species;
            activeZone = 'all';
            renderBreadcrumb();
            renderFilters();
            renderLatest();
            renderMain();
        }
        openDetail(tree, 'push');
    }

    function siblings() {
        var list = visible();
        var i = -1;
        list.forEach(function (t, n) { if (current && t.tag === current.tag) i = n; });
        return {
            prev: i > 0 ? list[i - 1] : null,
            next: i > -1 && i < list.length - 1 ? list[i + 1] : null,
            index: i,
            total: list.length
        };
    }

    function openDetail(tree, mode) {
        current = tree;
        currentKind = 0;
        renderDetail();
        document.getElementById('tp-detail-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
        var close = document.getElementById('tp-detail-close');
        if (close) close.focus();

        writeState(mode, { species: tree.species, tree: tree.tag },
                   '?tree=' + encodeURIComponent(tree.tag));
    }

    function hideDetail() {
        document.getElementById('tp-detail-overlay').classList.remove('open');
        document.body.style.overflow = '';
        current = null;
    }

    function closeDetail(e) {
        if (e && e.target && e.target.id !== 'tp-detail-overlay'
            && e.target.id !== 'tp-detail-close') return;
        if (history.state && history.state.tree) history.back();
        else hideDetail();
    }

    function step(dir) {
        var s = siblings();
        var target = dir < 0 ? s.prev : s.next;
        if (target) openDetail(target, 'replace');
    }

    function renderDetail() {
        var body = document.getElementById('tp-detail-body');
        if (!body || !current) return;

        var tree = current;
        var kinds = T.PHOTO_KINDS.map(function (k) { return k.label; });
        var available = kinds.filter(function (label) {
            return tree.visits.some(function (v) {
                return v.photos.some(function (p) { return p.label === label; });
            });
        });
        if (currentKind >= available.length) currentKind = 0;
        var activeLabel = available[currentKind];
        var sib = siblings();

        var html = ''
          + '<header class="tp-detail-head">'
          +   '<h2 class="tp-detail-title">' + esc(tree.tag) + '</h2>'
          +   '<p class="tp-detail-sub">'
          +      esc(tree.species) + ' · ' + esc(tree.zone)
          +      (tree.status ? ' · ' + esc(tree.status) : '')
          +      (tree.tagged ? ' · tagged ' + esc(T.fmtDate(tree.tagged)) : '')
          +   '</p>'
          + '</header>';

        if (sib.total > 1) {
            html += '<nav class="tp-nav" aria-label="Move between trees">'
                 +   '<button type="button" class="tp-nav-btn" id="tp-prev"'
                 +     (sib.prev ? '' : ' disabled') + ' aria-label="Previous tree">‹ '
                 +     esc(sib.prev ? sib.prev.tag : 'Prev') + '</button>'
                 +   '<span class="tp-nav-pos">' + (sib.index + 1) + ' of ' + sib.total
                 +     ' · ' + esc(tree.species) + '</span>'
                 +   '<button type="button" class="tp-nav-btn" id="tp-next"'
                 +     (sib.next ? '' : ' disabled') + ' aria-label="Next tree">'
                 +     esc(sib.next ? sib.next.tag : 'Next') + ' ›</button>'
                 + '</nav>';
        }

        if (available.length > 1) {
            html += '<div class="tp-tabs" role="tablist">'
                 + available.map(function (label, i) {
                     return '<button type="button" class="tp-tab' + (i === currentKind ? ' active' : '') + '"'
                          + ' data-kind="' + i + '" role="tab"'
                          + ' aria-selected="' + (i === currentKind) + '">'
                          + esc(label) + '</button>';
                   }).join('')
                 + '</div>';
        }

        html += '<div class="tp-timeline">';
        if (!tree.visits.length) html += '<p class="tp-empty">No visits recorded yet.</p>';
        tree.visits.forEach(function (visit) {
            var photo = visit.photos.filter(function (p) { return p.label === activeLabel; })[0]
                     || visit.photos[0];
            html += ''
              + '<article class="tp-visit">'
              +   '<div class="tp-visit-img">'
              +     (photo
                        ? '<img src="' + esc(photo.url) + '" alt="' + esc(tree.species) + ' on '
                          + esc(T.fmtDate(visit.date)) + '" loading="lazy"'
                          + ' referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"'
                          + ' class="tp-zoom" tabindex="0" role="button"'
                          + ' aria-label="View full size photo from ' + esc(T.fmtDate(visit.date)) + '"'
                          + ' data-full="' + esc(photo.url) + '">'
                        : leafPlaceholder())
              +   '</div>'
              +   '<div class="tp-visit-info">'
              +     '<div class="tp-visit-date">' + esc(T.fmtDate(visit.date)) + '</div>'
              +     (visit.date ? '<div class="tp-visit-ago">' + esc(agoLabel(visit.date)) + '</div>' : '')
              +     (visit.notes ? '<p class="tp-visit-notes">' + esc(visit.notes) + '</p>' : '')
              +   '</div>'
              + '</article>';
        });
        html += '</div>';

        if (tree.visits.length === 1) {
            html += '<p class="tp-detail-foot">First record. We photograph each tagged '
                  + 'tree through the seasons — the comparison builds from here.</p>';
        }

        body.innerHTML = html;

        var prevBtn = body.querySelector('#tp-prev');
        var nextBtn = body.querySelector('#tp-next');
        if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

        Array.prototype.forEach.call(body.querySelectorAll('.tp-tab'), function (btn) {
            btn.addEventListener('click', function () {
                currentKind = parseInt(btn.dataset.kind, 10);
                renderDetail();
            });
        });

        Array.prototype.forEach.call(body.querySelectorAll('.tp-zoom'), function (img) {
            img.addEventListener('click', function () { openLightbox(img.dataset.full, img.alt); });
            img.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(img.dataset.full, img.alt);
                }
            });
        });
    }

    // ── Full-size viewer ──────────────────────────────────
    function openLightbox(url, alt) {
        var box = document.getElementById('tp-lightbox');
        var img = document.getElementById('tp-lightbox-img');
        if (!box || !img) return;
        img.src = fullSize(url);
        img.alt = alt || '';
        box.classList.add('open');
        document.body.style.overflow = 'hidden';
        var close = document.getElementById('tp-lightbox-close');
        if (close) close.focus();
    }

    function closeLightbox() {
        var box = document.getElementById('tp-lightbox');
        if (!box || !box.classList.contains('open')) return false;
        box.classList.remove('open');
        document.getElementById('tp-lightbox-img').src = '';
        if (!document.getElementById('tp-detail-overlay').classList.contains('open')) {
            document.body.style.overflow = '';
        }
        return true;
    }

    // ── Restore a level from the URL / history state ──────
    function applyState(state, mode) {
        var tag = state && state.tree;
        var species = state && state.species;

        if (tag) {
            var tree = trees.filter(function (t) { return t.tag === tag; })[0];
            if (tree) {
                activeSpecies = tree.species;
                activeZone = 'all';
                renderBreadcrumb(); renderFilters(); renderLatest(); renderMain();
                openDetail(tree, mode);
                return;
            }
        }
        hideDetail();
        if (species) showSpecies(species, mode);
        else showAllSpecies(mode);
    }

    function stateFromUrl() {
        var t = location.search.match(/[?&]tree=([^&]+)/);
        if (t) {
            var tag = decodeURIComponent(t[1]);
            var tree = trees.filter(function (x) { return x.tag === tag; })[0];
            return tree ? { species: tree.species, tree: tag } : {};
        }
        var s = location.search.match(/[?&]species=([^&]+)/);
        if (s) return { species: decodeURIComponent(s[1]) };
        return {};
    }

    // ── Boot ──────────────────────────────────────────────
    function init() {
        var grid = document.getElementById('tp-grid');
        if (!grid) return;

        T.load().then(
            function (data) {
                trees = data;
                renderIntro();
                // 'replace' — don't add an entry on first paint, so Back
                // leaves the site rather than cycling within the page.
                applyState(stateFromUrl(), 'replace');
            },
            function () {
                grid.innerHTML = '<p class="tp-empty">Tree records are temporarily '
                               + 'unavailable. Please try again shortly.</p>';
            }
        );

        var search = document.getElementById('tp-search');
        if (search) {
            search.addEventListener('input', function () {
                query = search.value;
                renderMain();
            });
        }

        var overlay = document.getElementById('tp-detail-overlay');
        if (overlay) overlay.addEventListener('click', closeDetail);
        var close = document.getElementById('tp-detail-close');
        if (close) close.addEventListener('click', closeDetail);

        var lb = document.getElementById('tp-lightbox');
        if (lb) lb.addEventListener('click', closeLightbox);
        var lbClose = document.getElementById('tp-lightbox-close');
        if (lbClose) lbClose.addEventListener('click', function (e) {
            e.stopPropagation();
            closeLightbox();
        });

        window.addEventListener('popstate', function (e) {
            applyState(e.state || stateFromUrl(), 'none');
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (!closeLightbox()) closeDetail();
                return;
            }
            if (!current) return;
            if (document.getElementById('tp-lightbox').classList.contains('open')) return;
            if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
            if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
