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
            '<video controls loop muted loading="lazy">' +
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

// Plants bubble cloud — grouped by location (only categories from your data); custom tooltip
function loadPlants() {
    var container = document.getElementById('plants-container');
    if (!container) return;
    if (typeof plantsList === 'undefined' || !plantsList.length) {
        container.innerHTML = '<p style="color: var(--earth-medium); text-align: center;">Plant list could not be loaded.</p>';
        return;
    }
    var maxStanding = 1;
    plantsList.forEach(function(p) { if (p.standing > maxStanding) maxStanding = p.standing; });
    var minPx = 48;
    var maxPx = 160;
    var tooltipEl = document.getElementById('plant-tooltip');
    var isTouch = false;
    var tooltipShowTimeout = null;
    var TOOLTIP_DELAY_MS = 180;
    function showTooltip(plant, bubbleOrEvent, e) {
        if (!tooltipEl) return;
        tooltipEl.innerHTML = '<strong>' + escapeHtml(plant.name) + '</strong> ' + escapeHtml(plant.importance);
        tooltipEl.setAttribute('aria-hidden', 'false');
        tooltipEl.classList.add('visible');
        var mobile = window.innerWidth <= 768;
        var bubbleEl = bubbleOrEvent && bubbleOrEvent.getBoundingClientRect ? bubbleOrEvent : null;
        if (mobile || isTouch || !bubbleEl) {
            tooltipEl.classList.add('place-top');
            tooltipEl.style.left = '1rem';
            tooltipEl.style.right = '1rem';
            tooltipEl.style.bottom = '1.25rem';
            tooltipEl.style.top = 'auto';
        } else {
            tooltipEl.classList.remove('place-top');
            var r = bubbleEl.getBoundingClientRect();
            var gap = 6;
            var tipW = 280;
            var left = r.left + (r.width / 2) - (tipW / 2);
            left = Math.max(10, Math.min(left, window.innerWidth - tipW - 10));
            tooltipEl.style.left = left + 'px';
            tooltipEl.style.top = (r.bottom + gap) + 'px';
            tooltipEl.style.bottom = 'auto';
            tooltipEl.style.right = 'auto';
        }
    }
    function hideTooltip() {
        if (tooltipShowTimeout) {
            clearTimeout(tooltipShowTimeout);
            tooltipShowTimeout = null;
        }
        if (!tooltipEl) return;
        tooltipEl.classList.remove('visible', 'place-top');
        tooltipEl.setAttribute('aria-hidden', 'true');
        tooltipEl.style.left = '';
        tooltipEl.style.right = '';
        tooltipEl.style.top = '';
        tooltipEl.style.bottom = '';
    }
    function addBubble(plant, bubbleContainer, staggerIndex) {
        var q = plant.standing != null && plant.standing > 0 ? plant.standing : 1;
        var size = Math.max(44, minPx + (Math.sqrt(q) / Math.sqrt(maxStanding)) * (maxPx - minPx));
        size = Math.round(size);
        var bubble = document.createElement('div');
        bubble.className = 'plant-bubble plant-bubble-pop';
        if (typeof staggerIndex === 'number') {
            bubble.style.animationDelay = (staggerIndex * 45) + 'ms';
        }
        bubble.setAttribute('data-category', plant.category);
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.fontSize = (size < 64 ? 0.5 : size < 96 ? 0.65 : 0.85) + 'rem';
        bubble.setAttribute('tabindex', '0');
        bubble.setAttribute('role', 'button');
        bubble.setAttribute('aria-label', plant.name + '. ' + plant.importance);
        bubble.innerHTML = '<span class="plant-name">' + escapeHtml(plant.name) + '</span>';
        bubble.addEventListener('mouseenter', function() {
            isTouch = false;
            if (tooltipShowTimeout) clearTimeout(tooltipShowTimeout);
            tooltipShowTimeout = setTimeout(function() { showTooltip(plant, bubble); tooltipShowTimeout = null; }, TOOLTIP_DELAY_MS);
        });
        bubble.addEventListener('mouseleave', hideTooltip);
        bubble.addEventListener('focus', function() { isTouch = false; showTooltip(plant, bubble); });
        bubble.addEventListener('blur', hideTooltip);
        bubble.addEventListener('touchstart', function(ev) {
            isTouch = true;
            ev.preventDefault();
            showTooltip(plant, null);
            setTimeout(function() {
                document.addEventListener('touchstart', function closeOnce() {
                    hideTooltip();
                    document.removeEventListener('touchstart', closeOnce);
                }, { once: true });
            }, 150);
        }, { passive: false });
        bubbleContainer.appendChild(bubble);
    }
    var order = ['Native Forest Section', 'Companion Trees', 'Boundary', 'Food Forest'];
    var byLocation = {};
    plantsList.forEach(function(plant) {
        var loc = plant.location || '';
        if (!loc) return;
        if (!byLocation[loc]) byLocation[loc] = [];
        byLocation[loc].push(plant);
    });
    order.forEach(function(loc) {
        if (!byLocation[loc] || !byLocation[loc].length) return;
        var group = document.createElement('div');
        group.className = 'plants-forest-group';
        group.innerHTML = '<h3 class="plants-forest-title">' + escapeHtml(loc) + '</h3><div class="plants-bubbles"></div>';
        var bubblesDiv = group.querySelector('.plants-bubbles');
        byLocation[loc].forEach(function(plant, i) { addBubble(plant, bubblesDiv, i); });
        container.appendChild(group);
    });
}
function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

// Highlight current section in nav (scroll spy)
const sectionIds = ['top', 'about', 'practices', 'seasons', 'plants', 'gallery', 'getting-started', 'community', 'news', 'contact', 'location'];

function updateActiveNav() {
    const scrollY = window.scrollY;
    let current = 'top';
    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollY >= top - 120) current = id;
        }
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
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
            // Scroll spy
            updateActiveNav();
            // Parallax hero
            var heroBg = document.querySelector('.hero-bg');
            if (heroBg && window.scrollY < window.innerHeight) {
                heroBg.style.transform = 'translateY(' + (window.scrollY * 0.3) + 'px)';
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

// Also update hash as user scrolls (debounced)
let hashUpdateTimeout = null;
function updateHashOnScroll() {
    if (hashUpdateTimeout) clearTimeout(hashUpdateTimeout);
    hashUpdateTimeout = setTimeout(function() {
        const scrollY = window.scrollY;
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
window.addEventListener('scroll', updateHashOnScroll, { passive: true });

// On page load, scroll to hash if present
if (window.location.hash) {
    var hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) {
        setTimeout(function() {
            hashTarget.scrollIntoView({ block: 'start' });
        }, 100);
    }
}

// Load the gallery and plants when the page opens
loadGallery();
loadPlants();

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
