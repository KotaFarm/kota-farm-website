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
    "images": ["gallery/fresh-produce/veg-brinjal.jpeg"],
    "season": "Year-round",
    "unit": "kg",
    "desc": "Sturdy plants raised organically. Glossy purple fruits perfect for bhartha, bharta, and curries.",
    "available": false
  },
  {
    "name": "Tomato",
    "nameHi": "टमाटर",
    "images": ["gallery/fresh-produce/veg-tomato.jpeg", "gallery/fresh-produce/tomato1.jpeg", "gallery/fresh-produce/veg-tomato-plants.jpeg", { "type": "video", "src": "gallery/fresh-produce/veg-tomato-video.mp4" }],
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
  }
];
