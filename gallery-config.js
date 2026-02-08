// ============================================================
//  GALLERY CONFIGURATION
//  To add a new photo or video, see HOW-TO-ADD-PHOTOS.txt
//
//  Each item has: file, caption, and category.
//  Categories control how the gallery is grouped on the page.
//  Current categories (in display order):
//    "The Farm"          — overview, infrastructure, pathways, community
//    "Food Forest & Trees" — orchards, fruit trees, saplings, bamboo
//    "Growing & Harvest"  — vegetables, crops, nursery, harvests
// ============================================================

const galleryCategories = [
  { id: "the-farm",       label: "The Farm" },
  { id: "food-forest",    label: "Food Forest & Trees" },
  { id: "growing-harvest", label: "Growing & Harvest" }
];

const galleryItems = [
  // ── The Farm ──────────────────────────────────────────────
  {
    "file": "farm-aerial-view.jpeg",
    "caption": "Bird's eye view of the farm with winding stone pathways",
    "category": "the-farm"
  },
  {
    "file": "farm-pond.jpeg",
    "caption": "Water harvesting pond with stone-lined edges",
    "category": "the-farm"
  },
  {
    "file": "stone-pathway.jpeg",
    "caption": "Sustainable pathways integrate function and beauty",
    "category": "the-farm"
  },
  {
    "file": "farm-gathering.jpg",
    "caption": "Sharing a meal and conversation at the farm",
    "category": "the-farm"
  },
  {
    "file": "farm-tour.mp4",
    "caption": "Farm tour: see our systems in action",
    "category": "the-farm"
  },

  // ── Food Forest & Trees ───────────────────────────────────
  {
    "file": "guava-orchard.jpg",
    "caption": "Guava trees with early fruit buds in the food forest",
    "category": "food-forest"
  },
  {
    "file": "fruit-tree.jpeg",
    "caption": "Fruit trees establishing in our food forest",
    "category": "food-forest"
  },
  {
    "file": "pomegranate.jpeg",
    "caption": "Pomegranate developing on young tree",
    "category": "food-forest"
  },
  {
    "file": "tree-saplings.jpg",
    "caption": "Young saplings growing along the farm boundary",
    "category": "food-forest"
  },
  {
    "file": "bamboo-closeup.jpg",
    "caption": "Golden bamboo growing on the farm",
    "category": "food-forest"
  },

  // ── Growing & Harvest ─────────────────────────────────────
  {
    "file": "cover-crops.jpeg",
    "caption": "Thriving cover crops enrich the soil naturally",
    "category": "growing-harvest"
  },
  {
    "file": "green-manure.jpeg",
    "caption": "Green manure establishing in early season",
    "category": "growing-harvest"
  },
  {
    "file": "carrot-field.jpg",
    "caption": "Dense carrot beds thriving in open-field polyculture",
    "category": "growing-harvest"
  },
  {
    "file": "onion-sprouts.jpg",
    "caption": "Young onion shoots emerging from freshly prepared beds",
    "category": "growing-harvest"
  },
  {
    "file": "vegetable-beds.jpeg",
    "caption": "Polyculture beds with drip irrigation",
    "category": "growing-harvest"
  },
  {
    "file": "greenhouse-seedlings.jpg",
    "caption": "Seedlings growing inside the shade net nursery",
    "category": "growing-harvest"
  },
  {
    "file": "harvest-bowls.jpg",
    "caption": "Morning harvest: fresh carrots, greens, herbs, and spinach",
    "category": "growing-harvest"
  },
  {
    "file": "fresh-harvest.jpeg",
    "caption": "Abundant natural harvest: carrots, greens, cauliflower, radishes",
    "category": "growing-harvest"
  }
];
