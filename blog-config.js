// ─────────────────────────────────────────────────────────────
// Blog — Kota Natural Farm
// ─────────────────────────────────────────────────────────────
//
// Comments & reactions are powered by Hyvor Talk
//   Website ID: 15328    Dashboard: https://talk.hyvor.com
//
// Each blog post gets the comments + reactions widget by including
// TWO lines near the end of its HTML (just after the closing
// </article> tag is a good spot):
//
//   <div class="blog-comments-mount" data-slug="your-post-slug"></div>
//   <script src="../js/blog-comments.js" defer></script>
//
// That's the whole integration. The shared script (/js/blog-comments.js)
// handles the Hyvor Talk markup, styles, and embed loading, and uses
// the data-slug as the page-id so every post has its own thread.
//
// ─────────────────────────────────────────────────────────────
// To add a new blog post:
//   1. Create the post HTML file (usually inside /blog/ — copy an
//      existing post as a template). If the post lives somewhere
//      else on the site (e.g. /practices/), use the `href` field.
//   2. Put the post's photos inside /blog/images/<post-slug>/
//   3. In the new post's HTML, include the two-line comments block
//      above with data-slug="your-post-slug".
//   4. Add a new object at the TOP of the BLOG_POSTS array below
//      (newest first — the listing shows newest at the top).
//
// Fields:
//   slug        → url-safe name. Used to build the URL if no
//                 explicit `href` is given (→ blog/<slug>.html).
//   href        → OPTIONAL. Full path to the post HTML, relative
//                 to the site root. Use this when the post lives
//                 outside the /blog/ folder.
//   date        → shown as-is, written naturally ("April 20, 2026")
//   title       → the post headline
//   summary     → 1–2 sentences for the listing cards
//   cover       → path to the cover image, relative to site root
//   tag         → short single word: story / practice / climate /
//                 harvest / seasons / soil / water
//   readingTime → rough estimate like "5 min read"
// ─────────────────────────────────────────────────────────────

const BLOG_POSTS = [
    {
        slug:        "fire-didnt-start-here",
        date:        "April 20–21, 2026",
        title:       "The Fire Didn't Start Here",
        summary:     "Chemicals, flooding, fire — three ways a neighbouring farm can change yours. This week the third reached ours — and a five-minute heat wave the next day did even more damage than the flames. The full scale of what we lost, and what every farmer on the road can do about it.",
        cover:       "blog/images/fire-didnt-start-here/neighbour-field-fire.jpg",
        tag:         "climate",
        readingTime: "6 min read"
    },
    {
        slug:        "mulching",
        href:        "practices/mulching.html",
        date:        "March 2026",
        title:       "Mulching — Nothing Leaves the Farm",
        summary:     "Fallen leaves, coir pith rings, living ground cover — how we keep soil protected and build fertility without burning or discarding anything.",
        cover:       "gallery/practices/mulching/mulch-rows-overview.webp",
        tag:         "practice",
        readingTime: "4 min read"
    },
    {
        slug:        "water-smart-irrigation",
        href:        "practices/water-smart-irrigation.html",
        date:        "March 2026",
        title:       "Water-Smart Irrigation",
        summary:     "Drip systems, sprinklers, and rainwater harvesting — how we make every drop count in Rajasthan's semi-arid climate.",
        cover:       "gallery/practices/irrigation/drip-installation.webp",
        tag:         "practice",
        readingTime: "4 min read"
    }
];
