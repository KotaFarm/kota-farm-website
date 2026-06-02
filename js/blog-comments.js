/* ─────────────────────────────────────────────────────────────
 * Blog comments & reactions — Kovana Natural Farm
 * ─────────────────────────────────────────────────────────────
 * Powered by Hyvor Talk (website ID 15328 · dashboard: talk.hyvor.com)
 *
 * USAGE — add these two lines near the end of any blog post, inside
 * <body> but before the closing </body> tag (ideally just after the
 * closing </article> tag so the reactions sit directly below the post):
 *
 *     <div class="blog-comments-mount" data-slug="your-post-slug"></div>
 *     <script src="../js/blog-comments.js" defer></script>
 *
 * That is the entire integration. The script injects:
 *   • a reactions bar (likes / hearts) just below the article
 *   • a full comments section with a heading and the Hyvor Talk widget
 *   • the required CSS
 *   • the Hyvor Talk embed script (loaded once per page)
 *
 * The `data-slug` value is used as Hyvor's page-id, which means each
 * post has its own separate thread and reaction tally. Use the same
 * slug that appears in blog-config.js for the post.
 *
 * Path note: blog posts live in /blog/ or /practices/, both one level
 * deep, so `../js/blog-comments.js` works for both. If you ever add a
 * post at the site root, use `js/blog-comments.js`.
 * ─────────────────────────────────────────────────────────────
 */
(function () {
    'use strict';

    var WEBSITE_ID  = '15328';
    var EMBED_URL   = 'https://talk.hyvor.com/embed/embed.js';
    var STYLE_ID    = 'kf-blog-comments-styles';
    var SCRIPT_MARK = 'data-kf-hyvor-embed';

    var CSS = [
        '.blog-reactions {',
        '    margin: var(--spacing-lg, 3rem) 0 var(--spacing-md, 2rem);',
        '    padding-top: var(--spacing-md, 2rem);',
        '    border-top: 1px solid rgba(139, 152, 98, 0.25);',
        '    display: flex;',
        '    justify-content: center;',
        '}',
        '.blog-comments {',
        '    background: var(--sand, #f5f1e8);',
        '    border-top: 1px solid rgba(139, 152, 98, 0.25);',
        '    padding: var(--spacing-lg, 3rem) var(--spacing-md, 1.5rem);',
        '    margin-top: var(--spacing-md, 2rem);',
        '}',
        '.blog-comments-inner {',
        '    max-width: 900px;',
        '    margin: 0 auto;',
        '}',
        '.blog-comments-title {',
        "    font-family: 'Crimson Pro', serif;",
        '    font-size: 1.8rem;',
        '    color: var(--earth-dark, #2d3319);',
        '    margin-bottom: 0.4rem;',
        '}',
        '.blog-comments-sub {',
        '    color: var(--earth-medium, #5a5a3d);',
        '    font-size: 0.95rem;',
        '    margin-bottom: var(--spacing-md, 1.5rem);',
        '    line-height: 1.6;',
        '}',
        'hyvor-talk-comments { display: block; }'
    ].join('\n');

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function injectHyvorScript() {
        if (document.querySelector('script[' + SCRIPT_MARK + ']')) return;
        var s = document.createElement('script');
        s.src = EMBED_URL;
        s.async = true;
        s.type = 'module';
        s.setAttribute(SCRIPT_MARK, '');
        document.body.appendChild(s);
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderMount(mount) {
        var slug = mount.getAttribute('data-slug');
        if (!slug) {
            console.warn('[blog-comments] .blog-comments-mount is missing a data-slug attribute', mount);
            return;
        }
        if (mount.getAttribute('data-rendered') === '1') return;
        mount.setAttribute('data-rendered', '1');

        var safeSlug  = escapeHtml(slug);
        var heading   = mount.getAttribute('data-title')    || 'Join the conversation';
        var sub       = mount.getAttribute('data-subtitle') || "Thoughts, questions, experiences from your own farm \u2014 we'd like to hear them.";

        mount.innerHTML =
            '<div class="blog-reactions">' +
                '<hyvor-talk-reactions website-id="' + WEBSITE_ID + '" page-id="' + safeSlug + '"></hyvor-talk-reactions>' +
            '</div>' +
            '<section class="blog-comments" aria-label="Comments">' +
                '<div class="blog-comments-inner">' +
                    '<h2 class="blog-comments-title">' + escapeHtml(heading) + '</h2>' +
                    '<p class="blog-comments-sub">' + escapeHtml(sub) + '</p>' +
                    '<hyvor-talk-comments website-id="' + WEBSITE_ID + '" page-id="' + safeSlug + '"></hyvor-talk-comments>' +
                '</div>' +
            '</section>';
    }

    function init() {
        var mounts = document.querySelectorAll('.blog-comments-mount');
        if (!mounts.length) return;

        injectStyles();
        for (var i = 0; i < mounts.length; i++) renderMount(mounts[i]);
        injectHyvorScript();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
