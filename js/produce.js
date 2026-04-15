(function () {
    'use strict';

    var CART_KEY = 'kotaFarmCart';
    var WHATSAPP_NUMBER = '919460813090';
    var FARM_API = 'https://script.google.com/macros/s/AKfycbxo11Ng9wAQb7Q9djhdyhDEiBoAL2NG-j5hGbQWyGbsk-oA3aQUP9lwA6DNa80WXtiyHQ/exec';

    // ── Scroll lock (preserves position, prevents layout shift) ──
    var scrollLockCount = 0;
    var savedScrollY = 0;

    function lockScroll() {
        if (scrollLockCount === 0) {
            savedScrollY = window.scrollY;
            document.body.style.setProperty('--scroll-y', '-' + savedScrollY + 'px');
            document.body.classList.add('scroll-locked');
        }
        scrollLockCount++;
    }

    function unlockScroll() {
        scrollLockCount = Math.max(0, scrollLockCount - 1);
        if (scrollLockCount === 0) {
            document.body.classList.remove('scroll-locked');
            document.body.style.removeProperty('--scroll-y');
            window.scrollTo(0, savedScrollY);
        }
    }

    // ── Helpers ────────────────────────────────────────────
    function esc(text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
    }
    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartUI();
    }
    window.addToCart = function (veg) {
        var cart = getCart();
        var existing = cart.find(function (c) { return c.name === veg.name; });
        if (existing) existing.qty += 1;
        else cart.push({ name: veg.name, nameHi: veg.nameHi, qty: 1, unit: veg.unit || 'kg' });
        saveCart(cart);
    };
    window.removeFromCart = function (name) {
        saveCart(getCart().filter(function (c) { return c.name !== name; }));
        renderCartDrawer();
    };
    window.updateCartQty = function (name, delta) {
        var cart = getCart();
        var item = cart.find(function (c) { return c.name === name; });
        if (item) item.qty = Math.max(1, item.qty + delta);
        saveCart(cart);
        renderCartDrawer();
    };
    window.clearCart = function () {
        localStorage.removeItem(CART_KEY);
        updateCartUI();
        renderCartDrawer();
    };
    function isInCart(name) {
        return getCart().some(function (c) { return c.name === name; });
    }

    // ── Cart drawer ───────────────────────────────────────
    window.openCartDrawer = function () {
        renderCartDrawer();
        document.getElementById('cart-overlay').classList.add('open');
        document.getElementById('cart-drawer').classList.add('open');
        lockScroll();
    };
    window.closeCartDrawer = function () {
        document.getElementById('cart-overlay').classList.remove('open');
        document.getElementById('cart-drawer').classList.remove('open');
        unlockScroll();
    };

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
        var html = '';
        cart.forEach(function (item) {
            html +=
                '<div class="cart-item">' +
                    '<div class="cart-item-info"><span class="cart-item-name">' + esc(item.name) +
                        ' <span class="cart-item-name-hi">' + esc(item.nameHi) + '</span></span></div>' +
                    '<div class="cart-item-qty">' +
                        '<button type="button" class="cart-qty-btn" onclick="updateCartQty(\'' + esc(item.name) + '\', -1)">−</button>' +
                        '<span class="cart-qty-value">' + item.qty + ' <span class="cart-item-unit">' + esc(item.unit) + '</span></span>' +
                        '<button type="button" class="cart-qty-btn" onclick="updateCartQty(\'' + esc(item.name) + '\', 1)">+</button>' +
                    '</div>' +
                    '<button type="button" class="cart-item-remove" onclick="removeFromCart(\'' + esc(item.name) + '\')">&times;</button>' +
                '</div>';
        });
        body.innerHTML = html;
        if (footer) footer.style.display = '';
    }

    function buildWhatsAppMessage() {
        var cart = getCart();
        if (!cart.length) return '';
        var lines = ['🛒 *Order from Kota Natural Farm:*', ''];
        cart.forEach(function (item) {
            lines.push('• ' + item.name + ' (' + item.nameHi + ') — ' + item.qty + ' ' + item.unit);
        });
        lines.push('', 'Please confirm availability and pickup time. Thank you!');
        return lines.join('\n');
    }

    function updateCartUI() {
        var badge = document.getElementById('cart-fab-badge');
        var count = getCart().reduce(function (s, c) { return s + c.qty; }, 0);
        if (badge) badge.textContent = count;

        // Update all cart buttons on the grid
        document.querySelectorAll('.p-card-cart-btn').forEach(function (btn) {
            var name = btn.getAttribute('data-name');
            btn.textContent = isInCart(name) ? 'In Cart ✓' : 'Add to Cart';
            btn.classList.toggle('in-cart', isInCart(name));
        });

        // Update detail panel cart button if open
        var detailBtn = document.querySelector('.detail-cart-btn');
        if (detailBtn) {
            var n = detailBtn.getAttribute('data-name');
            detailBtn.textContent = isInCart(n) ? 'In Cart ✓' : 'Add to Cart';
            detailBtn.classList.toggle('in-cart', isInCart(n));
        }

        var waBtn = document.getElementById('cart-whatsapp-btn');
        if (waBtn) {
            if (count > 0) {
                var msg = encodeURIComponent(buildWhatsAppMessage());
                waBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg;
                waBtn.style.display = '';
            } else {
                waBtn.style.display = 'none';
            }
        }
    }

    // ── State ─────────────────────────────────────────────
    var currentFilter = 'all';
    var currentSort = 'name-asc';
    var currentSearch = '';
    var vegs = typeof vegetablesList !== 'undefined' ? vegetablesList.slice() : [];

    // Extract unique seasons for filter buttons
    var seasons = [];
    vegs.forEach(function (v) {
        if (seasons.indexOf(v.season) === -1) seasons.push(v.season);
    });

    // ── Build filter buttons ──────────────────────────────
    var filtersEl = document.getElementById('produce-filters');
    var filterOptions = ['All', 'Available'].concat(seasons);
    filterOptions.forEach(function (label) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'produce-filter-btn' + (label === 'All' ? ' active' : '');
        btn.textContent = label;
        btn.addEventListener('click', function () {
            currentFilter = label === 'All' ? 'all' : label === 'Available' ? 'available' : label;
            filtersEl.querySelectorAll('.produce-filter-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            renderGrid();
        });
        filtersEl.appendChild(btn);
    });

    // ── Sort select ───────────────────────────────────────
    document.getElementById('produce-sort-select').addEventListener('change', function () {
        currentSort = this.value;
        renderGrid();
    });

    // ── Search ────────────────────────────────────────────
    var searchInput = document.getElementById('produce-search');
    var searchTimeout = null;
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            currentSearch = searchInput.value.trim().toLowerCase();
            renderGrid();
        }, 200);
    });

    // ── Render grid ───────────────────────────────────────
    var gridEl = document.getElementById('produce-grid');
    var emptyEl = document.getElementById('produce-empty');
    var infoEl = document.getElementById('produce-results-info');

    function getFilteredSorted() {
        var list = vegs.filter(function (v) {
            if (currentFilter === 'available' && !v.available) return false;
            if (currentFilter !== 'all' && currentFilter !== 'available' && v.season !== currentFilter) return false;
            if (currentSearch) {
                var q = currentSearch;
                return v.name.toLowerCase().indexOf(q) !== -1 ||
                    v.nameHi.indexOf(q) !== -1 ||
                    v.season.toLowerCase().indexOf(q) !== -1 ||
                    v.desc.toLowerCase().indexOf(q) !== -1;
            }
            return true;
        });

        list.sort(function (a, b) {
            switch (currentSort) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'season': return a.season.localeCompare(b.season);
                case 'available':
                    if (a.available === b.available) return a.name.localeCompare(b.name);
                    return a.available ? -1 : 1;
                default: return 0;
            }
        });
        return list;
    }

    function renderGrid() {
        var list = getFilteredSorted();
        gridEl.innerHTML = '';

        if (!list.length) {
            emptyEl.style.display = '';
            infoEl.textContent = '';
            return;
        }
        emptyEl.style.display = 'none';
        infoEl.textContent = list.length + ' vegetable' + (list.length > 1 ? 's' : '') +
            (currentSearch ? ' matching "' + currentSearch + '"' : '');

        list.forEach(function (veg) {
            var firstImg = getFirstImage(veg);
            var card = document.createElement('div');
            card.className = 'p-card';
            card.innerHTML =
                '<div class="p-card-img">' +
                    '<img src="' + esc(firstImg) + '" alt="' + esc(veg.name) + '" loading="lazy">' +
                    '<span class="p-card-badge ' + (veg.available ? 'p-badge-available' : 'p-badge-upcoming') + '">' +
                        (veg.available ? 'Available' : 'Unavailable') +
                    '</span>' +
                '</div>' +
                '<div class="p-card-body">' +
                    '<div class="p-card-name">' + esc(veg.name) +
                        '<span class="p-card-name-hi"> ' + esc(veg.nameHi) + '</span>' +
                    '</div>' +
                    '<div class="p-card-season">' + esc(veg.season) + '</div>' +
                    '<p class="p-card-desc">' + esc(veg.desc) + '</p>' +
                '</div>' +
                '<div class="p-card-footer">' +
                    '<button type="button" class="p-card-view-btn">View Details</button>' +
                    (veg.available
                        ? '<button type="button" class="p-card-cart-btn' + (isInCart(veg.name) ? ' in-cart' : '') + '" data-name="' + esc(veg.name) + '">' +
                            (isInCart(veg.name) ? 'In Cart ✓' : 'Add to Cart') + '</button>'
                        : '') +
                '</div>';

            // Click card image or "View Details" → open detail
            card.querySelector('.p-card-img').addEventListener('click', function () { openDetail(veg); });
            var viewBtn = card.querySelector('.p-card-view-btn');
            if (viewBtn) viewBtn.addEventListener('click', function (e) { e.stopPropagation(); openDetail(veg); });

            // Cart button
            var cartBtn = card.querySelector('.p-card-cart-btn');
            if (cartBtn) {
                (function (v) {
                    cartBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (isInCart(v.name)) removeFromCart(v.name);
                        else addToCart(v);
                    });
                })(veg);
            }

            gridEl.appendChild(card);
        });
    }

    function getFirstImage(veg) {
        if (!veg.images || !veg.images.length) return veg.image || '';
        var first = veg.images[0];
        return typeof first === 'string' ? first : (first.src || '');
    }

    // ── Veg info tabs (nutrition + India context) ─────────
    function buildVegInfoTabs(veg) {
        if (!veg.nutrition && !veg.indiaContext) return '';

        var hasNutr = !!veg.nutrition;
        var hasIndia = !!veg.indiaContext;

        var html = '<div class="veg-info-tabs">';
        if (hasNutr)  html += '<button class="veg-info-tab' + (hasNutr ? ' active' : '') + '" data-tab="nutrition">\uD83E\uDD57 Nutrition</button>';
        if (hasIndia) html += '<button class="veg-info-tab' + (!hasNutr ? ' active' : '') + '" data-tab="india">\uD83C\uDDEE\uD83C\uDDF3 India</button>';
        html += '</div>';

        // Nutrition panel
        if (hasNutr) {
            var n = veg.nutrition;
            html += '<div class="veg-info-panel active" data-panel="nutrition">';

            if (n.goodFor && n.goodFor.length) {
                html += '<div class="good-for-label">Good for</div><div class="good-for-pills">';
                n.goodFor.forEach(function (item) { html += '<span class="good-for-pill">' + esc(item) + '</span>'; });
                html += '</div>';
            }

            if (n.per100g && n.per100g.length) {
                html += '<div class="nutrients-label">Per 100g \u00B7 % of daily need</div><div class="nutrients-list">';
                n.per100g.forEach(function (item) {
                    var barW = Math.min(item.pct, 100);
                    var isHigh = item.pct > 100;
                    var pctLabel = isHigh ? (item.pct + '% \u2705') : (item.pct < 5 ? esc(item.value) : (item.pct + '% DV'));
                    html += '<div>';
                    html += '<div class="nutrient-row">';
                    html += '<span class="nutrient-name">' + esc(item.name) + '</span>';
                    html += '<div class="nutrient-bar-wrap"><div class="nutrient-bar' + (isHigh ? ' high' : '') + '" style="width:' + barW + '%"></div></div>';
                    html += '<span class="nutrient-pct' + (isHigh ? ' high' : '') + '">' + pctLabel + '</span>';
                    html += '</div>';
                    if (item.note) html += '<div class="nutrient-sub">' + esc(item.note) + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (n.didYouKnow) {
                html += '<div class="did-you-know"><div class="did-you-know-label">Did you know?</div><div class="did-you-know-text">' + esc(n.didYouKnow) + '</div></div>';
            }

            html += '<div class="data-disclaimer"><span class="data-disclaimer-icon">\u2139\uFE0F</span><div><strong>Source:</strong> ' + esc(n.source || 'ICMR-NIN IFCT 2017') + '. Values are per 100g of raw vegetable. Actual values may vary by variety and cooking method.</div></div>';
            html += '</div>';
        }

        // India context panel
        if (hasIndia) {
            var ic = veg.indiaContext;
            html += '<div class="veg-info-panel' + (!hasNutr ? ' active' : '') + '" data-panel="india">';
            html += '<div class="india-stat-list">';
            if (ic.producingStates) html += '<div class="india-stat"><span class="india-stat-icon">\uD83C\uDF3E</span><div><div class="india-stat-label">Top producing states</div><div class="india-stat-value">' + esc(ic.producingStates) + '</div></div></div>';
            if (ic.exportMarkets)   html += '<div class="india-stat"><span class="india-stat-icon">\u2708\uFE0F</span><div><div class="india-stat-label">Export markets</div><div class="india-stat-value">' + esc(ic.exportMarkets) + '</div></div></div>';
            if (ic.position)        html += '<div class="india-stat"><span class="india-stat-icon">\uD83D\uDCE6</span><div><div class="india-stat-label">India\'s position</div><div class="india-stat-value">' + esc(ic.position) + '</div></div></div>';
            if (ic.bestSeason)      html += '<div class="india-stat"><span class="india-stat-icon">\uD83D\uDCC5</span><div><div class="india-stat-label">Best season in India</div><div class="india-stat-value">' + esc(ic.bestSeason) + '</div></div></div>';
            html += '</div>';
            if (ic.organicAdvantage) {
                html += '<div class="organic-note"><div class="organic-note-label">\uD83C\uDF31 The organic advantage</div><div class="organic-note-text">' + esc(ic.organicAdvantage) + '</div></div>';
            }
            html += '<div class="data-disclaimer"><span class="data-disclaimer-icon">\u2139\uFE0F</span><div><strong>Source:</strong> ' + esc(ic.source || 'APEDA 2024\u201325') + '. Trade figures are approximate and updated annually.</div></div>';
            html += '</div>';
        }

        return html;
    }

    // ── Detail panel ──────────────────────────────────────
    var overlay = document.getElementById('produce-detail-overlay');
    var panel = document.getElementById('produce-detail-panel');
    var detailBody = document.getElementById('produce-detail-body');
    var closeBtn = document.getElementById('produce-detail-close');
    var detailSlideIndex = 0;
    var detailImages = [];

    function openDetail(veg) {
        detailSlideIndex = 0;
        detailImages = (veg.images || [veg.image]).map(function (item) {
            if (typeof item === 'string') return { type: 'image', src: item };
            return { type: item.type || 'image', src: item.src || item };
        });

        var galleryHtml = '';
        var dotsHtml = '';
        var showNav = detailImages.length > 1;

        detailImages.forEach(function (item, idx) {
            var activeClass = idx === 0 ? ' active' : '';
            if (item.type === 'video') {
                galleryHtml += '<video src="' + esc(item.src) + '" class="detail-slide' + activeClass + '" data-index="' + idx + '" muted playsinline preload="metadata" loop></video>';
            } else {
                galleryHtml += '<img src="' + esc(item.src) + '" alt="' + esc(veg.name) + '" class="detail-slide' + activeClass + '" data-index="' + idx + '">';
            }
            if (showNav) dotsHtml += '<button class="detail-gallery-dot' + activeClass + '" data-index="' + idx + '"></button>';
        });

        var videoAtZero = detailImages[0] && detailImages[0].type === 'video';

        detailBody.innerHTML =
            '<div class="detail-gallery">' +
                galleryHtml +
                (showNav ? '<div class="detail-gallery-dots">' + dotsHtml + '</div>' +
                    '<button class="detail-gallery-nav prev" aria-label="Previous">&lsaquo;</button>' +
                    '<button class="detail-gallery-nav next" aria-label="Next">&rsaquo;</button>' : '') +
                '<button class="detail-play-btn' + (videoAtZero ? ' visible' : '') + '" aria-label="Play video">&#9654;</button>' +
            '</div>' +
            '<div class="detail-content">' +
                '<span class="detail-badge ' + (veg.available ? 'p-badge-available' : 'p-badge-upcoming') + '">' +
                    (veg.available ? 'Available Now' : 'Unavailable') + '</span>' +
                '<h2 class="detail-name">' + esc(veg.name) +
                    '<span class="detail-name-hi">' + esc(veg.nameHi) + '</span></h2>' +
                '<div class="detail-meta">' +
                    '<div class="detail-meta-item"><span class="detail-meta-label">Season</span>' + esc(veg.season) + '</div>' +
                    '<div class="detail-meta-item"><span class="detail-meta-label">Unit</span>' + esc(veg.unit || 'kg') + '</div>' +
                '</div>' +
                '<p class="detail-desc">' + esc(veg.desc) + '</p>' +
                buildVegInfoTabs(veg) +
                (veg.available
                    ? '<button type="button" class="detail-cart-btn' + (isInCart(veg.name) ? ' in-cart' : '') + '" data-name="' + esc(veg.name) + '">' +
                        (isInCart(veg.name) ? 'In Cart ✓' : 'Add to Cart') + '</button>'
                    : '') +
            '</div>';

        // Wire veg info tabs
        detailBody.querySelectorAll('.veg-info-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var target = tab.getAttribute('data-tab');
                detailBody.querySelectorAll('.veg-info-tab').forEach(function (t) {
                    t.classList.toggle('active', t.getAttribute('data-tab') === target);
                });
                detailBody.querySelectorAll('.veg-info-panel').forEach(function (p) {
                    p.classList.toggle('active', p.getAttribute('data-panel') === target);
                });
            });
        });

        // Wire gallery navigation
        if (showNav) {
            detailBody.querySelector('.detail-gallery-nav.prev').addEventListener('click', function () {
                showDetailSlide((detailSlideIndex - 1 + detailImages.length) % detailImages.length);
            });
            detailBody.querySelector('.detail-gallery-nav.next').addEventListener('click', function () {
                showDetailSlide((detailSlideIndex + 1) % detailImages.length);
            });
            detailBody.querySelectorAll('.detail-gallery-dot').forEach(function (dot) {
                dot.addEventListener('click', function () {
                    showDetailSlide(parseInt(dot.getAttribute('data-index'), 10));
                });
            });
        }

        // Wire video play
        var playBtn = detailBody.querySelector('.detail-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', function () {
                var vid = detailBody.querySelector('video.detail-slide.active');
                if (vid) {
                    if (vid.paused) { vid.play(); playBtn.style.display = 'none'; }
                    else { vid.pause(); playBtn.style.display = ''; }
                }
            });
        }

        // Wire cart button
        var cartBtn = detailBody.querySelector('.detail-cart-btn');
        if (cartBtn) {
            (function (v) {
                cartBtn.addEventListener('click', function () {
                    if (isInCart(v.name)) removeFromCart(v.name);
                    else addToCart(v);
                });
            })(veg);
        }

        // Open panel
        overlay.classList.add('open');
        panel.classList.add('open');
        panel.scrollTop = 0;
        lockScroll();
    }

    function showDetailSlide(idx) {
        detailSlideIndex = idx;
        var gallery = detailBody.querySelector('.detail-gallery');
        gallery.querySelectorAll('.detail-slide').forEach(function (s) { s.classList.remove('active'); });
        gallery.querySelectorAll('.detail-gallery-dot').forEach(function (d) { d.classList.remove('active'); });
        var slide = gallery.querySelector('.detail-slide[data-index="' + idx + '"]');
        var dot = gallery.querySelector('.detail-gallery-dot[data-index="' + idx + '"]');
        if (slide) slide.classList.add('active');
        if (dot) dot.classList.add('active');

        // Pause all videos, show play button if current is video
        gallery.querySelectorAll('video').forEach(function (v) { v.pause(); });
        var playBtn = gallery.querySelector('.detail-play-btn');
        if (playBtn) {
            playBtn.classList.toggle('visible', detailImages[idx] && detailImages[idx].type === 'video');
            playBtn.style.display = '';
        }
    }

    function closeDetail() {
        overlay.classList.remove('open');
        panel.classList.remove('open');
        unlockScroll();
        panel.querySelectorAll('video').forEach(function (v) { v.pause(); });
    }

    closeBtn.addEventListener('click', closeDetail);
    overlay.addEventListener('click', closeDetail);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (panel.classList.contains('open')) closeDetail();
            else if (document.getElementById('cart-drawer').classList.contains('open')) closeCartDrawer();
        }
    });

    // Touch swipe to close detail panel
    var detailTouchStartX = 0;
    panel.addEventListener('touchstart', function (e) {
        detailTouchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    panel.addEventListener('touchend', function (e) {
        var diff = e.changedTouches[0].screenX - detailTouchStartX;
        if (diff > 80) closeDetail();
    }, { passive: true });

    // ── Live availability from Google Sheet (cached per session) ──
    var AVAIL_CACHE_KEY = 'kotaFarmAvail';
    var availLoaded = false;

    function mergeAvailability(liveData) {
        liveData.forEach(function (entry) {
            var match = vegs.find(function (v) { return v.name === entry.name; });
            if (match) match.available = entry.available;
        });
        availLoaded = true;
    }

    function loadCachedAvailability() {
        try {
            var cached = sessionStorage.getItem(AVAIL_CACHE_KEY);
            if (cached) {
                mergeAvailability(JSON.parse(cached));
                return true;
            }
        } catch (e) {}
        return false;
    }

    function fetchAvailability() {
        fetch(FARM_API + '?t=' + Date.now())
            .then(function (res) { return res.json(); })
            .then(function (data) {
                try { sessionStorage.setItem(AVAIL_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
                mergeAvailability(data);
                renderGrid();
            })
            .catch(function () {
                if (!availLoaded) {
                    document.querySelectorAll('.p-card-badge.avail-loading').forEach(function (b) {
                        b.classList.remove('avail-loading');
                    });
                }
            });
    }

    // ── Notify me subscription ───────────────────────────
    var NOTIFY_KEY = 'kotaFarmNotify';
    var notifyForm = document.getElementById('notify-form');
    var notifyEmail = document.getElementById('notify-email');
    var notifySuccess = document.getElementById('notify-success');
    var notifyBanner = document.getElementById('notify-banner');

    function isSubscribed() {
        return localStorage.getItem(NOTIFY_KEY) === 'true';
    }

    function showSubscribedState() {
        if (!notifyBanner) return;
        if (notifyForm) notifyForm.style.display = 'none';
        if (notifySuccess) {
            notifySuccess.style.display = '';
            notifySuccess.textContent = "You're subscribed — we'll email you when new vegetables are available!";
        }
    }

    if (isSubscribed()) {
        showSubscribedState();
    }

    if (notifyForm) {
        notifyForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = notifyEmail.value.trim();
            if (!email) return;

            var btn = notifyForm.querySelector('.notify-strip-btn');
            btn.disabled = true;
            btn.textContent = '✓';

            setTimeout(function () {
                localStorage.setItem(NOTIFY_KEY, 'true');
                showSubscribedState();
            }, 600);

            fetch(FARM_API, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ email: email })
            }).catch(function () {});
        });
    }

    // ── Init ──────────────────────────────────────────────
    var hadCache = loadCachedAvailability();
    renderGrid();
    updateCartUI();

    if (!hadCache) {
        document.querySelectorAll('.p-card-badge').forEach(function (b) {
            b.classList.add('avail-loading');
        });
    }
    fetchAvailability();
})();
