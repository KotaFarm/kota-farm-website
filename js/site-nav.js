// ──────────────────────────────────────────────────────────────
//  Site nav — Kovana Natural Farm
//
//  Powers the mobile hamburger toggle for the shared <nav id="navbar">
//  used on every page of the site. Included on sub-pages that don't
//  load js/main.js (which has the same logic plus homepage-specific
//  features like scroll-spy and fade-ins).
//
//  Safe to include on any page with the standard nav markup.
//  No-ops if the nav isn't found.
// ──────────────────────────────────────────────────────────────
(function () {
    var nav    = document.getElementById('navbar');
    var toggle = document.getElementById('nav-toggle');
    if (!nav || !toggle) return;

    toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open);
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    // Close the menu when any nav link is tapped on mobile.
    nav.querySelectorAll('.nav-links a').forEach(function (link) {
        link.addEventListener('click', function () {
            nav.classList.remove('nav-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open menu');
        });
    });

    // Subtle scroll-shadow on the nav bar once we've scrolled past the top.
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        window.requestAnimationFrame(function () {
            if (window.scrollY > 40) nav.classList.add('scrolled');
            else                     nav.classList.remove('scrolled');
            ticking = false;
        });
        ticking = true;
    }, { passive: true });
})();
