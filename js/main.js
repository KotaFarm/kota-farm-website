// ============================================================
//  GALLERY LOADER (grouped by category with filter tabs)
//  Reads galleryItems + galleryCategories from gallery-config.js
//  and builds the gallery automatically, organised by theme.
//  To add new photos/videos: put them in the "gallery" folder
//  and add one line to gallery-config.js. That's it!
// ============================================================
function createGalleryItem(item) {
    const div = document.createElement('div');
    div.className = 'gallery-item fade-in';

    const isVideo = item.file.match(/\.(mp4|webm|mov)$/i);

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
        img.addEventListener('load', function() { img.classList.remove('loading'); img.classList.add('loaded'); });
        img.src = src;
        img.addEventListener('click', function() { openLightbox(img.src); });
        img.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(img.src);
            }
        });
        div.appendChild(img);
        var capDiv = document.createElement('div');
        capDiv.className = 'gallery-caption';
        capDiv.innerHTML = '<p>' + escapeHtml(caption) + '</p>';
        div.appendChild(capDiv);
    }

    return div;
}

function loadGallery() {
    var container = document.getElementById('gallery-grid-container');
    var filtersBar = document.getElementById('gallery-filters');
    var loadingEl = document.getElementById('gallery-loading');

    if (typeof galleryItems === 'undefined' || !galleryItems.length) {
        if (loadingEl) loadingEl.remove();
        container.innerHTML = '<p style="color: var(--earth-medium); text-align: center;">Gallery could not be loaded. Make sure gallery-config.js exists.</p>';
        return;
    }
    if (loadingEl) loadingEl.remove();

    // Build category lookup
    var categories = (typeof galleryCategories !== 'undefined') ? galleryCategories : [];
    var hasCategories = categories.length > 0 && galleryItems.some(function(i) { return i.category; });

    if (!hasCategories) {
        // Fallback: flat grid (backwards compatible)
        var grid = document.createElement('div');
        grid.className = 'gallery-grid';
        grid.id = 'gallery-grid';
        galleryItems.forEach(function(item) { grid.appendChild(createGalleryItem(item)); });
        container.appendChild(grid);
    } else {
        // Group items by category
        var grouped = {};
        categories.forEach(function(cat) { grouped[cat.id] = []; });
        galleryItems.forEach(function(item) {
            var cid = item.category || '';
            if (grouped[cid]) grouped[cid].push(item);
        });

        // Build cycle timeline
        var timeline = document.getElementById('cycle-timeline');
        if (timeline) {
            // "All" node
            var allNode = document.createElement('div');
            allNode.className = 'cycle-node cycle-node-all active';
            allNode.setAttribute('data-filter', 'all');
            allNode.setAttribute('role', 'tab');
            allNode.setAttribute('aria-selected', 'true');
            allNode.setAttribute('tabindex', '0');
            allNode.innerHTML = '<div class="cycle-icon">All</div><div class="cycle-label">All</div>';
            allNode.addEventListener('click', function() { filterGallery('all'); });
            allNode.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filterGallery('all'); } });
            timeline.appendChild(allNode);

            // Connector after All
            var conn0 = document.createElement('div');
            conn0.className = 'cycle-connector';
            timeline.appendChild(conn0);

            var cycleCategories = categories.filter(function(c) { return grouped[c.id] && grouped[c.id].length; });
            cycleCategories.forEach(function(cat, idx) {
                // Extract emoji from label
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
                node.addEventListener('click', function() { filterGallery(cat.id); });
                node.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filterGallery(cat.id); } });
                timeline.appendChild(node);

                // Connector arrow (not after last)
                if (idx < cycleCategories.length - 1) {
                    var conn = document.createElement('div');
                    conn.className = 'cycle-connector';
                    timeline.appendChild(conn);
                }
            });

            // Return arrow — the loop closes
            var returnArrow = document.createElement('div');
            returnArrow.className = 'cycle-return';
            returnArrow.innerHTML = '⟳';
            returnArrow.setAttribute('aria-hidden', 'true');
            returnArrow.setAttribute('title', 'The cycle continues — tend returns to prepare');
            timeline.appendChild(returnArrow);
        }

        // Also build hidden filter tabs for backwards compat
        categories.forEach(function(cat) {
            if (!grouped[cat.id] || !grouped[cat.id].length) return;
            var btn = document.createElement('button');
            btn.className = 'gallery-filter-btn';
            btn.type = 'button';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('data-filter', cat.id);
            btn.textContent = cat.label;
            btn.addEventListener('click', function() { filterGallery(cat.id); });
            filtersBar.appendChild(btn);
        });

        // Build category groups
        categories.forEach(function(cat) {
            var items = grouped[cat.id];
            if (!items || !items.length) return;

            var group = document.createElement('div');
            group.className = 'gallery-category-group';
            group.setAttribute('data-category', cat.id);

            var title = document.createElement('h3');
            title.className = 'gallery-category-title fade-in';
            title.textContent = cat.label;
            group.appendChild(title);

            var grid = document.createElement('div');
            grid.className = 'gallery-grid';
            items.forEach(function(item) { grid.appendChild(createGalleryItem(item)); });
            group.appendChild(grid);

            container.appendChild(group);
        });
    }

    // Re-observe new elements for fade-in animation
    document.querySelectorAll('.fade-in:not(.observed)').forEach(function(el) {
        observer.observe(el);
        el.classList.add('observed');
    });
}

function filterGallery(categoryId) {
    // Update cycle timeline nodes
    document.querySelectorAll('.cycle-node').forEach(function(node) {
        var isActive = node.getAttribute('data-filter') === categoryId;
        node.classList.toggle('active', isActive);
        node.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update hidden filter tabs
    document.querySelectorAll('.gallery-filter-btn').forEach(function(btn) {
        btn.setAttribute('aria-selected', btn.getAttribute('data-filter') === categoryId ? 'true' : 'false');
    });

    // Show / hide groups
    document.querySelectorAll('.gallery-category-group').forEach(function(group) {
        if (categoryId === 'all') {
            group.classList.remove('hidden');
        } else {
            group.classList.toggle('hidden', group.getAttribute('data-category') !== categoryId);
        }
    });

    // Re-trigger fade-in for newly visible items
    document.querySelectorAll('.gallery-category-group:not(.hidden) .fade-in').forEach(function(el) {
        observer.observe(el);
    });
}

// Plants card grid — grouped by location with category icons and count badges
function loadPlants() {
    var container = document.getElementById('plants-container');
    if (!container) return;
    if (typeof plantsList === 'undefined' || !plantsList.length) {
        container.innerHTML = '<p style="color: var(--earth-medium); text-align: center;">Plant list could not be loaded.</p>';
        return;
    }

    var categoryIcons = {
        'Fruit': '🍎',
        'Non-Fruit': '🌳',
        'Timber': '🪵',
        'Medicinal': '🌿'
    };

    var locationIcons = {
        'Native Forest Section': '🏞️',
        'Companion Trees': '🤝',
        'Boundary': '🧱',
        'Food Forest': '🌳'
    };

    var order = ['Food Forest', 'Native Forest Section', 'Companion Trees', 'Boundary'];
    var byLocation = {};
    plantsList.forEach(function(plant) {
        var loc = plant.location || '';
        if (!loc) return;
        if (!byLocation[loc]) byLocation[loc] = [];
        byLocation[loc].push(plant);
    });

    order.forEach(function(loc) {
        if (!byLocation[loc] || !byLocation[loc].length) return;
        var plants = byLocation[loc];
        var totalCount = 0;
        plants.forEach(function(p) { totalCount += (p.standing || 1); });

        var group = document.createElement('div');
        group.className = 'plants-forest-group fade-in';

        // Collapsible header — starts collapsed
        var header = document.createElement('button');
        header.className = 'plants-forest-title plants-toggle';
        header.setAttribute('type', 'button');
        header.setAttribute('aria-expanded', 'false');
        header.innerHTML =
            '<span class="plants-toggle-left">' +
                '<span class="plants-location-icon">' + (locationIcons[loc] || '') + '</span> ' +
                escapeHtml(loc) +
            '</span>' +
            '<span class="plants-toggle-right">' +
                '<span class="plants-toggle-meta">' + plants.length + ' species · ' + totalCount + ' trees</span>' +
                '<span class="plants-toggle-arrow" aria-hidden="true">▸</span>' +
            '</span>';

        var grid = document.createElement('div');
        grid.className = 'plants-grid plants-grid-collapsed';
        grid.id = 'plants-group-' + loc.replace(/\s+/g, '-').toLowerCase();
        header.setAttribute('aria-controls', grid.id);

        header.addEventListener('click', function() {
            var isOpen = grid.classList.toggle('plants-grid-collapsed');
            header.setAttribute('aria-expanded', !isOpen);
            header.classList.toggle('open', !isOpen);
            // Trigger card animations when opening
            if (!isOpen) {
                grid.querySelectorAll('.plant-card').forEach(function(card, i) {
                    card.style.animationDelay = (i * 40) + 'ms';
                    card.classList.remove('plant-card-animated');
                    // Force reflow to restart animation
                    void card.offsetWidth;
                    card.classList.add('plant-card-animated');
                });
            }
        });

        group.appendChild(header);

        plants.forEach(function(plant, i) {
            var icon = categoryIcons[plant.category] || '🌱';
            var count = plant.standing || 1;

            var card = document.createElement('div');
            card.className = 'plant-card';
            card.setAttribute('data-category', plant.category);

            card.innerHTML =
                '<div class="plant-card-header">' +
                    '<span class="plant-card-icon">' + icon + '</span>' +
                    '<span class="plant-card-name">' + escapeHtml(plant.name) + '</span>' +
                    (count > 1 ? '<span class="plant-card-count">' + count + '</span>' : '') +
                '</div>' +
                '<p class="plant-card-desc">' + escapeHtml(plant.importance) + '</p>';

            grid.appendChild(card);
        });

        group.appendChild(grid);
        container.appendChild(group);
    });

    // Re-observe dynamically created fade-in elements
    document.querySelectorAll('.fade-in:not(.observed)').forEach(function(el) {
        observer.observe(el);
        el.classList.add('observed');
    });
}
function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Fresh Produce — vegetable cards for customers
function loadProduce() {
    var grid = document.getElementById('produce-grid');
    if (!grid) return;
    if (typeof vegetablesList === 'undefined' || !vegetablesList.length) return;

    // Show first 4 available items as a preview
    var preview = vegetablesList.filter(function(v) { return v.available; }).slice(0, 4);
    if (!preview.length) preview = vegetablesList.slice(0, 4);

    preview.forEach(function(veg, i) {
        var firstImg = veg.images ? veg.images[0] : veg.image;
        if (typeof firstImg === 'object') firstImg = firstImg.src || '';
        var card = document.createElement('a');
        card.href = 'produce.html';
        card.className = 'produce-card fade-in';
        card.style.textDecoration = 'none';
        card.style.color = 'inherit';
        card.style.transitionDelay = (i * 80) + 'ms';
        card.innerHTML =
            '<div class="produce-img-wrap">' +
                '<img src="' + escapeHtml(firstImg) + '" alt="' + escapeHtml(veg.name) + '" loading="lazy" class="produce-slide active">' +
                (veg.available ? '<span class="produce-badge produce-available">Available</span>' : '<span class="produce-badge produce-upcoming">Unavailable</span>') +
            '</div>' +
            '<div class="produce-info">' +
                '<h3 class="produce-name">' + escapeHtml(veg.name) +
                    ' <span class="produce-name-hi">' + escapeHtml(veg.nameHi) + '</span></h3>' +
                '<span class="produce-season">' + escapeHtml(veg.season) + '</span>' +
            '</div>';
        grid.appendChild(card);
    });

    document.querySelectorAll('.fade-in:not(.observed)').forEach(function(el) {
        observer.observe(el);
        el.classList.add('observed');
    });
}

// Scroll progress bar
const scrollProgressEl = document.getElementById('scroll-progress');
function updateScrollProgress() {
    if (!scrollProgressEl) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight <= 0 ? 0 : (window.scrollY / docHeight) * 100;
    scrollProgressEl.style.width = pct + '%';
}
// Navbar scroll effect
const navbar = document.getElementById('navbar');

// Respect prefers-reduced-motion for scroll behavior
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Back to top: show after scroll, scroll to top on click
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
    backToTop.addEventListener('click', function() {
        document.getElementById('main-content').focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
}

// Cache DOM elements queried in scroll handler (once, not per frame)
const orderBarEl = document.getElementById('mobile-order-bar');
const fpSectionEl = document.getElementById('fresh-produce');
const heroBgEl = document.querySelector('.hero-bg');

// Highlight current section in nav (scroll spy)
const sectionIds = ['top', 'about', 'practices', 'seasons', 'gallery', 'fresh-produce', 'plants', 'getting-started', 'community', 'news', 'contact', 'location'];
// Cache section elements and nav links (queried once, not per frame)
var cachedSections = null;
var cachedNavLinks = null;

function updateActiveNav() {
    if (!cachedSections) {
        cachedSections = sectionIds.map(function(id) { return { id: id, el: document.getElementById(id) }; }).filter(function(s) { return s.el; });
    }
    if (!cachedNavLinks) {
        cachedNavLinks = Array.from(document.querySelectorAll('.nav-links a'));
    }
    const scrollY = window.scrollY;
    let current = 'top';
    cachedSections.forEach(function(s) {
        if (scrollY >= s.el.offsetTop - 120) current = s.id;
    });
    cachedNavLinks.forEach(function(link) {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === '#' + current || (current === 'top' && href === '#top'));
    });
}

// Unified scroll handler with rAF throttle
let scrollTicking = false;
function onScroll() {
    if (!scrollTicking) {
        requestAnimationFrame(function() {
            updateScrollProgress();
            // Navbar shrink
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            // Back to top visibility
            if (backToTop) {
                backToTop.classList.toggle('visible', window.scrollY > 400);
            }
            // Mobile order bar: hide when inside the fresh-produce section
            if (orderBarEl) {
                var hide = false;
                if (fpSectionEl) {
                    var fpTop = fpSectionEl.offsetTop - 100;
                    var fpBot = fpTop + fpSectionEl.offsetHeight + 100;
                    hide = window.scrollY >= fpTop && window.scrollY <= fpBot;
                }
                orderBarEl.classList.toggle('hidden', hide);
            }
            // Scroll spy
            updateActiveNav();
            // Parallax hero
            if (heroBgEl && window.scrollY < window.innerHeight) {
                heroBgEl.style.transform = 'translateY(' + (window.scrollY * 0.3) + 'px)';
            }
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('load', function() {
    updateScrollProgress();
    updateActiveNav();
});

// Mobile menu toggle
const navToggle = document.getElementById('nav-toggle');
if (navToggle) {
    navToggle.addEventListener('click', function() {
        const open = navbar.classList.toggle('nav-open');
        this.setAttribute('aria-expanded', open);
        this.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    // Close menu when a nav link is clicked (mobile)
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            navbar.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Open menu');
        });
    });
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

let countersAnimated = false;
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Trigger counters when the farm-stats section fades in
            if (!countersAnimated && entry.target.classList.contains('farm-stats')) {
                countersAnimated = true;
                animateCounters();
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
    el.classList.add('observed');
});

// Smooth scrolling for navigation links — updates URL hash for sharing
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                block: 'start'
            });
            // Update URL hash so the link is shareable
            history.pushState(null, '', href);
        }
    });
});

// Also update hash as user scrolls (debounced, ignores sub-pixel shifts from CSS transforms)
let hashUpdateTimeout = null;
let lastHashScrollY = window.scrollY;
function updateHashOnScroll() {
    if (hashUpdateTimeout) clearTimeout(hashUpdateTimeout);
    hashUpdateTimeout = setTimeout(function() {
        const scrollY = window.scrollY;
        if (Math.abs(scrollY - lastHashScrollY) < 5) return;
        lastHashScrollY = scrollY;
        let current = 'top';
        sectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && scrollY >= el.offsetTop - 120) current = id;
        });
        const newHash = '#' + current;
        if (window.location.hash !== newHash) {
            history.replaceState(null, '', newHash);
        }
    }, 300);
}
// Don't attach scroll-hash listener until after dynamic content is built,
// otherwise offsetTop values are wrong and the hash gets set incorrectly on load.

// On page load, scroll to hash if present
var initialHash = window.location.hash;
if (initialHash) {
    var hashTarget = document.querySelector(initialHash);
    if (hashTarget) {
        setTimeout(function() {
            hashTarget.scrollIntoView({ block: 'start' });
        }, 100);
    }
}

// Load the gallery and plants when the page opens
loadGallery();
loadPlants();
loadProduce();

// Now that dynamic content is built, enable scroll-hash updates
setTimeout(function() {
    window.addEventListener('scroll', updateHashOnScroll, { passive: true });
}, 500);

// ============================================================
//  LIGHTBOX WITH NAVIGATION
//  Supports: prev/next arrows, keyboard (left/right/esc),
//  touch swipe, and image counter
// ============================================================
let lightboxPreviousFocus = null;
let lightboxImages = [];
let lightboxIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

// Collect all lightbox-able images after gallery loads
function buildLightboxList() {
    lightboxImages = [];
    document.querySelectorAll('#gallery-grid-container .gallery-category-group:not(.hidden) .gallery-item, #gallery-grid-container > .gallery-grid .gallery-item').forEach(function(item) {
        var img = item.querySelector('img');
        if (!img) return;
        var captionEl = item.querySelector('.gallery-caption p');
        lightboxImages.push({ src: img.src, caption: captionEl ? captionEl.textContent : '' });
    });
    document.querySelectorAll('.news-card img').forEach(function(img) {
        lightboxImages.push({ src: img.src, caption: img.alt || '' });
    });
    // Produce section images
    document.querySelectorAll('.produce-card:not(.produce-hidden) .produce-img-wrap img').forEach(function(img) {
        lightboxImages.push({ src: img.src, caption: img.alt || '' });
    });
}

function openLightbox(src) {
    buildLightboxList();
    var overlay = document.getElementById('lightbox');
    var closeBtn = document.getElementById('lightbox-close');
    lightboxPreviousFocus = document.activeElement;

    lightboxIndex = lightboxImages.findIndex(function(item) { return item.src === src; });
    if (lightboxIndex === -1) lightboxIndex = 0;

    // Create caption element if not exists
    if (!document.getElementById('lightbox-caption')) {
        var cap = document.createElement('div');
        cap.className = 'lightbox-caption';
        cap.id = 'lightbox-caption';
        overlay.appendChild(cap);
    }

    // Create thumbnail strip if not exists
    var existingThumbs = document.getElementById('lightbox-thumbs');
    if (existingThumbs) existingThumbs.remove();
    if (lightboxImages.length > 1) {
        var strip = document.createElement('div');
        strip.className = 'lightbox-thumbs';
        strip.id = 'lightbox-thumbs';
        strip.onclick = function(e) { e.stopPropagation(); };
        lightboxImages.forEach(function(item, i) {
            var thumb = document.createElement('img');
            thumb.className = 'lightbox-thumb' + (i === lightboxIndex ? ' active' : '');
            thumb.src = item.src;
            thumb.alt = 'Thumbnail ' + (i + 1);
            thumb.setAttribute('data-index', i);
            thumb.addEventListener('click', function(e) {
                e.stopPropagation();
                lightboxIndex = i;
                showLightboxImage();
            });
            strip.appendChild(thumb);
        });
        overlay.appendChild(strip);
    }

    showLightboxImage();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    overlay.addEventListener('keydown', lightboxKeydown);
}

function showLightboxImage() {
    var overlay = document.getElementById('lightbox');
    var img = overlay.querySelector(':scope > img');
    var counter = document.getElementById('lightbox-counter');
    var caption = document.getElementById('lightbox-caption');
    var current = lightboxImages[lightboxIndex];
    
    img.src = current.src;
    counter.textContent = (lightboxIndex + 1) + ' / ' + lightboxImages.length;
    if (caption) caption.textContent = current.caption || '';

    document.getElementById('lightbox-prev').style.display = lightboxImages.length <= 1 ? 'none' : 'flex';
    document.getElementById('lightbox-next').style.display = lightboxImages.length <= 1 ? 'none' : 'flex';

    // Update active thumbnail
    var thumbs = document.querySelectorAll('.lightbox-thumb');
    thumbs.forEach(function(t, i) {
        t.classList.toggle('active', i === lightboxIndex);
    });
    // Scroll active thumb into view
    var activeThumb = document.querySelector('.lightbox-thumb.active');
    if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function lightboxNav(direction) {
    lightboxIndex += direction;
    if (lightboxIndex < 0) lightboxIndex = lightboxImages.length - 1;
    if (lightboxIndex >= lightboxImages.length) lightboxIndex = 0;
    showLightboxImage();
}

function lightboxKeydown(e) {
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); lightboxNav(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); lightboxNav(1); return; }
    if (e.key !== 'Tab') return;
    // Focus trap
    const focusable = [
        document.getElementById('lightbox-close'),
        document.getElementById('lightbox-prev'),
        document.getElementById('lightbox-next')
    ].filter(el => el && el.style.display !== 'none');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
}

function closeLightbox() {
    var overlay = document.getElementById('lightbox');
    overlay.classList.remove('active');
    var thumbsEl = document.getElementById('lightbox-thumbs');
    if (thumbsEl) thumbsEl.remove();
    var capEl = document.getElementById('lightbox-caption');
    if (capEl) capEl.remove();
    document.body.style.overflow = '';
    overlay.removeEventListener('keydown', lightboxKeydown);
    if (lightboxPreviousFocus && lightboxPreviousFocus.focus) {
        lightboxPreviousFocus.focus();
    }
    lightboxPreviousFocus = null;
}

// Touch swipe support
(function() {
    const lb = document.getElementById('lightbox');
    lb.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lb.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            lightboxNav(diff > 0 ? 1 : -1);
        }
    }, { passive: true });
})();

// Global escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('lightbox');
        if (overlay && overlay.classList.contains('active')) closeLightbox();
    }
});


// Animated counters
function animateCounters() {
    document.querySelectorAll('.stat-number').forEach(function(el) {
        var target = parseInt(el.getAttribute('data-target'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 1500;
        var start = performance.now();
        
        function update(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(eased * target);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// Counter animation is now triggered by the main fade-in observer
// when .farm-stats enters the viewport (see observer above)

// Accessibility controls
document.addEventListener('DOMContentLoaded', function() {
    var contrastBtn = document.getElementById('a11y-contrast');
    var fontBtn = document.getElementById('a11y-font');

    if (contrastBtn) {
        contrastBtn.addEventListener('click', function() {
            document.body.classList.toggle('high-contrast');
            this.classList.toggle('active');
            this.setAttribute('aria-pressed', document.body.classList.contains('high-contrast'));
        });
    }

    if (fontBtn) {
        fontBtn.addEventListener('click', function() {
            document.body.classList.toggle('font-large');
            this.classList.toggle('active');
            this.setAttribute('aria-pressed', document.body.classList.contains('font-large'));
        });
    }
});

// ============================================================
//  MINI CART — Add-to-cart with WhatsApp order
// ============================================================
var CART_KEY = 'kotaFarmCart';
var WHATSAPP_NUMBER = '919460813090';

function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
}

function addToCart(veg) {
    var cart = getCart();
    var existing = cart.find(function(c) { return c.name === veg.name; });
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name: veg.name, nameHi: veg.nameHi, qty: 1, unit: veg.unit || 'kg' });
    }
    saveCart(cart);
}

function removeFromCart(name) {
    var cart = getCart().filter(function(c) { return c.name !== name; });
    saveCart(cart);
    renderCartDrawer();
}

function updateCartQty(name, delta) {
    var cart = getCart();
    var item = cart.find(function(c) { return c.name === name; });
    if (item) {
        item.qty = Math.max(1, item.qty + delta);
    }
    saveCart(cart);
    renderCartDrawer();
}

function getCartCount() {
    return getCart().reduce(function(sum, c) { return sum + c.qty; }, 0);
}

function isInCart(name) {
    return getCart().some(function(c) { return c.name === name; });
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartUI();
    renderCartDrawer();
}

function buildWhatsAppMessage() {
    var cart = getCart();
    if (!cart.length) return '';
    var lines = ['🛒 *Order from Kota Natural Farm website:*', ''];
    cart.forEach(function(item) {
        lines.push('• ' + item.name + ' (' + item.nameHi + ') — ' + item.qty + ' ' + item.unit);
    });
    lines.push('');
    lines.push('Please confirm availability. Thank you!');
    return lines.join('\n');
}

function updateCartUI() {
    var count = getCartCount();
    var fab = document.getElementById('cart-fab');
    var badge = document.getElementById('cart-fab-badge');
    if (fab) fab.style.display = count > 0 ? '' : 'none';
    if (badge) badge.textContent = count;

    // Update all "Add to Cart" buttons on produce cards
    document.querySelectorAll('.add-to-cart-btn').forEach(function(btn) {
        var name = btn.getAttribute('data-name');
        if (isInCart(name)) {
            btn.textContent = 'In Cart ✓';
            btn.classList.add('in-cart');
        } else {
            btn.textContent = 'Add to Cart';
            btn.classList.remove('in-cart');
        }
    });

    // Update WhatsApp link
    var waBtn = document.getElementById('cart-whatsapp-btn');
    if (waBtn) {
        if (count > 0) {
            var msg = encodeURIComponent(buildWhatsAppMessage());
            waBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg;
            waBtn.classList.remove('disabled');
        } else {
            waBtn.href = '#';
            waBtn.classList.add('disabled');
        }
    }
}

function renderCartDrawer() {
    var body = document.getElementById('cart-drawer-body');
    var footer = document.getElementById('cart-drawer-footer');
    var cart = getCart();

    if (!body) return;

    if (!cart.length) {
        body.innerHTML = '<p class="cart-empty">Your cart is empty.<br>Tap "Add to Cart" on the vegetables you\'d like to order.</p>';
        if (footer) footer.style.display = 'none';
        return;
    }
    if (footer) footer.style.display = '';

    var html = '';
    cart.forEach(function(item) {
        html +=
            '<div class="cart-item">' +
                '<div class="cart-item-info">' +
                    '<span class="cart-item-name">' + escapeHtml(item.name) +
                        ' <span class="cart-item-name-hi">' + escapeHtml(item.nameHi) + '</span>' +
                    '</span>' +
                '</div>' +
                '<div class="cart-item-qty">' +
                    '<button type="button" class="cart-qty-btn" onclick="updateCartQty(\'' + escapeHtml(item.name) + '\', -1)" aria-label="Decrease">−</button>' +
                    '<span class="cart-qty-value">' + item.qty + ' <span class="cart-item-unit">' + escapeHtml(item.unit) + '</span></span>' +
                    '<button type="button" class="cart-qty-btn" onclick="updateCartQty(\'' + escapeHtml(item.name) + '\', 1)" aria-label="Increase">+</button>' +
                '</div>' +
                '<button type="button" class="cart-item-remove" onclick="removeFromCart(\'' + escapeHtml(item.name) + '\')" aria-label="Remove">&times;</button>' +
            '</div>';
    });
    body.innerHTML = html;
}

function openCartDrawer() {
    renderCartDrawer();
    updateCartUI();
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

// Initialize cart UI on page load
updateCartUI();
