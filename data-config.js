// ─────────────────────────────────────────────────────────────
// Data Sources — Kovana Natural Farm
// ─────────────────────────────────────────────────────────────
// All external data URLs in one place.
// Currently pointing to published Google Sheets (CSV).
// To switch to a real DB: replace each URL with your API endpoint
// and (if needed) adjust the fetch/parse logic in the consumer files.
//
// Diary  → diary-config.js   (reads window.DATA_SOURCES.diary)
// Plants → farm-diary.html   (reads window.DATA_SOURCES.plants)
// ─────────────────────────────────────────────────────────────

window.DATA_SOURCES = {
    // Farm diary / updates tab
    diary: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZb8u89bi2HsIKPs5YVB-Sd8aeX7MiOWhTySr-K7K0mr977JfSOUIC84XEGjs4nQUmfnaDoNIBIPTR/pub?gid=481797168&single=true&output=csv',

    // Plant inventory tab
    plants: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsgsbXmtZ39uVJ-488axO7In7B_McVeZlsGG0_Qn_BBtpeTKclja1m2nirWYB6Rdn15Iiz3MnZgIvp/pub?gid=1095662603&single=true&output=csv'
};
