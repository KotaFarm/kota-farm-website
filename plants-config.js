// ============================================================
//  PLANTS / WHAT'S GROWING
//  Species we work with and their permaculture value.
//  Edit this file to add or change plants. No nav link—section
//  appears between Practices and Gallery (discover by scrolling).
// ============================================================

const plantsList = [
  { name: "Yellow Bamboo", category: "Non-Fruit", importance: "High permaculture value; fast-growing; excellent for windbreaks and biomass production." },
  { name: "Desi Green Bamboo", category: "Non-Fruit", importance: "Good for erosion control and fencing; multipurpose; moderate native rating." },
  { name: "Neem", category: "Non-Fruit", importance: "High native value; excellent for pest control, shade, and organic pest repellent." },
  { name: "Grafted Amla", category: "Fruit", importance: "Good for nutrition and market value; drought-tolerant; moderate permaculture rating." },
  { name: "Bel Tree (Madhumati, Amrud, Chameli)", category: "Fruit", importance: "Native; medicinal and religious importance; excellent for biodiversity and shade." },
  { name: "Mulberries", category: "Fruit", importance: "Bird-attracting; suitable for food forest layer; good drought resilience." },
  { name: "Kadam", category: "Non-Fruit", importance: "Supports biodiversity; shade provider; high water needs initially." },
  { name: "Sissam", category: "Non-Fruit", importance: "Native timber tree; nitrogen fixer; excellent for agroforestry integration." },
  { name: "Kachnar", category: "Non-Fruit", importance: "Edible flowers; good for biodiversity and soil improvement; native species." },
  { name: "Karanj", category: "Non-Fruit", importance: "Native oilseed tree; nitrogen fixer; good for degraded soil regeneration." },
  { name: "Kadhi Patta", category: "Non-Fruit", importance: "Highly useful for culinary use; can be maintained as hedge; semi-native." },
  { name: "Anjeer", category: "Fruit", importance: "Moderate drought tolerance; marketable fruit; suitable for Zone 2 orchard." },
  { name: "Papita", category: "Fruit", importance: "Short lifecycle; fast fruiting; moderate soil fertility needs." },
  { name: "Mahogany", category: "Timber", importance: "High-value timber; slow growing; long-term investment." },
  { name: "Lichi", category: "Fruit", importance: "Delicate in hot summers; needs shade; adds diversity to the food forest." },
  { name: "Morchali", category: "Fruit", importance: "Rare fruit; useful for diversity; adaptively native to some dry zones." },
  { name: "Lemon", category: "Fruit", importance: "Pollinator attraction, vitamin C rich; can act as wind barrier." },
  { name: "Pomegranate", category: "Fruit", importance: "Drought-tolerant; fits food forest and orchard layers." },
  { name: "Red Apple Ber", category: "Fruit", importance: "Hardy; supports local birdlife and food forest diversity." },
  { name: "Mandarin", category: "Fruit", importance: "Citrus layer; vitamin C; supports pollinators." },
  { name: "Guava", category: "Fruit", importance: "Fruit tree; supports local birdlife; good survival in mixed systems." },
  { name: "Moringa", category: "Medicinal", importance: "Nitrogen fixer; edible leaves; drought tolerant; multi-use." },
  { name: "Jackfruit", category: "Fruit", importance: "Canopy layer; high yield; staple in food forest design." },
  { name: "Avocado", category: "Fruit", importance: "Adds diversity; needs careful siting in hot climates." },
  { name: "Mango", category: "Fruit", importance: "Classic canopy tree; shade; high value for food and biodiversity." }
];
