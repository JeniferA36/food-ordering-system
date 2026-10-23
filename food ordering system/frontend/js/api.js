/**
 * API Service for communicating with Spring Boot REST Backend
 * Seamlessly fails over to local demo storage if backend is not yet started.
 */

const API_BASE_URL = "http://localhost:8080/api";

const ApiService = {
    token: localStorage.getItem("food_token") || null,
    currentUser: JSON.parse(localStorage.getItem("food_user") || "null"),
    isBackendOnline: false,

    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const response = await fetch(`${API_BASE_URL}/restaurants`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            this.isBackendOnline = response.ok;
            return this.isBackendOnline;
        } catch (e) {
            this.isBackendOnline = false;
            return false;
        }
    },

    getHeaders() {
        const headers = { "Content-Type": "application/json" };
        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }
        return headers;
    },

    // ── Authentication ────────────────────────────
    async login(email, password) {
        if (this.isBackendOnline) {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                if (res.ok) {
                    const data = await res.json();
                    this.token = data.token;
                    this.currentUser = { id: data.id, name: data.name, email: data.email, roles: data.roles };
                    localStorage.setItem("food_token", this.token);
                    localStorage.setItem("food_user", JSON.stringify(this.currentUser));
                    return { success: true, user: this.currentUser };
                }
            } catch (err) {
                console.warn("Backend login failed, using demo auth:", err);
            }
        }

        const cleanEmail = (email || "").trim().toLowerCase();

        // Admin account (accepts ID 'admin' or email 'admin@foodorder.com')
        if (cleanEmail === "admin@foodorder.com" || cleanEmail === "admin") {
            if (password !== "admin123" && password !== "admin" && password !== "Admin#Secret99!Key") {
                return { success: false, message: "Invalid password for Admin. Please check credentials." };
            }
            const adminUser = {
                id: 2,
                name: "Admin",
                email: "admin@foodorder.com",
                roles: ["ROLE_ADMIN", "ROLE_CUSTOMER"]
            };
            this.token = "demo-jwt-admin-token";
            this.currentUser = adminUser;
            localStorage.setItem("food_token", this.token);
            localStorage.setItem("food_user", JSON.stringify(this.currentUser));
            return { success: true, user: adminUser, isDemo: true };
        }

        // Customer account
        if (cleanEmail === "customer@foodorder.com") {
            if (password !== "user123" && password !== "customer123" && password !== "Customer#2026!Pass") {
                return { success: false, message: "Invalid password for Customer. Use: user123 (or Customer#2026!Pass)" };
            }
            const customerUser = {
                id: 1,
                name: "Jane Customer",
                email: "customer@foodorder.com",
                phone: "+1 (555) 0101",
                roles: ["ROLE_CUSTOMER"]
            };
            this.token = "demo-jwt-customer-token";
            this.currentUser = customerUser;
            localStorage.setItem("food_token", this.token);
            localStorage.setItem("food_user", JSON.stringify(this.currentUser));
            return { success: true, user: customerUser, isDemo: true };
        }

        // Any other user email
        const generalUser = {
            id: 99,
            name: email.split("@")[0].toUpperCase() || "Alex Mercer",
            email: email,
            phone: "+1 (555) 789-0123",
            roles: ["ROLE_CUSTOMER"]
        };
        this.token = "demo-jwt-token-sample";
        this.currentUser = generalUser;
        localStorage.setItem("food_token", this.token);
        localStorage.setItem("food_user", JSON.stringify(this.currentUser));
        return { success: true, user: generalUser, isDemo: true };
    },

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem("food_token");
        localStorage.removeItem("food_user");
    },

    // ── Restaurants ───────────────────────────────
    async getRestaurants() {
        if (this.isBackendOnline) {
            try {
                const res = await fetch(`${API_BASE_URL}/restaurants`);
                if (res.ok) {
                    const data = await res.json();
                    return data.content || data;
                }
            } catch (err) {
                console.warn("Could not fetch restaurants from API, fallback to demo data:", err);
            }
        }
        const saved = localStorage.getItem("food_custom_restaurants");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {}
        }
        return SAMPLE_RESTAURANTS;
    },

    async getRestaurantById(id) {
        if (this.isBackendOnline) {
            try {
                const res = await fetch(`${API_BASE_URL}/restaurants/${id}`);
                if (res.ok) return await res.json();
            } catch (err) {
                console.warn("Could not fetch restaurant by ID:", err);
            }
        }
        const all = await this.getRestaurants();
        return all.find(r => r.id === Number(id)) || SAMPLE_RESTAURANTS[0];
    },

    async saveRestaurant(restaurantData) {
        let restaurants = await this.getRestaurants();
        restaurants = JSON.parse(JSON.stringify(restaurants));
        if (restaurantData.id) {
            const idx = restaurants.findIndex(r => r.id === Number(restaurantData.id));
            if (idx >= 0) {
                restaurants[idx] = { ...restaurants[idx], ...restaurantData };
            } else {
                restaurants.push(restaurantData);
            }
        } else {
            restaurantData.id = Date.now();
            restaurants.push(restaurantData);
        }
        localStorage.setItem("food_custom_restaurants", JSON.stringify(restaurants));
        return restaurantData;
    },

    // ── Menu Items ────────────────────────────────
    async getMenuItems(restaurantId) {
        if (this.isBackendOnline) {
            try {
                const res = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menu-items`);
                if (res.ok) {
                    const data = await res.json();
                    return data.content || data;
                }
            } catch (err) {
                console.warn("Could not fetch menu items from API:", err);
            }
        }
        const saved = localStorage.getItem(`food_menu_${restaurantId}`);
        if (saved) {
            try {
                let parsed = JSON.parse(saved);
                let updated = false;
                parsed = parsed.map(item => {
                    if (item.name === "Crispy Truffle Parmesan Fries" && (!item.imageUrl || item.imageUrl.includes("unsplash"))) {
                        item.imageUrl = "images/parmesan-fries.png";
                        updated = true;
                    }
                    return item;
                });
                if (updated) {
                    localStorage.setItem(`food_menu_${restaurantId}`, JSON.stringify(parsed));
                }
                return parsed;
            } catch (e) {}
        }
        const items = SAMPLE_MENU_ITEMS.filter(m => m.restaurantId === Number(restaurantId));
        if (items.length > 0) return items;
        return [
            {
                id: Number(restaurantId) * 100 + 1,
                restaurantId: Number(restaurantId),
                name: "Chef's Signature House Special",
                category: "Special",
                description: "Freshly prepared house delicacy with authentic herbs and premium ingredients.",
                price: 349.00,
                imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
                isVeg: true,
                isChefSpecial: true,
                calories: "520 kcal"
            },
            {
                id: Number(restaurantId) * 100 + 2,
                restaurantId: Number(restaurantId),
                name: "Crispy Appetizer Platter",
                category: "Appetizer",
                description: "Golden fried crisp delicacies served with chef's signature dipping sauces.",
                price: 249.00,
                imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80",
                isVeg: true,
                isChefSpecial: false,
                calories: "380 kcal"
            }
        ];
    },

    async saveMenuItem(restaurantId, menuItemData) {
        let items = await this.getMenuItems(restaurantId);
        items = JSON.parse(JSON.stringify(items));
        if (menuItemData.id) {
            const idx = items.findIndex(m => m.id === Number(menuItemData.id));
            if (idx >= 0) {
                items[idx] = { ...items[idx], ...menuItemData };
            } else {
                items.push(menuItemData);
            }
        } else {
            menuItemData.id = Date.now();
            menuItemData.restaurantId = Number(restaurantId);
            items.push(menuItemData);
        }
        localStorage.setItem(`food_menu_${restaurantId}`, JSON.stringify(items));
        return menuItemData;
    },

    async deleteMenuItem(restaurantId, itemId) {
        let items = await this.getMenuItems(restaurantId);
        items = items.filter(m => m.id !== Number(itemId));
        localStorage.setItem(`food_menu_${restaurantId}`, JSON.stringify(items));
        return true;
    },

    // ── Orders ───────────────────────────────────
    async placeOrder(orderData) {
        if (this.isBackendOnline && this.token) {
            try {
                const res = await fetch(`${API_BASE_URL}/orders`, {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        deliveryAddress: orderData.deliveryAddress,
                        notes: orderData.notes
                    })
                });
                if (res.ok) return await res.json();
            } catch (err) {
                console.warn("Order placement failed on API, placing via demo engine:", err);
            }
        }

        // Demo simulation order
        const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
        const order = {
            id: orderId,
            restaurantName: orderData.restaurantName,
            items: orderData.items,
            subtotal: orderData.subtotal,
            discount: orderData.discount,
            deliveryFee: orderData.deliveryFee,
            tax: orderData.tax,
            totalAmount: orderData.totalAmount,
            deliveryAddress: orderData.deliveryAddress,
            notes: orderData.notes,
            status: "PLACED",
            createdAt: new Date().toISOString(),
            estimatedDelivery: "30-35 mins"
        };

        const existingOrders = JSON.parse(localStorage.getItem("food_orders") || "[]");
        existingOrders.unshift(order);
        localStorage.setItem("food_orders", JSON.stringify(existingOrders));
        return order;
    },

    getSavedOrders() {
        return JSON.parse(localStorage.getItem("food_orders") || "[]");
    }
};
