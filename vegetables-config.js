// Vegetables available from Kota Natural Farm
// Edit this file to add/remove vegetables or update availability
// Use "images" array for multiple photos; single "image" string also works
// "unit" is used in the cart (kg, bunch, piece, etc.)
const vegetablesList = [
  {
    "name": "Cauliflower",
    "nameHi": "फूलगोभी",
    "images": ["gallery/fresh-produce/veg-cauliflower.jpeg"],
    "season": "Winter",
    "unit": "piece",
    "desc": "Grown naturally under shade nets without chemicals. Firm, white heads with a sweet, nutty flavour.",
    "available": false
  },
  {
    "name": "Brinjal",
    "nameHi": "बैंगन",
    "images": ["gallery/fresh-produce/brinjal.jpeg", "gallery/fresh-produce/veg-brinjal.jpeg"],
    "season": "Year-round",
    "unit": "kg",
    "desc": "Sturdy plants raised organically. Glossy purple fruits perfect for bhartha, bharta, and curries.",
    "available": true
  },
  {
    "name": "Tomato",
    "nameHi": "टमाटर",
    "images": ["gallery/fresh-produce/tomato2.jpeg", "gallery/fresh-produce/tomato3.jpeg", "gallery/fresh-produce/veg-tomato.jpeg", "gallery/fresh-produce/tomato1.jpeg", "gallery/fresh-produce/veg-tomato-plants.jpeg", { "type": "video", "src": "gallery/fresh-produce/veg-tomato-video.mp4" }],
    "season": "Winter",
    "unit": "kg",
    "desc": "Vine-ripened on bamboo stakes inside shade nets. No pesticides — just sun, soil, and care.",
    "available": true
  },
  {
    "name": "Coriander",
    "nameHi": "धनिया",
    "images": ["gallery/fresh-produce/veg-coriander.jpeg"],
    "season": "Winter",
    "unit": "bunch",
    "desc": "Fresh, fragrant bunches grown with sprinkler irrigation. Harvested same-day for maximum flavour.",
    "available": false
  },
  {
    "name": "Bitter Gourd",
    "nameHi": "करेला",
    "images": ["gallery/fresh-produce/karela.jpeg"],
    "season": "Summer / Monsoon",
    "unit": "kg",
    "desc": "Organically grown on shade-net trellises. Bumpy, dark-green fruits rich in nutrients and prized in traditional cooking.",
    "available": false
  },
  {
    "name": "Ridge Gourd",
    "nameHi": "तोरई",
    "images": ["gallery/fresh-produce/vegiie.jpeg"],
    "season": "Summer / Monsoon",
    "unit": "kg",
    "desc": "Long, tender ridge gourds climbing naturally on trellises. Harvested young for the best texture and flavour.",
    "available": false
  },
  {
    "name": "Potato",
    "nameHi": "आलू",
    "images": ["gallery/fresh-produce/potato.jpeg"],
    "season": "Winter",
    "unit": "kg",
    "desc": "Naturally grown potatoes from healthy, chemical-free soil. Firm and flavourful — perfect for curries, parathas, and roasts.",
    "available": true
  },
  {
    "name": "Green Chickpea",
    "nameHi": "हरा चना",
    "images": ["gallery/fresh-produce/Green chickpea.jpeg"],
    "season": "Winter",
    "unit": "kg",
    "desc": "Fresh green chickpeas are the young, tender form of chickpeas harvested before they dry. Mildly sweet, nutty flavour with a soft crunchy texture. Rich in plant protein, fiber, and essential minerals.",
    "available": true
  },
  {
    "name": "Beetroot",
    "nameHi": "चुकंदर",
    "images": ["gallery/fresh-produce/Beetroot.jpeg"],
    "season": "Winter",
    "unit": "kg",
    "desc": "Nutrient-rich root vegetable with a deep red colour and naturally sweet, earthy taste. Packed with antioxidants, fiber, and natural nitrates that support heart health and stamina.",
    "available": true
  }
];
