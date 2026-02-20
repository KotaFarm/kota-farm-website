// ============================================================
//  GALLERY CONFIGURATION
//  To add a new photo or video, see HOW-TO-ADD-PHOTOS.txt
//
//  Each item has: file, caption, and category.
//  Categories follow the permaculture cycle — the natural rhythm
//  of working with the land, from soil to harvest and back again.
//
//  The Cycle (in display order):
//    "The Land"      — the farm itself, infrastructure, water, pathways
//    "Prepare"       — soil building, cover crops, green manure, composting
//    "Plant"         — seedlings, nursery, saplings, new plantings
//    "Nurture"       — growing crops, food forest, polyculture beds
//    "Harvest"       — the abundance that comes from working with nature
//    "Tend"          — pruning, seasonal care, returning to the cycle
// ============================================================

const galleryCategories = [
  { id: "the-land",  label: "🌍 The Land",  phase: "foundation" },
  { id: "prepare",   label: "🌱 Prepare",   phase: "cycle" },
  { id: "plant",     label: "🪴 Plant",     phase: "cycle" },
  { id: "nurture",   label: "🌿 Nurture",   phase: "cycle" },
  { id: "harvest",   label: "🌾 Harvest",   phase: "cycle" },
  { id: "tend",      label: "✂️ Tend",      phase: "cycle" }
];

const galleryItems = [
  // ── 🌍 The Land ─────────────────────────────────────────────
  // The farm as a whole — infrastructure, water systems, pathways
  {
    "file": "farm-aerial-view.jpeg",
    "caption": "Bird's eye view of the farm with winding stone pathways",
    "category": "the-land"
  },
  {
    "file": "farm-pond.jpeg",
    "caption": "Water harvesting pond — catching every drop of rain",
    "category": "the-land"
  },
  {
    "file": "stone-pathway.jpeg",
    "caption": "Pathways that integrate function and beauty",
    "category": "the-land"
  },
  {
    "file": "farm-gathering.jpg",
    "caption": "Community gathers at the farm — knowledge grows when shared",
    "category": "the-land"
  },
  {
    "file": "farm-tour.mp4",
    "caption": "Walk through the farm: see the systems in action",
    "category": "the-land"
  },

  // ── 🌱 Prepare ──────────────────────────────────────────────
  // Building soil, cover crops, green manure — feeding the earth first
  {
    "file": "cover-crops.jpeg",
    "caption": "Cover crops protect and nourish the soil between seasons",
    "category": "prepare"
  },
  {
    "file": "green-manure.jpeg",
    "caption": "Green manure returns nitrogen to the soil naturally",
    "category": "prepare"
  },

  // ── 🪴 Plant ────────────────────────────────────────────────
  // Seedlings, nursery, establishing trees — new life begins
  {
    "file": "greenhouse-seedlings.jpg",
    "caption": "Seedlings growing strong in the shade net nursery",
    "category": "plant"
  },
  {
    "file": "tree-saplings.jpg",
    "caption": "Young saplings establishing along the farm boundary",
    "category": "plant"
  },
  {
    "file": "onion-sprouts.jpg",
    "caption": "Onion shoots emerging from freshly prepared beds",
    "category": "plant"
  },

  // ── 🌿 Nurture ──────────────────────────────────────────────
  // Growing crops, food forest thriving, polyculture in action
  {
    "file": "vegetable-beds.jpeg",
    "caption": "Polyculture beds with drip irrigation — diversity is resilience",
    "category": "nurture"
  },
  {
    "file": "carrot-field.jpg",
    "caption": "Dense carrot beds thriving in open-field polyculture",
    "category": "nurture"
  },
  {
    "file": "guava-orchard.jpg",
    "caption": "Guava orchard fruiting in the food forest",
    "category": "nurture"
  },
  {
    "file": "fruit-tree.jpeg",
    "caption": "Fruit trees establishing their canopy in the food forest",
    "category": "nurture"
  },
  {
    "file": "pomegranate.jpeg",
    "caption": "Pomegranate forming on a young tree — patience rewarded",
    "category": "nurture"
  },
  {
    "file": "bamboo-closeup.jpg",
    "caption": "Bamboo — the fastest-growing renewable on the farm",
    "category": "nurture"
  },

  // ── 🌾 Harvest ──────────────────────────────────────────────
  // The abundance that comes from working with nature
  {
    "file": "harvest-bowls.jpg",
    "caption": "Morning harvest: fresh carrots, greens, herbs, and spinach",
    "category": "harvest"
  },
  {
    "file": "fresh-harvest.jpeg",
    "caption": "Abundant harvest: carrots, greens, cauliflower, radishes",
    "category": "harvest"
  },
  {
    "file": "winter-harvest.jpeg",
    "caption": "Winter harvest: peas, tomatoes, brinjal, and fresh greens",
    "category": "harvest"
  },
  {
    "file": "morning-harvest-greens.jpeg",
    "caption": "Fresh from the field: beans, methi, tomatoes, and leafy greens",
    "category": "harvest"
  },

  // ── ✂️ Tend ──────────────────────────────────────────────────
  // Pruning, maintenance, seasonal care — closing the loop
  {
    "file": "moringa-before-pruning.jpeg",
    "caption": "Moringa grove before seasonal pruning — full canopy",
    "category": "tend"
  },
  {
    "file": "moringa-pruned.jpeg",
    "caption": "Moringa after winter pruning — ready for spring regrowth",
    "category": "tend"
  }
];
