/* ──────────────────────────────────────────────────────────────
   Farm App — config
   Edit-friendly knobs. Pure data, no logic.
   ────────────────────────────────────────────────────────────── */

window.FarmApp = window.FarmApp || {};

FarmApp.config = {
    // Backend API base URL. Override per-device in the app's Settings panel.
    API_BASE: '/api',

    // Farm slug used for public endpoints
    FARM_SLUG: 'kovana'
};

// Quality grades: API value → button label
FarmApp.QUALITY = [
    { value: 'HIGH',   label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW',    label: 'Low' }
];
