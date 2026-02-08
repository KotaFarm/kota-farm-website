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

        // Build filter tabs
        var allBtn = document.createElement('button');
        allBtn.className = 'gallery-filter-btn';
        allBtn.type = 'button';
        allBtn.setAttribute('role', 'tab');
        allBtn.setAttribute('aria-selected', 'true');
        allBtn.setAttribute('data-filter', 'all');
        allBtn.textContent = 'All';
        allBtn.addEventListener('click', function() { filterGallery('all'); });
        filtersBar.appendChild(allBtn);

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
    // Update tabs
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

// Back to top: show after scroll, scroll to top on click
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
    backToTop.addEventListener('click', function() {
        document.getElementById('main-content').focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Highlight current section in nav (scroll spy)
const sectionIds = ['top', 'about', 'practices', 'plants', 'gallery', 'getting-started', 'community', 'news', 'contact', 'location'];

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

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
    el.classList.add('observed');
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

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
    // Gallery images — only from visible category groups (or all if no filter)
    document.querySelectorAll('#gallery-grid-container .gallery-category-group:not(.hidden) .gallery-item img, #gallery-grid-container > .gallery-grid .gallery-item img').forEach(img => {
        lightboxImages.push(img.src);
    });
    // News images
    document.querySelectorAll('.news-card img').forEach(img => {
        lightboxImages.push(img.src);
    });
}

function openLightbox(src) {
    buildLightboxList();
    const overlay = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightbox-close');
    lightboxPreviousFocus = document.activeElement;

    // Find index of clicked image
    lightboxIndex = lightboxImages.indexOf(src);
    if (lightboxIndex === -1) lightboxIndex = 0;

    showLightboxImage();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    overlay.addEventListener('keydown', lightboxKeydown);
}

function showLightboxImage() {
    const overlay = document.getElementById('lightbox');
    const img = overlay.querySelector('img');
    const counter = document.getElementById('lightbox-counter');
    img.src = lightboxImages[lightboxIndex];
    counter.textContent = (lightboxIndex + 1) + ' / ' + lightboxImages.length;

    // Hide arrows if only one image
    document.getElementById('lightbox-prev').style.display = lightboxImages.length <= 1 ? 'none' : 'flex';
    document.getElementById('lightbox-next').style.display = lightboxImages.length <= 1 ? 'none' : 'flex';
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
    const overlay = document.getElementById('lightbox');
    overlay.classList.remove('active');
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
