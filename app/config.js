/* ──────────────────────────────────────────────────────────────
   Farm App — config
   Edit-friendly knobs. Pure data, no logic.
   ────────────────────────────────────────────────────────────── */

window.FarmApp = window.FarmApp || {};

FarmApp.config = {
    // Backend API base URL. Override per-device in the app's Settings panel.
    API_BASE: 'http://localhost:3000',

    // Farm slug used for public endpoints
    FARM_SLUG: 'kovana',

    // Supabase project (login only — data lives in your own database).
    // Both values are public-safe: the key is the "publishable" key.
    SUPABASE_URL: 'https://emnbeytcylwuuesscrxv.supabase.co',
    SUPABASE_KEY: 'sb_publishable_ptGAQ0Jp3J-w49-9buZ5XQ_OsmR_30C'
};

// Quality grades: API value → button label
FarmApp.QUALITY = [
    { value: 'HIGH',   label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW',    label: 'Low' }
];
