// Vegetables available from Kota Natural Farm
// Edit this file to add/remove vegetables or update availability
// Use "images" array for multiple photos; single "image" string also works
// "unit" is used in the cart (kg, bunch, piece, etc.)
const vegetablesList = [
  {
    "name": "Cauliflower",
    "nameHi": "फूलगोभी",
    "images": ["gallery/fresh-produce/veg-cauliflower.webp"],
    "season": "Winter",
    "unit": "piece",
    "desc": "Grown naturally under shade nets without chemicals. Firm, white heads with a sweet, nutty flavour.",
    "available": false,
    "nutrition": {
      "goodFor": ["🛡 Immunity", "🫁 Digestion", "🦴 Bone health", "🔥 Anti-inflammatory"],
      "per100g": [
        { "name": "Vitamin C", "value": "56mg",   "pct": 62, "note": "more than half your daily Vitamin C in one serving" },
        { "name": "Energy",    "value": "30 kcal", "pct": 2  },
        { "name": "Protein",   "value": "2.6g",    "pct": 5  },
        { "name": "Fibre",     "value": "0.9g",    "pct": 4  },
        { "name": "Iron",      "value": "1.2mg",   "pct": 7  }
      ],
      "didYouKnow": "Cauliflower is 92% water and only 30 calories per 100g — one of the most filling low-calorie vegetables you can eat.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Uttar Pradesh, Bihar, West Bengal, Odisha, Maharashtra",
      "exportMarkets": "UAE, Bangladesh, Nepal, United Kingdom, Malaysia",
      "position": "India is the world's 2nd largest cauliflower producer (after China), contributing ~35% of global output",
      "bestSeason": "October to February (Rabi crop) — peak quality and availability at Kota Farm during this window",
      "organicAdvantage": "Conventionally grown cauliflower ranks among the most pesticide-retentive vegetables. Organically grown heads are free from synthetic residues and richer in natural antioxidants.",
      "source": "APEDA 2024–25 · FAO World Vegetable Production Statistics"
    }
  },
  {
    "name": "Brinjal",
    "nameHi": "बैंगन",
    "images": ["gallery/fresh-produce/brinjal.webp", "gallery/fresh-produce/veg-brinjal.webp"],
    "season": "Year-round",
    "unit": "kg",
    "desc": "Sturdy plants raised organically. Glossy purple fruits perfect for bhartha, bharta, and curries.",
    "available": false,
    "nutrition": {
      "goodFor": ["❤️ Heart health", "🧠 Brain", "🫁 Digestion", "⚖️ Weight management"],
      "per100g": [
        { "name": "Energy",  "value": "24 kcal", "pct": 1  },
        { "name": "Protein", "value": "1.4g",    "pct": 3  },
        { "name": "Fibre",   "value": "1.3g",    "pct": 5  },
        { "name": "Iron",    "value": "0.9mg",   "pct": 5  },
        { "name": "Calcium", "value": "18mg",    "pct": 2  }
      ],
      "didYouKnow": "The deep purple skin of brinjal contains nasunin — a rare antioxidant that protects brain cell membranes from damage.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "West Bengal, Odisha, Karnataka, Bihar, Maharashtra, Andhra Pradesh",
      "exportMarkets": "United Kingdom, UAE, Malaysia, USA, Canada (primarily Indian diaspora markets)",
      "position": "India is the world's 2nd largest brinjal producer after China, producing over 13 million tonnes annually",
      "bestSeason": "Year-round availability — summer and monsoon months bring peak yield at Kota Farm",
      "organicAdvantage": "Brinjal is a known pesticide-accumulator in conventional farming. Organically grown brinjal retains the natural nasunin antioxidant in its skin without chemical contamination.",
      "source": "APEDA 2024–25 · FAO World Vegetable Production Statistics"
    }
  },
  {
    "name": "Tomato",
    "nameHi": "टमाटर",
    "images": ["gallery/fresh-produce/tomato2.webp", "gallery/fresh-produce/tomato3.webp", "gallery/fresh-produce/veg-tomato.webp", "gallery/fresh-produce/tomato1.webp", "gallery/fresh-produce/veg-tomato-plants.webp", { "type": "video", "src": "gallery/fresh-produce/veg-tomato-video.mp4" }],
    "season": "Winter",
    "unit": "kg",
    "desc": "Vine-ripened on bamboo stakes inside shade nets. No pesticides — just sun, soil, and care.",
    "available": false,
    "nutrition": {
      "goodFor": ["❤️ Heart health", "✨ Skin", "🛡 Immunity", "🔬 Anti-oxidant"],
      "per100g": [
        { "name": "Vitamin C",  "value": "27mg",   "pct": 30, "note": "30% of daily Vitamin C in just one medium tomato" },
        { "name": "Energy",     "value": "20 kcal", "pct": 1  },
        { "name": "Vitamin A",  "value": "54 µg",   "pct": 6  },
        { "name": "Fibre",      "value": "0.8g",    "pct": 3  },
        { "name": "Potassium",  "value": "237mg",   "pct": 5  }
      ],
      "didYouKnow": "Tomatoes are one of the best dietary sources of lycopene — a powerful antioxidant linked to reduced risk of heart disease. Cooked tomatoes actually release more lycopene than raw.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Andhra Pradesh, Madhya Pradesh, Karnataka, Gujarat, Odisha",
      "exportMarkets": "Bangladesh, Nepal, UAE, Oman, Sri Lanka, Malaysia",
      "position": "India is the world's 2nd largest tomato producer, contributing ~11% of global output. Tomatoes are among India's top 5 vegetable exports by value.",
      "bestSeason": "November to February (Rabi crop) — peak sweetness and firmness from Kota Farm shade-net growing",
      "organicAdvantage": "Organically grown tomatoes show significantly higher lycopene and Vitamin C content compared to conventionally farmed ones — a direct result of slower, natural ripening in healthy soil.",
      "source": "APEDA 2024–25 · FAO World Vegetable Production Statistics"
    }
  },
  {
    "name": "Coriander",
    "nameHi": "धनिया",
    "images": ["gallery/fresh-produce/veg-coriander.webp"],
    "season": "Winter",
    "unit": "bunch",
    "desc": "Fresh, fragrant bunches grown with sprinkler irrigation. Harvested same-day for maximum flavour.",
    "available": false,
    "nutrition": {
      "goodFor": ["🛡 Immunity", "🫁 Digestion", "🦴 Bone health", "🧹 Detox"],
      "per100g": [
        { "name": "Vitamin C", "value": "135mg",  "pct": 150, "note": "one small bunch covers your full day's Vitamin C" },
        { "name": "Vitamin A", "value": "337 µg",  "pct": 37  },
        { "name": "Calcium",   "value": "184mg",   "pct": 18  },
        { "name": "Iron",      "value": "1.4mg",   "pct": 8   },
        { "name": "Energy",    "value": "44 kcal", "pct": 2   }
      ],
      "didYouKnow": "Fresh coriander leaves have more Vitamin C than oranges, gram for gram — and contain iron and calcium that are often missing from Indian vegetarian diets.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Rajasthan, Madhya Pradesh, Gujarat, Uttar Pradesh, Andhra Pradesh",
      "exportMarkets": "China, Malaysia, UAE, Saudi Arabia, Nepal, Egypt, USA",
      "position": "India is the world's largest coriander producer with 68% of global output. In 2023–24, India exported 97.7 million kg worth USD 95.9 million.",
      "bestSeason": "November to February (Rabi crop) — Rajasthan climate produces the most aromatic and tender coriander during this period",
      "organicAdvantage": "Coriander absorbs pesticides readily through its leaves. Organically grown coriander is especially important — it is typically consumed raw, where residues have no chance to break down.",
      "source": "APEDA 2024–25 · SEAIR Coriander Export Data 2023–24"
    }
  },
  {
    "name": "Bitter Gourd",
    "nameHi": "करेला",
    "images": ["gallery/fresh-produce/karela.webp"],
    "season": "Summer / Monsoon",
    "unit": "kg",
    "desc": "Organically grown on shade-net trellises. Bumpy, dark-green fruits rich in nutrients and prized in traditional cooking.",
    "available": false,
    "nutrition": {
      "goodFor": ["🩸 Blood sugar", "🫁 Digestion", "🛡 Immunity", "🫀 Liver health"],
      "per100g": [
        { "name": "Vitamin C", "value": "88mg",   "pct": 98, "note": "almost your entire daily Vitamin C in one serving" },
        { "name": "Vitamin A", "value": "126 µg",  "pct": 14 },
        { "name": "Fibre",     "value": "1.7g",    "pct": 7  },
        { "name": "Iron",      "value": "0.6mg",   "pct": 4  },
        { "name": "Energy",    "value": "17 kcal", "pct": 1  }
      ],
      "didYouKnow": "Bitter gourd contains charantin and momordicin — plant compounds scientifically studied for their ability to help regulate blood sugar, making it a staple in Ayurvedic medicine.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Odisha, West Bengal, Uttar Pradesh, Andhra Pradesh, Kerala, Tamil Nadu",
      "exportMarkets": "United Kingdom, UAE, USA, Canada, Malaysia (Indian and South Asian diaspora markets)",
      "position": "India is one of Asia's top bitter gourd producers. Exports are niche but growing, driven by diaspora demand in the UK, USA and Gulf countries.",
      "bestSeason": "June to September (Kharif / monsoon season) — warm, humid conditions at Kota Farm bring the best yield",
      "organicAdvantage": "Bitter gourd's thin, bumpy skin makes it highly susceptible to pesticide absorption. Organically grown karela is especially valued in Ayurvedic use where the whole fruit — including skin — is consumed.",
      "source": "APEDA 2024–25 · Indiastat Bitter Gourd Production Data"
    }
  },
  {
    "name": "Ridge Gourd",
    "nameHi": "तोरई",
    "images": ["gallery/fresh-produce/vegiie.webp"],
    "season": "Summer / Monsoon",
    "unit": "kg",
    "desc": "Long, tender ridge gourds climbing naturally on trellises. Harvested young for the best texture and flavour.",
    "available": false,
    "nutrition": {
      "goodFor": ["⚖️ Weight management", "🫁 Digestion", "🌡 Cooling", "✨ Skin"],
      "per100g": [
        { "name": "Energy",    "value": "17 kcal", "pct": 1 },
        { "name": "Protein",   "value": "0.5g",    "pct": 1 },
        { "name": "Fibre",     "value": "0.5g",    "pct": 2 },
        { "name": "Calcium",   "value": "18mg",    "pct": 2 },
        { "name": "Iron",      "value": "0.4mg",   "pct": 2 }
      ],
      "didYouKnow": "Ridge gourd is 95% water, making it one of the most hydrating vegetables available — ideal during hot Indian summers for natural cooling and digestion support.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "West Bengal, Odisha, Uttar Pradesh, Karnataka, Tamil Nadu, Bihar",
      "exportMarkets": "UAE, United Kingdom, Malaysia (diaspora markets) — primarily domestic consumption crop",
      "position": "Ridge gourd is mainly a domestic crop. India is a leading producer in Asia but exports remain limited. It is a summer staple across Indian households.",
      "bestSeason": "June to September (Kharif / monsoon season) — trellis-grown at Kota Farm for best yield and tenderness",
      "organicAdvantage": "Ridge gourd's delicate skin absorbs pesticides easily. Organically grown turai retains its natural cooling properties without chemical residues — especially important as it is commonly given to children and the elderly.",
      "source": "APEDA 2024–25 · FAO World Vegetable Production Statistics"
    }
  },
  {
    "name": "Potato",
    "nameHi": "आलू",
    "images": ["gallery/fresh-produce/potato.webp"],
    "season": "Winter",
    "unit": "kg",
    "desc": "Naturally grown potatoes from healthy, chemical-free soil. Firm and flavourful — perfect for curries, parathas, and roasts.",
    "available": false,
    "nutrition": {
      "goodFor": ["⚡ Energy", "❤️ Heart health", "🛡 Immunity", "🧠 Brain"],
      "per100g": [
        { "name": "Vitamin C",  "value": "17mg",   "pct": 19, "note": "good source of Vitamin C, often overlooked in potatoes" },
        { "name": "Energy",     "value": "97 kcal", "pct": 5  },
        { "name": "Potassium",  "value": "429mg",   "pct": 9  },
        { "name": "Protein",    "value": "1.6g",    "pct": 3  },
        { "name": "Vitamin B6", "value": "0.3mg",   "pct": 18 }
      ],
      "didYouKnow": "Potatoes are one of the best plant sources of potassium — more than bananas per serving — which plays a key role in regulating blood pressure.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Uttar Pradesh, West Bengal, Bihar, Gujarat, Punjab",
      "exportMarkets": "Bangladesh, Nepal, Malaysia, UAE, Sri Lanka, Bhutan",
      "position": "India is the world's 3rd largest potato producer with ~55 million tonnes annually. Potatoes are among India's top 5 vegetable exports, contributing significantly to the APEDA basket.",
      "bestSeason": "October to March (Rabi crop) — Kota Farm's cool winter soil produces firm, high-dry-matter potatoes ideal for cooking",
      "organicAdvantage": "Potatoes are typically grown with heavy chemical fertilisers. Organically grown potatoes from mineral-rich soil have a superior taste, thinner skin, and a higher proportion of nutrients — particularly Vitamin C and potassium.",
      "source": "APEDA 2024–25 · FAO World Potato Production Statistics"
    }
  },
  {
    "name": "Green Chickpea",
    "nameHi": "हरा चना",
    "images": ["gallery/fresh-produce/Green chickpea.webp", "gallery/fresh-produce/green chana 1.webp", "gallery/fresh-produce/WhatsApp Image 2026-03-12 at 18.52.16.webp"],
    "season": "Winter",
    "unit": "kg",
    "desc": "Fresh green chickpeas are the young, tender form of chickpeas harvested before they dry. Mildly sweet, nutty flavour with a soft crunchy texture. Rich in plant protein, fiber, and essential minerals.",
    "available": false,
    "nutrition": {
      "goodFor": ["💪 Protein", "⚡ Energy", "❤️ Heart health", "🫁 Digestion"],
      "per100g": [
        { "name": "Protein", "value": "7g",      "pct": 14, "note": "one of the highest plant-protein fresh vegetables available" },
        { "name": "Fibre",   "value": "5g",       "pct": 20 },
        { "name": "Folate",  "value": "170 µg",   "pct": 43 },
        { "name": "Iron",    "value": "2.1mg",    "pct": 12 },
        { "name": "Energy",  "value": "100 kcal", "pct": 5  }
      ],
      "didYouKnow": "Fresh green chickpeas have 7x more protein than most other vegetables — a complete snack that also provides 43% of your daily folate, critical for cell repair and pregnancy health.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Rajasthan, Madhya Pradesh, Maharashtra, Uttar Pradesh, Karnataka",
      "exportMarkets": "USA, UAE, United Kingdom, Bhutan, Singapore (fresh and processed)",
      "position": "India is the world's largest chickpea producer, accounting for ~70% of global output. Fresh green chickpea (hara chana) is a seasonal winter speciality with growing export demand.",
      "bestSeason": "January to February (late Rabi) — harvested before drying for the fresh green form. A short but prized window at Kota Farm.",
      "organicAdvantage": "Green chickpeas grown organically in legume-rich soil fix their own nitrogen, producing a more nutrient-dense and flavourful crop without synthetic fertilisers — better protein and deeper flavour.",
      "source": "APEDA 2024–25 · FAO Chickpea Production Statistics"
    }
  },
  {
    "name": "Carrot",
    "nameHi": "गाजर",
    "images": ["gallery/fresh-produce/carrot.webp"],
    "season": "Winter",
    "unit": "kg",
    "desc": "Sweet, crunchy carrots grown in healthy soil without chemicals. Rich in beta-carotene and perfect for salads, juices, and cooking.",
    "available": false,
    "nutrition": {
      "goodFor": ["👁 Eyesight", "🛡 Immunity", "✨ Skin", "❤️ Heart"],
      "per100g": [
        { "name": "Vitamin A", "value": "2,100 µg", "pct": 233, "note": "one carrot covers your full day" },
        { "name": "Energy",    "value": "48 kcal",  "pct": 2  },
        { "name": "Fibre",     "value": "1.2g",     "pct": 5  },
        { "name": "Calcium",   "value": "80mg",     "pct": 8  },
        { "name": "Iron",      "value": "1mg",      "pct": 6  }
      ],
      "didYouKnow": "Just one medium carrot gives you more than twice your full day's Vitamin A — making it one of the most nutrient-dense vegetables per calorie.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Uttar Pradesh, Punjab, Rajasthan, Haryana, Karnataka",
      "exportMarkets": "UAE, United Kingdom, Malaysia, Qatar, Bangladesh",
      "position": "Net exporter — produces ~1.4 million tonnes annually, ranking among Asia's top 5 carrot producers",
      "bestSeason": "October to February (Rabi crop) — peak flavour and availability at Kota Farm during this window",
      "organicAdvantage": "Chemically farmed carrots lose nutrients to synthetic fertiliser runoff. Organic soil retains minerals and promotes natural beta-carotene development — more flavour, more nutrition.",
      "source": "APEDA 2024–25 · Ministry of Agriculture Horticultural Statistics"
    }
  },
  {
    "name": "Corn",
    "nameHi": "मक्का",
    "images": ["gallery/fresh-produce/WhatsApp Image 2026-04-09 at 02.14.50.webp", "gallery/fresh-produce/WhatsApp Image 2026-04-11 at 22.50.25.webp"],
    "season": "Summer / Monsoon",
    "unit": "piece",
    "desc": "Sweet, tender corn grown naturally at Kota Farm. Harvested at peak ripeness for maximum sweetness — perfect for roasting, boiling, or eating fresh off the cob.",
    "available": false,
    "nutrition": {
      "goodFor": ["⚡ Energy", "👁 Eyesight", "🫁 Digestion", "💪 Muscle health"],
      "per100g": [
        { "name": "Energy",    "value": "86 kcal", "pct": 4,  "note": "steady energy from complex carbohydrates" },
        { "name": "Fibre",     "value": "2.4g",    "pct": 10 },
        { "name": "Vitamin C", "value": "6.8mg",   "pct": 8  },
        { "name": "Lutein",    "value": "644 µg",  "pct": 46, "note": "key antioxidant for eye protection against blue light" },
        { "name": "Protein",   "value": "3.3g",    "pct": 7  }
      ],
      "didYouKnow": "Corn is one of the richest vegetable sources of lutein and zeaxanthin — two antioxidants that protect the eyes from age-related damage and blue light exposure.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Madhya Pradesh, Karnataka, Rajasthan, Bihar, Andhra Pradesh, Uttar Pradesh",
      "exportMarkets": "Bangladesh, Nepal, Vietnam, Malaysia, UAE — both fresh and processed corn",
      "position": "India is the 7th largest maize producer globally with ~35 million tonnes annually. Sweet corn for fresh consumption is a growing segment, especially in urban and export markets.",
      "bestSeason": "June to September (Kharif / monsoon season) — monsoon warmth at Kota Farm brings naturally sweet, juicy cobs",
      "organicAdvantage": "Corn is a heavy feeder crop that accumulates synthetic fertiliser residues in conventional farming. Organically grown corn from compost-rich soil develops more natural sugars and a cleaner flavour profile.",
      "source": "APEDA 2024–25 · FAO World Maize Production Statistics"
    }
  },
  {
    "name": "Beetroot",
    "nameHi": "चुकंदर",
    "images": ["gallery/fresh-produce/beet root 1.webp", "gallery/fresh-produce/Beetroot.webp"],
    "season": "Winter",
    "unit": "kg",
    "desc": "Nutrient-rich root vegetable with a deep red colour and naturally sweet, earthy taste. Packed with antioxidants, fiber, and natural nitrates that support heart health and stamina.",
    "available": false,
    "nutrition": {
      "goodFor": ["❤️ Heart health", "🏃 Stamina", "🩸 Blood health", "🫁 Digestion"],
      "per100g": [
        { "name": "Folate",  "value": "109 µg",  "pct": 27, "note": "key for cell growth, DNA repair, and pregnancy health" },
        { "name": "Fibre",   "value": "2.8g",    "pct": 11 },
        { "name": "Energy",  "value": "43 kcal", "pct": 2  },
        { "name": "Protein", "value": "1.7g",    "pct": 3  },
        { "name": "Iron",    "value": "0.8mg",   "pct": 5  }
      ],
      "didYouKnow": "Beetroot's deep red colour comes from betalains — natural nitrates that have been shown to improve blood flow, lower blood pressure, and boost athletic endurance by up to 16%.",
      "source": "ICMR-NIN Indian Food Composition Tables 2017"
    },
    "indiaContext": {
      "producingStates": "Uttar Pradesh, Bihar, Haryana, Punjab, Maharashtra, West Bengal",
      "exportMarkets": "UAE, United Kingdom, Oman, Malaysia, Qatar (Indian diaspora and Gulf markets)",
      "position": "India produces approximately 500,000 tonnes of beetroot annually. Exports are primarily fresh and as beetroot powder, with growing demand in the Middle East and UK.",
      "bestSeason": "November to February (Rabi crop) — cool winter soil at Kota Farm develops the sweetest, most deeply coloured roots",
      "organicAdvantage": "Beetroot draws minerals deeply from the soil — making soil quality critical. Organically grown beetroot from mineral-rich earth has higher betalain content, deeper colour, and more natural sweetness than chemically forced crops.",
      "source": "APEDA 2024–25 · Ministry of Agriculture Horticultural Statistics"
    }
  }
];
