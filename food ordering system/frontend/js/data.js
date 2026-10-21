/**
 * Mock data & fallback catalog for Food Ordering System
 * Localized in Indian Rupee (₹) with distinct high-quality food photography for each menu item.
 */

const SAMPLE_RESTAURANTS = [
    {
        id: 1,
        name: "Trattoria Bella Italia & Woodfire",
        cuisine: "Italian",
        description: "Authentic wood-fired Neapolitan sourdough pizzas, slow-simmered hand-cut pasta, truffle burrata & classic Venetian tiramisu.",
        address: "12 Indiranagar 100ft Road, Bengaluru",
        phone: "+91 98450 12345",
        imageUrl: "images/pizza.jpg",
        rating: 4.9,
        reviewsCount: 428,
        deliveryTime: "20-30 min",
        deliveryFee: 49.00,
        minOrder: 299.00,
        featured: true,
        tags: ["Pizza", "Pasta", "Italian", "Dessert", "Gourmet"]
    },
    {
        id: 2,
        name: "Smokey Yard Burgers & Smokehouse",
        cuisine: "American",
        description: "Prime Angus smashed patties, hickory-smoked bacon, melted Wisconsin cheddar on toasted brioche & loaded truffle fries.",
        address: "44 Church Street, Central Business District, Bengaluru",
        phone: "+91 98450 54321",
        imageUrl: "images/burger.jpg",
        rating: 4.9,
        reviewsCount: 560,
        deliveryTime: "20-30 min",
        deliveryFee: 39.00,
        minOrder: 249.00,
        featured: true,
        tags: ["Burgers", "Fast Food", "American", "Sides", "BBQ"]
    },
    {
        id: 3,
        name: "Tokyo Sakura Sushi & Ramen",
        cuisine: "Japanese",
        description: "Fresh sashimi, handcrafted specialty rolls, rich tonkotsu ramen, and authentic Japanese teas.",
        address: "7th Main, Koramangala 4th Block, Bengaluru",
        phone: "+91 98450 90123",
        imageUrl: "images/sushi.jpg",
        rating: 4.7,
        reviewsCount: 289,
        deliveryTime: "30-40 min",
        deliveryFee: 59.00,
        minOrder: 399.00,
        featured: true,
        tags: ["Sushi", "Japanese", "Asian", "Ramen"]
    },
    {
        id: 4,
        name: "Spice Symphony - Royal Kitchen",
        cuisine: "Indian",
        description: "Rich Mughlai gravies, aromatic Dum Biryani, clay-oven tandoori delights, and soft garlic naan.",
        address: "88 Connaught Place, New Delhi",
        phone: "+91 98110 67890",
        imageUrl: "images/butter-chicken.jpg",
        rating: 4.9,
        reviewsCount: 680,
        deliveryTime: "25-40 min",
        deliveryFee: 49.00,
        minOrder: 299.00,
        featured: true,
        tags: ["Indian", "Curry", "Biryani", "North Indian"]
    },
    {
        id: 5,
        name: "La Fiesta Taqueria Mexicana",
        cuisine: "Mexican",
        description: "Crispy beef & cheese birria quesatacos with savory dipping broth, loaded nachos, and churros.",
        address: "21 Defense Colony, New Delhi",
        phone: "+91 98110 43210",
        imageUrl: "images/tacos.jpg",
        rating: 4.7,
        reviewsCount: 215,
        deliveryTime: "20-30 min",
        deliveryFee: 39.00,
        minOrder: 249.00,
        featured: false,
        tags: ["Mexican", "Tacos", "Street Food", "Spicy"]
    },
    {
        id: 6,
        name: "Verde Garden Bowls & Juices",
        cuisine: "Healthy",
        description: "Organic Mediterranean salad bowls, fresh avocado quinoa, and raw cold-pressed cold juices.",
        address: "15 Bandra West, Mumbai",
        phone: "+91 98200 34567",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 176,
        deliveryTime: "15-25 min",
        deliveryFee: 49.00,
        minOrder: 299.00,
        featured: false,
        tags: ["Healthy", "Salads", "Organic", "Vegan"]
    },
    {
        id: 7,
        name: "Golden Dragon Dim Sum & Wok",
        cuisine: "Chinese",
        description: "Handcrafted steamed crystal dumplings, crispy peking duck rolls, fiery Sichuan Dan Dan noodles & aromatic wok-tossed bowls.",
        address: "56 Lavelle Road, Central Bengaluru",
        phone: "+91 98450 78901",
        imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=700&q=80",
        rating: 4.9,
        reviewsCount: 412,
        deliveryTime: "25-35 min",
        deliveryFee: 49.00,
        minOrder: 299.00,
        featured: true,
        tags: ["Chinese", "Dim Sum", "Noodles", "Wok", "Asian"]
    },
    {
        id: 8,
        name: "Le Petit Paris Bakery & Patisserie",
        cuisine: "Bakery",
        description: "Artisanal French flaky butter croissants, Belgian chocolate eclairs, delicate fruit tarts & specialty cafe au lait.",
        address: "18 Indiranagar 12th Main, Bengaluru",
        phone: "+91 98450 67890",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
        rating: 4.8,
        reviewsCount: 380,
        deliveryTime: "15-25 min",
        deliveryFee: 39.00,
        minOrder: 199.00,
        featured: true,
        tags: ["Bakery", "Desserts", "Croissants", "French", "Cafe"]
    }
];

const SAMPLE_MENU_ITEMS = [
    // ── Bella Italia (id: 1) ──────────────────────────────────
    {
        id: 101,
        restaurantId: 1,
        name: "Wood-Fired Margherita D.O.P. Pizza",
        category: "Pizza",
        description: "San Marzano plum tomato sauce, melted buffalo mozzarella, fresh basil leaves, and cold-pressed extra virgin olive oil.",
        price: 349.00,
        imageUrl: "images/pizza.jpg",
        isVeg: true,
        isChefSpecial: true,
        calories: "780 kcal"
    },
    {
        id: 102,
        restaurantId: 1,
        name: "Truffle & Wild Mushroom Tagliatelle",
        category: "Pasta",
        description: "Handmade ribbons of egg pasta tossed in decadent black truffle cream, sautéed porcini mushrooms, and 24-month aged parmesan.",
        price: 429.00,
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: true,
        calories: "850 kcal"
    },
    {
        id: 103,
        restaurantId: 1,
        name: "Spicy Pepperoni & Jalapeño Pizza",
        category: "Pizza",
        description: "Crispy beef pepperoni, fiery pickled jalapeños, mozzarella, and San Marzano tomato reduction on charred crust.",
        price: 399.00,
        imageUrl: "images/pizza.jpg",
        isVeg: false,
        isChefSpecial: false,
        calories: "920 kcal"
    },
    {
        id: 104,
        restaurantId: 1,
        name: "Classic Italian Espresso Tiramisu",
        category: "Dessert",
        description: "Savoiardi ladyfingers infused with dark Italian espresso, layered with airy mascarpone cream and Belgian cocoa.",
        price: 199.00,
        imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "450 kcal"
    },
    {
        id: 105,
        restaurantId: 1,
        name: "San Pellegrino Blood Orange Fizz",
        category: "Beverage",
        description: "Sparkling citrus beverage made with sun-ripened Mediterranean blood oranges (330ml).",
        price: 129.00,
        imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "140 kcal"
    },

    // ── Craft Burger (id: 2) ──────────────────────────────────
    {
        id: 201,
        restaurantId: 2,
        name: "The Signature Double Bacon Smash Burger",
        category: "Burgers",
        description: "Two prime smash patties, melted English cheddar, smoked crisp bacon, caramelized shallots, house secret glaze on toasted brioche.",
        price: 299.00,
        imageUrl: "images/burger.jpg",
        isVeg: false,
        isChefSpecial: true,
        calories: "1050 kcal"
    },
    {
        id: 202,
        restaurantId: 2,
        name: "Crispy Truffle Parmesan Fries",
        category: "Sides",
        description: "Twice-cooked golden russet fries tossed in aromatic white truffle oil, grated Pecorino, and fresh herbs.",
        price: 169.00,
        imageUrl: "images/parmesan-fries.png",
        isVeg: true,
        isChefSpecial: false,
        calories: "520 kcal"
    },
    {
        id: 203,
        restaurantId: 2,
        name: "Nashville Spicy Fried Chicken Burger",
        category: "Burgers",
        description: "Buttermilk marinated crispy fried chicken breast with cayenne dip, dill pickles, and creamy garlic slaw.",
        price: 279.00,
        imageUrl: "images/burger.jpg",
        isVeg: false,
        isChefSpecial: true,
        calories: "910 kcal"
    },
    {
        id: 204,
        restaurantId: 2,
        name: "Thick Salted Caramel Gelato Shake",
        category: "Beverage",
        description: "Hand-churned vanilla bean gelato blended with warm butter caramel and roasted pecans.",
        price: 189.00,
        imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "680 kcal"
    },

    // ── Tokyo Sakura Sushi (id: 3) ────────────────────────────
    {
        id: 301,
        restaurantId: 3,
        name: "Dragon King Special Avocado Roll (8 pcs)",
        category: "Sushi",
        description: "Crisp prawn tempura roll topped with tender unagi eel, ripe Hass avocado slices, and sweet kabayaki sauce.",
        price: 499.00,
        imageUrl: "images/sushi.jpg",
        isVeg: false,
        isChefSpecial: true,
        calories: "620 kcal"
    },
    {
        id: 302,
        restaurantId: 3,
        name: "Fresh Atlantic Salmon Nigiri & Maki Combo",
        category: "Sushi",
        description: "Six pieces of premium sashimi-grade salmon nigiri and spicy salmon crunchy rolls with wasabi and pickled ginger.",
        price: 449.00,
        imageUrl: "images/sushi.jpg",
        isVeg: false,
        isChefSpecial: false,
        calories: "510 kcal"
    },
    {
        id: 303,
        restaurantId: 3,
        name: "Rich Tonkotsu Black Garlic Ramen",
        category: "Mains",
        description: "12-hour simmered savory broth, tender chashu pork slices, soft ajitsuke tamago egg, and spring noodles.",
        price: 429.00,
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        isVeg: false,
        isChefSpecial: true,
        calories: "890 kcal"
    },
    {
        id: 304,
        restaurantId: 3,
        name: "Japanese Kyoto Matcha Mochi Gelato (3 pcs)",
        category: "Dessert",
        description: "Delicate steamed rice cakes filled with authentic Japanese ceremonial matcha green tea gelato.",
        price: 189.00,
        imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "280 kcal"
    },

    // ── Spice Symphony (id: 4) ────────────────────────────────
    {
        id: 401,
        restaurantId: 4,
        name: "Royal Murgh Makhani (Butter Chicken)",
        category: "Mains",
        description: "Tender clay-oven grilled boneless chicken in a velvety, buttery tomato cashew gravy with aromatic kasuri methi.",
        price: 389.00,
        imageUrl: "images/butter-chicken.jpg",
        isVeg: false,
        isChefSpecial: true,
        calories: "820 kcal"
    },
    {
        id: 402,
        restaurantId: 4,
        name: "Paneer Tikka Masala (Handi Special)",
        category: "Mains",
        description: "Char-grilled fresh cottage cheese cubes simmered in a spiced onion-tomato gravy with bell peppers.",
        price: 349.00,
        imageUrl: "images/butter-chicken.jpg",
        isVeg: true,
        isChefSpecial: true,
        calories: "750 kcal"
    },
    {
        id: 403,
        restaurantId: 4,
        name: "Clay Oven Tandoori Garlic Naan (2 pcs)",
        category: "Sides",
        description: "Traditional fermented bread baked against clay tandoor walls, brushed generously with minced garlic, coriander, and desi ghee.",
        price: 89.00,
        imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "340 kcal"
    },
    {
        id: 404,
        restaurantId: 4,
        name: "Royal Alphonso Mango Lassi",
        category: "Beverage",
        description: "Thick chilled traditional yogurt smoothie blended with ripe Ratnagiri Alphonso mango pulp and green cardamom.",
        price: 129.00,
        imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "260 kcal"
    },

    // ── La Fiesta (id: 5) ─────────────────────────────────────
    {
        id: 501,
        restaurantId: 5,
        name: "Crispy Beef Birria Quesatacos (3 pcs)",
        category: "Tacos",
        description: "Slow-simmered beef chuck and Oaxaca cheese inside crisped corn tortillas, served with rich cilantro-onion consommé broth.",
        price: 349.00,
        imageUrl: "images/tacos.jpg",
        isVeg: false,
        isChefSpecial: true,
        calories: "840 kcal"
    },
    {
        id: 502,
        restaurantId: 5,
        name: "Fresh Loaded Guacamole & Corn Tortilla Chips",
        category: "Sides",
        description: "Freshly crushed Hass avocados with lime, diced tomatoes, jalapeños, and crunchy sea salt tortilla chips.",
        price: 219.00,
        imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "410 kcal"
    },

    // ── Verde Garden (id: 6) ──────────────────────────────────
    {
        id: 601,
        restaurantId: 6,
        name: "Mediterranean Falafel & Quinoa Harvest Bowl",
        category: "Bowls",
        description: "Crispy herb falafels, tri-color quinoa, kalamata olives, cherry tomatoes, cucumbers, creamy tahini drizzle.",
        price: 319.00,
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: true,
        calories: "540 kcal"
    },
    {
        id: 602,
        restaurantId: 6,
        name: "Raw Cold-Pressed Green Glow Detox Juice",
        category: "Beverage",
        description: "100% natural cold pressed juice of spinach, green apple, cucumber, celery, and ginger root (300ml).",
        price: 159.00,
        imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "120 kcal"
    },

    // ── Golden Dragon Dim Sum & Wok (id: 7) ────────────────────
    {
        id: 701,
        restaurantId: 7,
        name: "Steamed Truffle Edamame & Crystal Dumplings (6 pcs)",
        category: "Dim Sum",
        description: "Translucent crystal wraps stuffed with crushed edamame, water chestnuts, shiitake mushrooms, and black truffle oil.",
        price: 319.00,
        imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: true,
        calories: "320 kcal"
    },
    {
        id: 702,
        restaurantId: 7,
        name: "Crispy Cantonese Prawn Siu Mai (6 pcs)",
        category: "Dim Sum",
        description: "Open-topped steamed & seared dumplings packed with succulent minced prawns, scallions, and tobiko caviar topping.",
        price: 369.00,
        imageUrl: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=600&q=80",
        isVeg: false,
        isChefSpecial: false,
        calories: "380 kcal"
    },
    {
        id: 703,
        restaurantId: 7,
        name: "Fiery Sichuan Dan Dan Wok Noodles",
        category: "Noodles",
        description: "Chewy hand-pulled noodles tossed in toasted sesame paste, crispy minced chicken, preserved greens, and house chili oil.",
        price: 349.00,
        imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80",
        isVeg: false,
        isChefSpecial: true,
        calories: "720 kcal"
    },
    {
        id: 704,
        restaurantId: 7,
        name: "Golden Crispy Vegetable Spring Rolls (4 pcs)",
        category: "Sides",
        description: "Thin flaky pastry rolls stuffed with shredded cabbage, carrots, bell peppers, served with sweet plum dip.",
        price: 229.00,
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "340 kcal"
    },

    // ── Le Petit Paris Bakery & Patisserie (id: 8) ──────────────
    {
        id: 801,
        restaurantId: 8,
        name: "Pure French Butter Parisian Croissant",
        category: "Bakery",
        description: "Flaky, honeycombed interior laminated with Normandy butter, baked to a golden deep bronze perfection.",
        price: 149.00,
        imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: true,
        calories: "310 kcal"
    },
    {
        id: 802,
        restaurantId: 8,
        name: "Belgian Dark Chocolate Pain au Chocolat",
        category: "Bakery",
        description: "Double batons of 70% dark Valrhona Belgian chocolate enveloped in crisp buttery croissant pastry.",
        price: 179.00,
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: false,
        calories: "390 kcal"
    },
    {
        id: 803,
        restaurantId: 8,
        name: "Fresh Raspberry Tartlet & Vanilla Creme",
        category: "Dessert",
        description: "Crisp almond sable crust filled with silky Madagascar vanilla bean cream and topped with fresh raspberries.",
        price: 239.00,
        imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80",
        isVeg: true,
        isChefSpecial: true,
        calories: "350 kcal"
    }
];

const PROMO_CODES = {
    "FEAST20": { discountPercent: 20, description: "20% off entire order" },
    "FREEDEL": { freeDelivery: true, description: "Free express delivery" },
    "BITE100": { discountAmount: 100.00, minOrder: 500.00, description: "₹100 off on orders above ₹500" }
};
