// ─────────────────────────────────────────────────────────────
// Farm Diary — Kota Natural Farm
// ─────────────────────────────────────────────────────────────
// To add a new entry:
//   1. Copy your photo into the /diary/ folder
//   2. Add a new object at the TOP of this array (newest first)
//   3. Only the first 2 entries show on the homepage
//
// Fields:
//   photo   → filename inside the /diary/ folder
//   date    → shown as-is, write it naturally ("April 15, 2026")
//   title   → short headline
//   note    → 1–3 sentences, in plain language
//   tag     → one word: harvest / trees / soil / water / animals / farm
// ─────────────────────────────────────────────────────────────

const DIARY_ENTRIES = [
    {
        photo: "diary/34a0a9f3-407b-4281-93ad-292691c9fa25.jpg",
        date:  "April 15, 2026",
        title: "Fresh seedlings in the ground",
        note:  "Rows of seedlings just breaking through the soil — hand-sown, spaced carefully, grown under the shade net. This is the beginning of the next crop cycle.",
        tag:   "harvest"
    },
    {
        photo: "diary/88946053-8c1e-4977-bc55-7a55414941b4.webp",
        date:  "April 15, 2026",
        title: "First corn on the farm — ever",
        note:  "These corn plants were sown by hand in March. This is our very first corn crop — the field is standing tall and first harvest is just weeks away.",
        tag:   "harvest"
    },
    {
        photo: "diary/4aeae269-e72e-4ac5-a5fa-8d06adc5f4d6.jpg",
        date:  "April 15, 2026",
        title: "Setting up to make our own organic fertilizer",
        note:  "These drums will be used to prepare and store liquid organic fertilizer on-site — made from farm waste and FYM. No bought chemicals, everything made here.",
        tag:   "soil"
    }
];
