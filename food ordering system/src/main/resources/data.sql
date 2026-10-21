-- ============================================================
-- data.sql - Initial Seed Data for Food Ordering System
-- Localized in Indian Rupee (INR ₹)
-- ============================================================

-- ── Roles ───────────────────────────────────────────────────
INSERT INTO roles (id, name) VALUES (1, 'CUSTOMER');
INSERT INTO roles (id, name) VALUES (2, 'RESTAURANT_STAFF');
INSERT INTO roles (id, name) VALUES (3, 'ADMIN');

-- ── Users ───────────────────────────────────────────────────
-- Customer: customer@foodorder.com / Customer#2026!Pass
INSERT INTO users (id, name, email, password, phone, enabled, created_at, updated_at)
VALUES (1, 'Jane Customer', 'customer@foodorder.com', '$2a$10$kuv5Bjn5b1ypqyyByyBz0e0cGSWiFDsv/b7yscsfrDl6ffjr1uWDC', '+91 98450 11223', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Admin: admin@foodorder.com / Admin#Secret99!Key
INSERT INTO users (id, name, email, password, phone, enabled, created_at, updated_at)
VALUES (2, 'Alex Admin', 'admin@foodorder.com', '$2a$10$4XPwr99cl6f3PIKaOTDqTOGp9J9cBYH5t6zbZwGrhQhf6/ELoVs0a', '+91 98110 99887', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ── User Role Assignments ───────────────────────────────────
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1); -- Customer has ROLE_CUSTOMER
INSERT INTO user_roles (user_id, role_id) VALUES (2, 3); -- Admin has ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (2, 1); -- Admin also has ROLE_CUSTOMER

-- ── Restaurants ─────────────────────────────────────────────
INSERT INTO restaurants (id, name, cuisine, description, address, phone, image_url, active, created_at, updated_at)
VALUES (1, 'Trattoria Bella Italia & Woodfire', 'Italian', 'Authentic wood-fired Neapolitan sourdough pizzas, slow-simmered hand-cut pasta, truffle burrata & classic Venetian tiramisu.', '12 Indiranagar 100ft Road, Bengaluru', '+91 98450 12345', 'images/pizza.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO restaurants (id, name, cuisine, description, address, phone, image_url, active, created_at, updated_at)
VALUES (2, 'Smokey Yard Burgers & Smokehouse', 'American', 'Prime Angus smashed patties, hickory-smoked bacon, melted Wisconsin cheddar on toasted brioche & loaded truffle fries.', '44 Church Street, Bengaluru', '+91 98450 54321', 'images/burger.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO restaurants (id, name, cuisine, description, address, phone, image_url, active, created_at, updated_at)
VALUES (3, 'Spice Symphony - Royal Kitchen', 'Indian', 'Rich Mughlai gravies, aromatic Dum Biryani, clay-oven tandoori delights, and soft garlic naan.', '88 Connaught Place, New Delhi', '+91 98110 67890', 'images/butter-chicken.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO restaurants (id, name, cuisine, description, address, phone, image_url, active, created_at, updated_at)
VALUES (7, 'Golden Dragon Dim Sum & Wok', 'Chinese', 'Handcrafted steamed crystal dumplings, crispy peking duck rolls, fiery Sichuan Dan Dan noodles & aromatic wok-tossed bowls.', '56 Lavelle Road, Central Bengaluru', '+91 98450 78901', 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=700&q=80', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO restaurants (id, name, cuisine, description, address, phone, image_url, active, created_at, updated_at)
VALUES (8, 'Le Petit Paris Bakery & Patisserie', 'Bakery', 'Artisanal French flaky butter croissants, Belgian chocolate eclairs, delicate fruit tarts & specialty cafe au lait.', '18 Indiranagar 12th Main, Bengaluru', '+91 98450 67890', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ── Menu Items (Prices in INR ₹) ────────────────────────────
INSERT INTO menu_items (id, name, description, category, price, image_url, available, restaurant_id, created_at, updated_at)
VALUES (1, 'Wood-Fired Margherita D.O.P. Pizza', 'San Marzano tomato sauce, fresh buffalo mozzarella, aromatic basil, and olive oil.', 'Pizza', 349.00, 'images/pizza.jpg', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO menu_items (id, name, description, category, price, image_url, available, restaurant_id, created_at, updated_at)
VALUES (2, 'The Signature Double Bacon Smash Burger', 'Two prime smash patties, aged cheddar, smoked bacon, caramelized shallots.', 'Burgers', 299.00, 'images/burger.jpg', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO menu_items (id, name, description, category, price, image_url, available, restaurant_id, created_at, updated_at)
VALUES (3, 'Royal Murgh Makhani (Butter Chicken)', 'Tender chicken in a rich tomato, cashew and butter gravy with kasuri methi.', 'Mains', 389.00, 'images/butter-chicken.jpg', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO menu_items (id, name, description, category, price, image_url, available, restaurant_id, created_at, updated_at)
VALUES (7, 'Steamed Truffle Edamame & Crystal Dumplings', 'Translucent wraps stuffed with crushed edamame, shiitake, and truffle oil.', 'Dim Sum', 319.00, 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO menu_items (id, name, description, category, price, image_url, available, restaurant_id, created_at, updated_at)
VALUES (8, 'Pure French Butter Parisian Croissant', 'Flaky, honeycombed interior laminated with Normandy butter, baked golden.', 'Bakery', 149.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
