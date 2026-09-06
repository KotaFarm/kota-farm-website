/* ──────────────────────────────────────────────────────────────
   Tree progress — rendering

   Built to stay usable as the grove grows from 6 trees to 60+:

     Latest updates — newest visits across all trees, so a new Progress
                      entry surfaces on the page without anyone curating
     Filters        — zone chips with live counts, plus tag/species search
     Grove grid     — the filtered set
     Tree detail    — per-tree timeline, deep-linkable via ?tree=S-001

   A before/after comparison belongs here once trees have two dated
   "Whole tree" shots; deliberately absent until the data exists.
   ────────────────────────────────────────────────────────────── */

(function () {
    'use strict';

    var T = window.TreeProgress;

    var LATEST_COUNT = 6;

    var trees = [];
    var current = null;
    var currentKind = 0;
    var activeZone = 'all';
    var query = '';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // sinceLabel returns a bare duration ("3 months") or "today" — only the
    // former takes "ago".
    function agoLabel(d) {
        var s = T.sinceLabel(d);
        return s === 'today' ? 'today' : s + ' ago';
    }

    // Drive serves any width off the same file id, so the card thumbnail and
    // the full-size view differ only by the sz parameter.
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

    // ── Filtering ─────────────────────────────────────────
    function zonesWithCounts() {
        var counts = {};
        trees.forEach(function (t) {
            var z = t.zone || 'Unzoned';
            counts[z] = (counts[z] || 0) + 1;
        });
        return Object.keys(counts).sort().map(function (z) {
            return { zone: z, count: counts[z] };
        });
    }

    function visible() {
        var q = query.trim().toLowerCase();
        return trees.filter(function (t) {
            if (activeZone !== 'all' && (t.zone || 'Unzoned') !== activeZone) return false;
            if (!q) return true;
            return (t.tag + ' ' + t.species + ' ' + t.zone).toLowerCase().indexOf(q) !== -1;
        });
    }

    function renderFilters() {
        var mount = document.getElementById('tp-filters');
        if (!mount) return;

        var zones = zonesWithCounts();
        // A single zone needs no chips — don't show a filter that can't filter.
        if (zones.length < 2 && !query) {
            mount.innerHTML = '';
            return;
        }

        var html = '<div class="tp-chips" role="group" aria-label="Filter by area">'
                 + '<button type="button" class="tp-chip' + (activeZone === 'all' ? ' active' : '') + '"'
                 + ' data-zone="all">All <span class="tp-chip-n">' + trees.length + '</span></button>';

        zones.forEach(function (z) {
            html += '<button type="button" class="tp-chip' + (activeZone === z.zone ? ' active' : '') + '"'
                 +  ' data-zone="' + esc(z.zone) + '">' + esc(z.zone)
                 +  ' <span class="tp-chip-n">' + z.count + '</span></button>';
        });
        html += '</div>';

        mount.innerHTML = html;

        Array.prototype.forEach.call(mount.querySelectorAll('.tp-chip'), function (btn) {
            btn.addEventListener('click', function () {
                activeZone = btn.dataset.zone;
                renderFilters();
                renderGrid();
            });
        });
    }

    // ── Latest updates ────────────────────────────────────
    // Flattens visits across every tree so a newly logged entry appears here
    // on the next page load, with no editing.
    function renderLatest() {
        var mount = document.getElementById('tp-latest');
        var section = document.getElementById('tp-latest-section');
        if (!mount) return;

        var all = [];
        trees.forEach(function (tree) {
            tree.visits.forEach(function (v) {
                if (v.date) all.push({ tree: tree, visit: v });
            });
        });
        all.sort(function (a, b) { return b.visit.date - a.visit.date; });

        // With one visit per tree this would just mirror the grid — only
        // worth showing once there's genuine recent activity to surface.
        if (all.length < 2 || all.length === trees.length) {
            if (section) section.style.display = 'none';
            return;
        }
        if (section) section.style.display = '';

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

    // ── Grove grid ────────────────────────────────────────
    function renderGrid() {
        var mount = document.getElementById('tp-grid');
        var info = document.getElementById('tp-count');
        if (!mount) return;

        var list = visible();

        if (info) {
            info.textContent = list.length === trees.length
                ? trees.length + (trees.length === 1 ? ' tree' : ' trees')
                : list.length + ' of ' + trees.length + ' trees';
        }

        if (!list.length) {
            mount.innerHTML = '<p class="tp-empty">No trees match that filter.</p>';
            return;
        }

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
              +     '<span class="tp-card-species">' + esc(tree.species) + '</span>'
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

    function renderIntro() {
        var el = document.getElementById('tp-intro');
        if (!el) return;
        var visits = trees.reduce(function (n, t) { return n + t.visits.length; }, 0);
        var oldest = trees.map(function (t) { return t.tagged; })
                          .filter(Boolean)
                          .sort(function (a, b) { return a - b; })[0];

        el.textContent = trees.length
            ? trees.length + ' tagged trees · ' + visits + ' recorded visit'
              + (visits === 1 ? '' : 's')
              + (oldest ? ' · following since ' + T.fmtDate(oldest) : '')
            : '';
    }

    // ── Detail ────────────────────────────────────────────
    function openByTag(tag) {
        var tree = trees.filter(function (t) { return t.tag === tag; })[0];
        if (tree) openDetail(tree);
    }

    function openDetail(tree, skipHistory) {
        current = tree;
        currentKind = 0;
        renderDetail();
        document.getElementById('tp-detail-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
        var close = document.getElementById('tp-detail-close');
        if (close) close.focus();

        // Deep link, so a tree can be shared or reopened from a bookmark.
        if (!skipHistory) {
            try {
                history.replaceState(null, '', '?tree=' + encodeURIComponent(tree.tag));
            } catch (e) {}
        }
    }

    function closeDetail(e) {
        if (e && e.target && e.target.id !== 'tp-detail-overlay'
            && e.target.id !== 'tp-detail-close') return;
        document.getElementById('tp-detail-overlay').classList.remove('open');
        document.body.style.overflow = '';
        current = null;
        try { history.replaceState(null, '', location.pathname); } catch (err) {}
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

        var html = ''
          + '<header class="tp-detail-head">'
          +   '<h2 class="tp-detail-title">' + esc(tree.species) + '</h2>'
          +   '<p class="tp-detail-sub">'
          +      esc(tree.tag) + ' · ' + esc(tree.zone)
          +      (tree.status ? ' · ' + esc(tree.status) : '')
          +      (tree.tagged ? ' · tagged ' + esc(T.fmtDate(tree.tagged)) : '')
          +   '</p>'
          + '</header>';

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
        if (!tree.visits.length) {
            html += '<p class="tp-empty">No visits recorded yet.</p>';
        }
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

    // ── Boot ──────────────────────────────────────────────
    function init() {
        var grid = document.getElementById('tp-grid');
        if (!grid) return;

        T.load().then(
            function (data) {
                trees = data;
                renderIntro();
                renderLatest();
                renderFilters();
                renderGrid();

                // ?tree=S-001 opens that tree straight away.
                var m = location.search.match(/[?&]tree=([^&]+)/);
                if (m) openByTag(decodeURIComponent(m[1]));
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
                renderGrid();
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

        // Escape closes the photo first, leaving the tree detail open.
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (!closeLightbox()) closeDetail();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
