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
    "file": "the-land/farm-aerial-shade-net.jpeg",
    "caption": "Aerial view of the farm — shade net, crop patches, and open fields stretching to the horizon",
    "category": "the-land"
  },
  {
    "file": "the-land/farm-sunset.jpeg",
    "caption": "Golden hour over the farm — crops glowing in the evening light",
    "category": "the-land"
  },
  {
    "file": "the-land/farm-pond.jpeg",
    "caption": "Water harvesting pond — catching every drop of rain",
    "category": "the-land"
  },
  {
    "file": "the-land/stone-pathway.jpeg",
    "caption": "Pathways that integrate function and beauty",
    "category": "the-land"
  },
  {
    "file": "the-land/farm-gathering.jpg",
    "caption": "Community gathers at the farm — knowledge grows when shared",
    "category": "the-land"
  },
  {
    "file": "the-land/farm-tour.mp4",
    "caption": "Walk through the farm: see the systems in action",
    "category": "the-land"
  },

  // ── 🌱 Prepare ──────────────────────────────────────────────
  // Building soil, cover crops, green manure — feeding the earth first
  {
    "file": "prepare/cover-crops.jpeg",
    "caption": "Cover crops protect and nourish the soil between seasons",
    "category": "prepare"
  },
  {
    "file": "prepare/mulch-rows-overview.jpeg",
    "caption": "Mulch rings protect young trees — building soil one layer at a time",
    "category": "prepare"
  },

  // ── 🪴 Plant ────────────────────────────────────────────────
  // Seedlings, nursery, establishing trees — new life begins
  {
    "file": "plant/shade-net-nursery-rows.jpeg",
    "caption": "Tomato and brinjal rows growing under the shade net nursery",
    "category": "plant"
  },
  {
    "file": "plant/tree-saplings.jpg",
    "caption": "Young saplings establishing along the farm boundary",
    "category": "plant"
  },
  {
    "file": "plant/onion-sprouts.jpg",
    "caption": "Onion shoots emerging from freshly prepared beds",
    "category": "plant"
  },

  // ── 🌿 Nurture ──────────────────────────────────────────────
  // Growing crops, food forest thriving, polyculture in action
  {
    "file": "nurture/vegetable-beds.jpeg",
    "caption": "Polyculture beds with drip irrigation — diversity is resilience",
    "category": "nurture"
  },
  {
    "file": "nurture/carrot-field.jpg",
    "caption": "Dense carrot beds thriving in open-field polyculture",
    "category": "nurture"
  },
  {
    "file": "nurture/guava-orchard.jpg",
    "caption": "Guava orchard fruiting in the food forest",
    "category": "nurture"
  },
  {
    "file": "nurture/fruit-tree.jpeg",
    "caption": "Fruit trees establishing their canopy in the food forest",
    "category": "nurture"
  },
  {
    "file": "nurture/pomegranate.jpeg",
    "caption": "Pomegranate forming on a young tree — patience rewarded",
    "category": "nurture"
  },
  {
    "file": "nurture/mulch-coir-rings.jpeg",
    "caption": "Coir mulch rings and straw around young saplings — moisture locked in",
    "category": "nurture"
  },
  {
    "file": "nurture/shade-net-cauliflower-rows.jpeg",
    "caption": "Cauliflower seedlings thriving in rows under the shade net nursery",
    "category": "nurture"
  },

  // ── 🌾 Harvest ──────────────────────────────────────────────
  // The abundance that comes from working with nature
  {
    "file": "harvest/carrot-chickpea-harvest.jpeg",
    "caption": "Fresh-pulled carrot and chickpea — straight from the soil to hand",
    "category": "harvest"
  },
  {
    "file": "harvest/fresh-harvest.jpeg",
    "caption": "Abundant harvest: carrots, greens, cauliflower, radishes",
    "category": "harvest"
  },
  {
    "file": "harvest/winter-harvest.jpeg",
    "caption": "Winter harvest: peas, tomatoes, brinjal, and fresh greens",
    "category": "harvest"
  },
  {
    "file": "harvest/morning-harvest-greens.jpeg",
    "caption": "Fresh from the field: beans, methi, tomatoes, and leafy greens",
    "category": "harvest"
  },

  // ── ✂️ Tend ──────────────────────────────────────────────────
  // Pruning, maintenance, seasonal care — closing the loop
  {
    "file": "tend/moringa-before-pruning.jpeg",
    "caption": "Moringa grove before seasonal pruning — full canopy",
    "category": "tend"
  },
  {
    "file": "tend/moringa-pruned.jpeg",
    "caption": "Moringa after winter pruning — ready for spring regrowth",
    "category": "tend"
  }
];
