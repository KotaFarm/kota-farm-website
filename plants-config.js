// ============================================================
//  PLANTS / WHAT'S GROWING
//  location = display names: Native Forest Section, Companion Trees, Boundary, Food Forest.
//  standing = quantity (bubble size). category = type (Fruit, etc.).
// ============================================================

const plantsList = [
  { name: "Yellow Bamboo", location: "Native Forest Section", category: "Non-Fruit", standing: 1, importance: "High permaculture value; fast-growing; excellent for windbreaks and biomass production." },
  { name: "Desi Green Bamboo", location: "Native Forest Section", category: "Non-Fruit", standing: 1, importance: "Good for erosion control and fencing; multipurpose; moderate native rating." },
  { name: "Neem", location: "Native Forest Section", category: "Non-Fruit", standing: 5, importance: "High native value; excellent for pest control, shade, and organic pest repellent." },
  { name: "Grafted Amla", location: "Native Forest Section", category: "Fruit", standing: 8, importance: "Good for nutrition and market value; drought-tolerant; moderate permaculture rating." },
  { name: "Bel Tree (Madhumati, Amrud, Chameli)", location: "Native Forest Section", category: "Fruit", standing: 5, importance: "Native; medicinal and religious importance; excellent for biodiversity and shade." },
  { name: "Mulberries", location: "Native Forest Section", category: "Fruit", standing: 5, importance: "Bird-attracting; suitable for food forest layer; good drought resilience." },
  { name: "Kadam", location: "Native Forest Section", category: "Non-Fruit", standing: 5, importance: "Supports biodiversity; shade provider; high water needs initially." },
  { name: "Sissam", location: "Native Forest Section", category: "Non-Fruit", standing: 8, importance: "Native timber tree; nitrogen fixer; excellent for agroforestry integration." },
  { name: "Kachnar", location: "Native Forest Section", category: "Non-Fruit", standing: 8, importance: "Edible flowers; good for biodiversity and soil improvement; native species." },
  { name: "Karanj", location: "Native Forest Section", category: "Non-Fruit", standing: 8, importance: "Native oilseed tree; nitrogen fixer; good for degraded soil regeneration." },
  { name: "Anjeer", location: "Native Forest Section", category: "Fruit", standing: 7, importance: "Moderate drought tolerance; marketable fruit; suitable for Zone 2 orchard." },
  { name: "Morchali", location: "Native Forest Section", category: "Fruit", standing: 2, importance: "Rare fruit; useful for diversity; adaptively native to some dry zones." },
  { name: "Kadhi Patta", location: "Companion Trees", category: "Non-Fruit", standing: 4, importance: "Highly useful for culinary use; can be maintained as hedge; semi-native." },
  { name: "Papita", location: "Companion Trees", category: "Fruit", standing: 5, importance: "Short lifecycle; fast fruiting; moderate soil fertility needs." },
  { name: "Lichi", location: "Companion Trees", category: "Fruit", standing: 1, importance: "Delicate in hot summers; needs shade; adds diversity to the food forest." },
  { name: "Mahogany", location: "Boundary", category: "Timber", standing: 153, importance: "High-value timber; slow growing; long-term investment." },
  { name: "Lemon", location: "Food Forest", category: "Fruit", standing: 16, importance: "Pollinator attraction, vitamin C rich; can act as wind barrier." },
  { name: "Pomegranate", location: "Food Forest", category: "Fruit", standing: 11, importance: "Drought-tolerant; fits food forest and orchard layers." },
  { name: "Red Apple Ber", location: "Food Forest", category: "Fruit", standing: 14, importance: "Hardy; supports local birdlife and food forest diversity." },
  { name: "Mandarin", location: "Food Forest", category: "Fruit", standing: 17, importance: "Citrus layer; vitamin C; supports pollinators." },
  { name: "Guava", location: "Food Forest", category: "Fruit", standing: 44, importance: "Fruit tree; supports local birdlife; good survival in mixed systems." },
  { name: "Moringa", location: "Food Forest", category: "Medicinal", standing: 19, importance: "Nitrogen fixer; edible leaves; drought tolerant; multi-use." },
  { name: "Jackfruit", location: "Food Forest", category: "Fruit", standing: 2, importance: "Canopy layer; high yield; staple in food forest design." },
  { name: "Avocado", location: "Food Forest", category: "Fruit", standing: 1, importance: "Adds diversity; needs careful siting in hot climates." },
  { name: "Mango", location: "Food Forest", category: "Fruit", standing: 8, importance: "Classic canopy tree; shade; high value for food and biodiversity." }
];
