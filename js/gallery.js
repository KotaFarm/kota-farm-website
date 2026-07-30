(function () {
    'use strict';

    // escapeHtml() provided by js/common.js
    var escapeHtml = window.escapeHtml;

    // ── Gallery item builder ────────────────────────────
    function createGalleryItem(item) {
        var div = document.createElement('div');
        div.className = 'gallery-item fade-in';

        var isVideo = item.file.match(/\.(mp4|webm|mov)$/i);

        if (isVideo) {
            div.innerHTML =
                '<video controls loop muted preload="none" loading="lazy">' +
                '<source src="gallery/' + item.file + '" type="video/' + item.file.split('.').pop() + '">' +
                'Your browser does not support video playback.' +
                '</video>' +
                '<div class="gallery-caption"><p>' + escapeHtml(item.caption) + '</p></div>';
        } else {
            var src = 'gallery/' + item.file;
            var caption = item.caption;
            var img = document.createElement('img');
            img.className = 'loading';
            img.alt = caption;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.cursor = 'pointer';
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            img.setAttribute('aria-label', 'View full size: ' + caption);
            img.addEventListener('load', function () { img.classList.remove('loading'); img.classList.add('loaded'); });
            img.src = src;
            img.addEventListener('click', function () { openLightbox(img.src); });
            img.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(img.src); }
            });
            div.appendChild(img);
            var capDiv = document.createElement('div');
            capDiv.className = 'gallery-caption';
            capDiv.innerHTML = '<p>' + escapeHtml(caption) + '</p>';
            div.appendChild(capDiv);
        }
        return div;
    }

    // ── Fade-in observer ────────────────────────────────
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // ── Load gallery ────────────────────────────────────
    function loadGallery() {
        var container = document.getElementById('gallery-grid-container');
        var filtersBar = document.getElementById('gallery-filters');
        var loadingEl = document.getElementById('gallery-loading');

        if (typeof galleryItems === 'undefined' || !galleryItems.length) {
            if (loadingEl) loadingEl.remove();
            container.innerHTML = '<p style="color: var(--earth-medium); text-align: center;">Gallery could not be loaded.</p>';
            return;
        }
        if (loadingEl) loadingEl.remove();

        var categories = (typeof galleryCategories !== 'undefined') ? galleryCategories : [];
        var hasCategories = categories.length > 0 && galleryItems.some(function (i) { return i.category; });

        if (!hasCategories) {
            var grid = document.createElement('div');
            grid.className = 'gallery-grid';
            galleryItems.forEach(function (item) { grid.appendChild(createGalleryItem(item)); });
            container.appendChild(grid);
        } else {
            var grouped = {};
            categories.forEach(function (cat) { grouped[cat.id] = []; });
            galleryItems.forEach(function (item) {
                var cid = item.category || '';
                if (grouped[cid]) grouped[cid].push(item);
            });

            var timeline = document.getElementById('cycle-timeline');
            if (timeline) {
                var allNode = document.createElement('div');
                allNode.className = 'cycle-node cycle-node-all active';
                allNode.setAttribute('data-filter', 'all');
                allNode.setAttribute('role', 'tab');
                allNode.setAttribute('aria-selected', 'true');
                allNode.setAttribute('tabindex', '0');
                allNode.innerHTML = '<div class="cycle-icon">All</div><div class="cycle-label">All</div>';
                allNode.addEventListener('click', function () { filterGallery('all'); });
                timeline.appendChild(allNode);

                var conn0 = document.createElement('div');
                conn0.className = 'cycle-connector';
                timeline.appendChild(conn0);

                var cycleCategories = categories.filter(function (c) { return grouped[c.id] && grouped[c.id].length; });
                cycleCategories.forEach(function (cat, idx) {
                    var parts = cat.label.split(' ');
                    var emoji = parts[0];
                    var name = parts.slice(1).join(' ');

                    var node = document.createElement('div');
                    node.className = 'cycle-node';
                    node.setAttribute('data-filter', cat.id);
                    node.setAttribute('role', 'tab');
                    node.setAttribute('aria-selected', 'false');
                    node.setAttribute('tabindex', '0');
                    node.innerHTML = '<div class="cycle-icon">' + emoji + '</div><div class="cycle-label">' + escapeHtml(name) + '</div>';
                    node.addEventListener('click', function () { filterGallery(cat.id); });
                    timeline.appendChild(node);

                    if (idx < cycleCategories.length - 1) {
                        var conn = document.createElement('div');
                        conn.className = 'cycle-connector';
                        timeline.appendChild(conn);
                    }
                });

                var returnArrow = document.createElement('div');
                returnArrow.className = 'cycle-return';
                returnArrow.innerHTML = '⟳';
                returnArrow.setAttribute('aria-hidden', 'true');
                returnArrow.setAttribute('title', 'The cycle continues');
                timeline.appendChild(returnArrow);
            }

            categories.forEach(function (cat) {
                var items = grouped[cat.id];
                if (!items || !items.length) return;

                var group = document.createElement('div');
                group.className = 'gallery-category-group';
                group.setAttribute('data-category', cat.id);
                group.id = 'cat-' + cat.id;  // enables deep-linking like gallery.html#cat-living-land

                var title = document.createElement('h3');
                title.className = 'gallery-category-title fade-in';
                title.textContent = cat.label;
                group.appendChild(title);

                var grid = document.createElement('div');
                grid.className = 'gallery-grid';
                items.forEach(function (item) { grid.appendChild(createGalleryItem(item)); });
                group.appendChild(grid);

                container.appendChild(group);
            });
        }

        document.querySelectorAll('.fade-in:not(.observed)').forEach(function (el) {
            observer.observe(el);
            el.classList.add('observed');
        });
    }

    function filterGallery(categoryId) {
        document.querySelectorAll('.cycle-node').forEach(function (node) {
            var isActive = node.getAttribute('data-filter') === categoryId;
            node.classList.toggle('active', isActive);
            node.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        document.querySelectorAll('.gallery-category-group').forEach(function (group) {
            if (categoryId === 'all') {
                group.classList.remove('hidden');
            } else {
                group.classList.toggle('hidden', group.getAttribute('data-category') !== categoryId);
            }
        });

        document.querySelectorAll('.gallery-category-group:not(.hidden) .fade-in').forEach(function (el) {
            observer.observe(el);
        });
    }

    // Lightbox provided by js/common.js

    // ── Init ────────────────────────────────────────────
    loadGallery();
})();
