/* ──────────────────────────────────────────────────────────────
   Tree progress — rendering

   Two layers that switch on with the data:
     1. Grove grid   — works from the first photo
     2. Tree detail  — profile at one visit, timeline at several
   A before/after comparison belongs here once trees have two dated
   "Whole tree" shots; deliberately left out until the data exists,
   so nothing renders empty.
   ────────────────────────────────────────────────────────────── */

(function () {
    'use strict';

    var T = window.TreeProgress;
    var trees = [];
    var current = null;
    var currentKind = 0;

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
        // The tree detail is still open underneath, so keep scroll locked.
        if (!document.getElementById('tp-detail-overlay').classList.contains('open')) {
            document.body.style.overflow = '';
        }
        return true;
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

    // ── Grove grid ────────────────────────────────────────
    function renderGrid() {
        var mount = document.getElementById('tp-grid');
        if (!mount) return;

        if (!trees.length) {
            mount.innerHTML = '<p class="tp-empty">No tagged trees yet.</p>';
            return;
        }

        mount.innerHTML = trees.map(function (tree, i) {
            var latest = tree.visits[0];
            var hero = latest && latest.photos.length ? latest.photos[0].url : '';
            var visitLabel = tree.visits.length === 1
                ? '1 visit'
                : tree.visits.length + ' visits';

            return ''
              + '<button type="button" class="tp-card" data-idx="' + i + '">'
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
              +        (tree.tagged ? 'Followed ' + esc(T.sinceLabel(tree.tagged)) : '')
              +        ' · ' + esc(visitLabel)
              +     '</span>'
              +   '</span>'
              + '</button>';
        }).join('');

        Array.prototype.forEach.call(mount.querySelectorAll('.tp-card'), function (el) {
            el.addEventListener('click', function () {
                openDetail(trees[parseInt(el.dataset.idx, 10)]);
            });
        });
    }

    // Summary line above the grid — states plainly how early this is.
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

    // ── Detail panel ──────────────────────────────────────
    function openDetail(tree) {
        current = tree;
        currentKind = 0;
        renderDetail();
        document.getElementById('tp-detail-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
        var close = document.getElementById('tp-detail-close');
        if (close) close.focus();
    }

    function closeDetail(e) {
        if (e && e.target && e.target.id !== 'tp-detail-overlay'
            && e.target.id !== 'tp-detail-close') return;
        document.getElementById('tp-detail-overlay').classList.remove('open');
        document.body.style.overflow = '';
        current = null;
    }

    function renderDetail() {
        var body = document.getElementById('tp-detail-body');
        if (!body || !current) return;

        var tree = current;
        var kinds = T.PHOTO_KINDS.map(function (k) { return k.label; });

        // Which photo types actually exist across this tree's visits.
        var available = kinds.filter(function (label) {
            return tree.visits.some(function (v) {
                return v.photos.some(function (p) { return p.label === label; });
            });
        });
        if (!available.length) available = [];
        if (currentKind >= available.length) currentKind = 0;
        var activeLabel = available[currentKind];

        var html = ''
          + '<header class="tp-detail-head">'
          +   '<div>'
          +     '<h2 class="tp-detail-title">' + esc(tree.species) + '</h2>'
          +     '<p class="tp-detail-sub">'
          +        esc(tree.tag) + ' · ' + esc(tree.zone)
          +        (tree.status ? ' · ' + esc(tree.status) : '')
          +        (tree.tagged ? ' · tagged ' + esc(T.fmtDate(tree.tagged)) : '')
          +     '</p>'
          +   '</div>'
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

        // One entry per visit, newest first.
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
              +     (visit.date
                        ? '<div class="tp-visit-ago">' + esc(agoLabel(visit.date)) + '</div>'
                        : '')
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
            img.addEventListener('click', function () {
                openLightbox(img.dataset.full, img.alt);
            });
            img.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(img.dataset.full, img.alt);
                }
            });
        });
    }

    // ── Boot ──────────────────────────────────────────────
    function init() {
        var grid = document.getElementById('tp-grid');
        if (!grid) return;

        T.load().then(
            function (data) {
                trees = data;
                renderIntro();
                renderGrid();
            },
            function () {
                grid.innerHTML = '<p class="tp-empty">Tree records are temporarily '
                               + 'unavailable. Please try again shortly.</p>';
            }
        );

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

        // Escape closes the lightbox first, leaving the tree detail open.
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
