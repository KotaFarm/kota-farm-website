/* ──────────────────────────────────────────────────────────────
   Harvest — config & constants
   Edit-friendly knobs live here. Pure data, no logic.
   ────────────────────────────────────────────────────────────── */

(function (Harvest) {
    'use strict';

    // ── Data sources ───────────────────────────────────
    // Set API to an Apps Script /exec URL that returns JSON, OR set CSV_URL
    // to a "Publish to web" CSV. API wins if both are set.
    Harvest.config = {
        API: '',
        CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZb8u89bi2HsIKPs5YVB-Sd8aeX7MiOWhTySr-K7K0mr977JfSOUIC84XEGjs4nQUmfnaDoNIBIPTR/pub?gid=100&single=true&output=csv'
    };

    // ── Brand colors (mirrored from css/harvest.css) ──
    Harvest.COLORS = {
        sprout:  '#a8c686',
        leaf:    '#5a7a3a',
        earthDk: '#2d3319',
        earthMd: '#4a5a2f',
        sand:    '#e8dcc4',
        clay:    '#c4a572',
        water:   '#6b9080',
        high:    '#5a7a3a',
        medium:  '#c4a572',
        low:     '#b06a4f'
    };
    Harvest.CROP_PALETTE = [
        '#5a7a3a', '#a8c686', '#6b9080', '#c4a572',
        '#8b9862', '#b06a4f', '#4a5a2f', '#7a9a6a'
    ];

    // ── Offline / fallback sample data ─────────────────
    // Used when the network call fails, or when no data source is configured.
    Harvest.SAMPLE_DATA = [
        { date: '2026-04-25', crop: 'Garlic',      weight: 18.85, quality: 'Medium', photoUrl: 'https://drive.google.com/file/d/1HucvlX1c_6F7mJWG8vT1_zPWHH4UgMWY/view?usp=drive_link', notes: 'Small bulbs; curing on floor — hang with airflow to protect quality' },
        { date: '2026-04-24', crop: 'Brinjal',     weight: 2.00,  quality: 'High',   photoUrl: 'https://drive.google.com/file/d/1yncEY8N-hidPb7spNcYOOLn8ahXn-IlK/view?usp=drive_link', notes: 'Small round variety; healthy' },
        { date: '2026-04-24', crop: 'Okra',        weight: 3.75,  quality: 'Medium', photoUrl: '', notes: 'Some pods over-mature — pick younger next time' },
        { date: '2026-04-24', crop: 'Tomato',      weight: 2.35,  quality: 'High',   photoUrl: '', notes: 'Cherry/small variety; ripe and uniform' },
        { date: '2026-04-24', crop: 'Carrot',      weight: 1.50,  quality: 'Medium', photoUrl: '', notes: 'Small but typical for natural farming' },
        { date: '2026-04-24', crop: 'Palak',       weight: 5.00,  quality: 'High',   photoUrl: '', notes: 'Excellent — full leaves, fresh color' },
        { date: '2026-04-19', crop: 'Okra',        weight: 5.00,  quality: 'High',   photoUrl: 'https://drive.google.com/file/d/125ngi_2zYZ6yVtVVluDPuzdGw8TDFuzh/view?usp=drive_link', notes: 'Small-medium pods, fresh green' },
        { date: '2026-04-19', crop: 'Tomato',      weight: 1.20,  quality: 'High',   photoUrl: '', notes: 'Yellow cherry variety, ripe and uniform' },
        { date: '2026-04-19', crop: 'Palak',       weight: 7.00,  quality: 'High',   photoUrl: '', notes: 'Full leaves, vibrant color' },
        { date: '2026-04-11', crop: 'Corn',        weight: 5.00,  quality: 'High',   photoUrl: 'https://drive.google.com/file/d/15Je2BsgJdgSCwvhjC1p5iF83perAgF_h/view?usp=drive_link', notes: 'Fresh green husks, recently picked; ~20 cobs' },
        { date: '2026-03-28', crop: 'Chana',       weight: 11.00, quality: 'High',   photoUrl: 'https://drive.google.com/file/d/1_igwp6DbPEl416tp0lubkD1Tb8i08LKQ/view?usp=drive_link', notes: 'Estimated weight; dried/threshed' },
        { date: '2026-03-28', crop: 'Urad Dal',    weight: 2.50,  quality: 'High',   photoUrl: 'https://drive.google.com/file/d/1_igwp6DbPEl416tp0lubkD1Tb8i08LKQ/view?usp=drive_link', notes: 'Estimated weight; minor chaff' },
        { date: '2026-03-28', crop: 'Methi seeds', weight: 4.00,  quality: 'High',   photoUrl: 'https://drive.google.com/file/d/1_igwp6DbPEl416tp0lubkD1Tb8i08LKQ/view?usp=drive_link', notes: 'Estimated weight; fine and uniform' },
        { date: '2026-03-19', crop: 'Potato',      weight: 10.00, quality: 'High',   photoUrl: 'https://drive.google.com/file/d/1cnedT3ahkSvlX3lsXbqM4hQKgSfYlniq/view?usp=drive_link', notes: 'Two bowls combined; varied sizes' },
        { date: '2026-03-19', crop: 'Tomato',      weight: 3.00,  quality: 'High',   photoUrl: '', notes: 'Cherry variety; ripe and uniform' },
        { date: '2026-03-19', crop: 'Carrot',      weight: 1.50,  quality: 'High',   photoUrl: '', notes: 'Red Indian variety; good color' },
        { date: '2026-03-19', crop: 'Beetroot',    weight: 0.80,  quality: 'High',   photoUrl: '', notes: 'Small bulbs with stems' },
        { date: '2026-02-17', crop: 'Green Peas',  weight: 5.00,  quality: 'High',   photoUrl: 'https://drive.google.com/file/d/1mMwxzsLJv7ltgxKpUFbYgbZKVRO0WILp/view?usp=drive_link', notes: 'Big bowl; pods look plump and fresh' },
        { date: '2026-02-17', crop: 'Brinjal',     weight: 1.00,  quality: 'High',   photoUrl: '', notes: 'Small long purple variety; firm and glossy' },
        { date: '2026-02-17', crop: 'Tomato',      weight: 1.50,  quality: 'Medium', photoUrl: '', notes: 'Mix of ripe red and unripe green' },
        { date: '2026-02-17', crop: 'Palak',       weight: 1.50,  quality: 'High',   photoUrl: '', notes: 'Fresh leafy greens' }
    ];

    // ── Lifetime pre-tracking baseline ─────────────────
    // Per-crop totals from before active row-by-row tracking began.
    // Applied ONLY to lifetime tiles + Top Crops chart on "All Time" view.
    // Excluded from trend chart, Harvest Days count, and photo grid.
    Harvest.BASELINE = {
        'Tomato':       91.95,
        'Palak':        66.50,
        'Cauliflower':  60.00,
        'Green Peas':   27.00,
        'Carrot':       17.00,
        'Potato':       15.00,
        'Radish':       15.00,
        'Chana':        14.00,
        'Cabbage':      10.00,
        'Methi leaves': 10.00,
        'Kalibatli':    10.00,
        'Wild Spinach':  8.00,
        'Brinjal':       7.00,
        'Coriander':     5.00,
        'Beetroot':      4.20,
        'Methi seeds':   2.00,
        'Cowpea':        2.00,
        'Okra':          1.25
    };

})(window.Harvest = window.Harvest || {});
