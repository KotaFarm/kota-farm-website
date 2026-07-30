// ============================================================
//  COMMON.JS — Shared utilities, lightbox, and cart
//  Loaded before page-specific JS on index, gallery, produce
// ============================================================
(function () {
    'use strict';

    // ── Escape HTML ────────────────────────────────────────
    window.escapeHtml = function (text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };

    // ── Constants ──────────────────────────────────────────
    window.WHATSAPP_NUMBER = '919460813090';

    // ── Scroll lock (preserves position, prevents layout shift) ──
    var scrollLockCount = 0;
    var savedScrollY = 0;

    window.lockScroll = function () {
        if (scrollLockCount === 0) {
            savedScrollY = window.scrollY;
            document.body.style.setProperty('--scroll-y', '-' + savedScrollY + 'px');
            document.body.classList.add('scroll-locked');
        }
        scrollLockCount++;
    };

    window.unlockScroll = function () {
        scrollLockCount = Math.max(0, scrollLockCount - 1);
        if (scrollLockCount === 0) {
            document.body.classList.remove('scroll-locked');
            document.body.style.removeProperty('--scroll-y');
            window.scrollTo(0, savedScrollY);
        }
    };

    // ============================================================
    //  LIGHTBOX WITH NAVIGATION
    //  Supports: prev/next arrows, keyboard (left/right/esc),
    //  touch swipe, thumbnails, caption, and focus trap
    // ============================================================
    var lightboxPreviousFocus = null;
    var lightboxImages = [];
    var lightboxIndex = 0;
    var touchStartX = 0;
    var touchEndX = 0;

    // Collect all lightbox-able images on the current page
    function buildLightboxList() {
        lightboxImages = [];
        // Gallery items (gallery.html full page + index.html preview)
        document.querySelectorAll(
            '#gallery-grid-container .gallery-category-group:not(.hidden) .gallery-item,' +
            '#gallery-grid-container > .gallery-grid .gallery-item,' +
            '#gallery-preview .gallery-item'
        ).forEach(function (item) {
            var img = item.querySelector('img');
            if (!img) return;
            var captionEl = item.querySelector('.gallery-caption p');
            lightboxImages.push({ src: img.src, caption: captionEl ? captionEl.textContent : '' });
        });
        // News cards (index.html)
        document.querySelectorAll('.news-card img').forEach(function (img) {
            lightboxImages.push({ src: img.src, caption: img.alt || '' });
        });
        // Produce preview images (index.html)
        document.querySelectorAll('.produce-card:not(.produce-hidden) .produce-img-wrap img').forEach(function (img) {
            lightboxImages.push({ src: img.src, caption: img.alt || '' });
        });
    }

    window.openLightbox = function (src) {
        buildLightboxList();
        var overlay = document.getElementById('lightbox');
        var closeBtn = document.getElementById('lightbox-close');
        lightboxPreviousFocus = document.activeElement;

        lightboxIndex = lightboxImages.findIndex(function (item) {
            return item.src === src || item.src.indexOf(src) !== -1;
        });
        if (lightboxIndex === -1) {
            // src isn't in any page collection — show as standalone image
            lightboxImages = [{ src: src, caption: '' }];
            lightboxIndex = 0;
        }

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
            strip.onclick = function (e) { e.stopPropagation(); };
            lightboxImages.forEach(function (item, i) {
                var thumb = document.createElement('img');
                thumb.className = 'lightbox-thumb' + (i === lightboxIndex ? ' active' : '');
                thumb.src = item.src;
                thumb.alt = 'Thumbnail ' + (i + 1);
                thumb.setAttribute('data-index', i);
                thumb.addEventListener('click', function (e) {
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
        lockScroll();
        closeBtn.focus();
        overlay.addEventListener('keydown', lightboxKeydown);
    };

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
        thumbs.forEach(function (t, i) {
            t.classList.toggle('active', i === lightboxIndex);
        });
        var activeThumb = document.querySelector('.lightbox-thumb.active');
        if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    window.lightboxNav = function (direction) {
        lightboxIndex += direction;
        if (lightboxIndex < 0) lightboxIndex = lightboxImages.length - 1;
        if (lightboxIndex >= lightboxImages.length) lightboxIndex = 0;
        showLightboxImage();
    };

    function lightboxKeydown(e) {
        if (e.key === 'Escape') { closeLightbox(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); lightboxNav(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); lightboxNav(1); return; }
        if (e.key !== 'Tab') return;
        // Focus trap
        var focusable = [
            document.getElementById('lightbox-close'),
            document.getElementById('lightbox-prev'),
            document.getElementById('lightbox-next')
        ].filter(function (el) { return el && el.style.display !== 'none'; });
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }

    window.closeLightbox = function () {
        var overlay = document.getElementById('lightbox');
        overlay.classList.remove('active');
        var thumbsEl = document.getElementById('lightbox-thumbs');
        if (thumbsEl) thumbsEl.remove();
        var capEl = document.getElementById('lightbox-caption');
        if (capEl) capEl.remove();
        unlockScroll();
        overlay.removeEventListener('keydown', lightboxKeydown);
        if (lightboxPreviousFocus && lightboxPreviousFocus.focus) {
            lightboxPreviousFocus.focus();
        }
        lightboxPreviousFocus = null;
    };

    // Touch swipe support (deferred so #lightbox exists regardless of script position)
    function initLightboxTouch() {
        var lb = document.getElementById('lightbox');
        if (!lb) return;
        lb.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        lb.addEventListener('touchend', function (e) {
            touchEndX = e.changedTouches[0].screenX;
            var diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                lightboxNav(diff > 0 ? 1 : -1);
            }
        }, { passive: true });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLightboxTouch);
    } else {
        initLightboxTouch();
    }

    // Global escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var overlay = document.getElementById('lightbox');
            if (overlay && overlay.classList.contains('active')) closeLightbox();
        }
    });

    // ============================================================
    //  MINI CART — Add-to-cart with WhatsApp order
    // ============================================================
    var CART_KEY = 'kotaFarmCart';

    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch (e) { return []; }
    }
    window.getCart = getCart;

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartUI();
    }

    function isInCart(name) {
        return getCart().some(function (c) { return c.name === name; });
    }
    window.isInCart = isInCart;

    function getCartCount() {
        return getCart().reduce(function (sum, c) { return sum + c.qty; }, 0);
    }

    window.addToCart = function (veg) {
        var cart = getCart();
        var existing = cart.find(function (c) { return c.name === veg.name; });
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ name: veg.name, nameHi: veg.nameHi, qty: 1, unit: veg.unit || 'kg' });
        }
        saveCart(cart);
    };

    window.removeFromCart = function (name) {
        var cart = getCart().filter(function (c) { return c.name !== name; });
        saveCart(cart);
        renderCartDrawer();
    };

    window.updateCartQty = function (name, delta) {
        var cart = getCart();
        var item = cart.find(function (c) { return c.name === name; });
        if (item) {
            item.qty = Math.max(1, item.qty + delta);
        }
        saveCart(cart);
        renderCartDrawer();
    };

    window.clearCart = function () {
        localStorage.removeItem(CART_KEY);
        updateCartUI();
        renderCartDrawer();
    };

    function buildWhatsAppMessage() {
        var cart = getCart();
        if (!cart.length) return '';
        var lines = ['🛒 *Order from Kovana Natural Farm website:*', ''];
        cart.forEach(function (item) {
            lines.push('• ' + item.name + ' (' + item.nameHi + ') — ' + item.qty + ' ' + item.unit);
        });
        lines.push('');
        lines.push('Please confirm availability. Thank you!');
        return lines.join('\n');
    }

    function updateCartUI() {
        var count = getCartCount();

        // Cart FAB (index.html)
        var fab = document.getElementById('cart-fab');
        if (fab) fab.style.display = count > 0 ? '' : 'none';

        // Cart badge (both pages)
        var badge = document.getElementById('cart-fab-badge');
        if (badge) badge.textContent = count;

        // Index page "Add to Cart" buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(function (btn) {
            var name = btn.getAttribute('data-name');
            if (isInCart(name)) {
                btn.textContent = 'In Cart ✓';
                btn.classList.add('in-cart');
            } else {
                btn.textContent = 'Add to Cart';
                btn.classList.remove('in-cart');
            }
        });

        // Produce page grid cart buttons
        document.querySelectorAll('.p-card-cart-btn').forEach(function (btn) {
            var name = btn.getAttribute('data-name');
            btn.textContent = isInCart(name) ? 'In Cart ✓' : 'Add to Cart';
            btn.classList.toggle('in-cart', isInCart(name));
        });

        // Produce page detail panel cart button
        var detailBtn = document.querySelector('.detail-cart-btn');
        if (detailBtn) {
            var n = detailBtn.getAttribute('data-name');
            detailBtn.textContent = isInCart(n) ? 'In Cart ✓' : 'Add to Cart';
            detailBtn.classList.toggle('in-cart', isInCart(n));
        }

        // WhatsApp send button
        var waBtn = document.getElementById('cart-whatsapp-btn');
        if (waBtn) {
            if (count > 0) {
                var msg = encodeURIComponent(buildWhatsAppMessage());
                waBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg;
                waBtn.classList.remove('disabled');
                waBtn.style.display = '';
            } else {
                waBtn.href = '#';
                waBtn.classList.add('disabled');
                waBtn.style.display = 'none';
            }
        }
    }
    window.updateCartUI = updateCartUI;

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
        cart.forEach(function (item) {
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
    window.renderCartDrawer = renderCartDrawer;

    window.openCartDrawer = function () {
        renderCartDrawer();
        updateCartUI();
        document.getElementById('cart-overlay').classList.add('open');
        document.getElementById('cart-drawer').classList.add('open');
        lockScroll();
    };

    window.closeCartDrawer = function () {
        document.getElementById('cart-overlay').classList.remove('open');
        document.getElementById('cart-drawer').classList.remove('open');
        unlockScroll();
    };

    // Initialize cart UI on page load
    updateCartUI();

    // ── Gallery item builder (shared by index + gallery pages) ──
    window.createGalleryItem = function (item) {
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
    };
})();
