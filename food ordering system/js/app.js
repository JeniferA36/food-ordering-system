/**
 * QuickBite / FoodExpress - Core Web Application Logic
 */

const AppState = {
    currentView: 'restaurants', // 'restaurants' | 'menu' | 'orders'
    selectedRestaurant: null,
    restaurants: [],
    menuItems: [],
    cart: JSON.parse(localStorage.getItem('food_cart') || '[]'),
    appliedPromo: null,
    activeOrder: null,
    currentFilter: 'All',
    searchQuery: '',
    orderTimer: null,
    deliveryLocation: localStorage.getItem('food_delivery_location') || 'Indiranagar, Bengaluru'
};

// ── Application Initialization ─────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    updateDeliveryLocationUI();
    await checkBackendConnection();
    await loadRestaurants();
    updateCartUI();
    renderUserAuthStatus();

    // Check if there is an active tracking order saved
    const savedOrders = ApiService.getSavedOrders();
    if (savedOrders.length > 0 && savedOrders[0].status !== 'DELIVERED') {
        AppState.activeOrder = savedOrders[0];
        startOrderSimulation(AppState.activeOrder);
    }
});

// ── Backend Health Check ──────────────────────────────
async function checkBackendConnection() {
    await ApiService.checkHealth();
}

// ── Load & Render Restaurants ─────────────────────────
async function loadRestaurants() {
    AppState.restaurants = await ApiService.getRestaurants();
    renderRestaurants();
}

function renderRestaurants() {
    renderAdminControls();
    const grid = document.getElementById('restaurants-grid');
    if (!grid) return;

    let filtered = AppState.restaurants;

    // Filter by category / cuisine
    if (AppState.currentFilter !== 'All') {
        filtered = filtered.filter(r => 
            r.cuisine.toLowerCase() === AppState.currentFilter.toLowerCase() ||
            (r.tags && r.tags.some(t => t.toLowerCase() === AppState.currentFilter.toLowerCase()))
        );
    }

    // Filter by search query
    if (AppState.searchQuery.trim() !== '') {
        const query = AppState.searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(query) ||
            r.cuisine.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <h3>No restaurants found matching your criteria.</h3>
                <p>Try searching for a different dish, cuisine, or clear filters.</p>
            </div>
        `;
        return;
    }

    const isAdmin = isUserAdmin();

    grid.innerHTML = filtered.map(r => `
        <article class="restaurant-card glass" onclick="viewRestaurantMenu(${r.id})">
            <div class="card-media">
                <img src="${r.imageUrl || 'images/hero-banner.jpg'}" alt="${r.name}" loading="lazy">
                <div class="card-badges">
                    <span class="cuisine-badge">${r.cuisine}</span>
                    <span class="rating-badge">★ ${r.rating || '4.8'}</span>
                </div>
                ${isAdmin ? `
                <button class="card-action-btn" onclick="event.stopPropagation(); openEditRestaurantModal(${r.id})" title="Edit ${r.name} (Admin Only)">
                    ✏️ Edit
                </button>
                ` : ''}
            </div>
            <div class="card-body">
                <h3 class="card-title">${r.name}</h3>
                <p class="card-desc">${r.description}</p>
                <div class="card-footer">
                    <span class="meta-item">⏱ ${r.deliveryTime || '25-35 min'}</span>
                    <span class="meta-item">🛵 ₹${(r.deliveryFee || 49).toFixed(0)} delivery</span>
                    <span class="meta-item">Min ₹${(r.minOrder || 199).toFixed(0)}</span>
                </div>
            </div>
        </article>
    `).join('');
}

// ── View Restaurant Menu ──────────────────────────────
async function viewRestaurantMenu(restaurantId) {
    AppState.selectedRestaurant = await ApiService.getRestaurantById(restaurantId);
    AppState.menuItems = await ApiService.getMenuItems(restaurantId);

    document.getElementById('home-view').style.display = 'none';
    const menuView = document.getElementById('menu-view');
    menuView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    renderMenuHeader();
    renderMenuItems();
}

function renderMenuHeader() {
    const r = AppState.selectedRestaurant;
    const header = document.getElementById('menu-restaurant-header');
    if (!r || !header) return;
    const isAdmin = isUserAdmin();

    header.innerHTML = `
        <img src="${r.imageUrl || 'images/hero-banner.jpg'}" alt="${r.name}" class="menu-restaurant-thumb">
        <div class="menu-restaurant-info">
            <div class="menu-restaurant-title-row">
                <h1 class="menu-restaurant-title">${r.name}</h1>
                ${isAdmin ? `
                    <div class="admin-menu-actions">
                        <button class="btn-admin-pill" onclick="openEditRestaurantModal(${r.id})" title="Edit restaurant details (Admin Only)">
                            ✏️ Edit Restaurant
                        </button>
                        <button class="btn-admin-pill" onclick="openAddMenuItemModal()" title="Add new dish to menu (Admin Only)">
                            ➕ Add Dish
                        </button>
                    </div>
                ` : ''}
            </div>
            <p style="color: var(--text-secondary); max-width: 650px;">${r.description}</p>
            <div class="menu-restaurant-meta">
                <span>📍 ${r.address}</span>
                <span>📞 ${r.phone}</span>
                <span>★ <strong>${r.rating}</strong> (${r.reviewsCount || 200}+ reviews)</span>
                <span>⏱ <strong>${r.deliveryTime}</strong></span>
            </div>
        </div>
    `;
}

function renderMenuItems() {
    const grid = document.getElementById('menu-items-grid');
    if (!grid) return;
    const isAdmin = isUserAdmin();

    grid.innerHTML = AppState.menuItems.map(item => {
        const cartItem = AppState.cart.find(c => c.item.id === item.id);
        const qty = cartItem ? cartItem.quantity : 0;

        return `
            <div class="menu-item-card glass">
                <div class="menu-item-details">
                    <div class="item-badges">
                        <span class="veg-tag ${item.isVeg ? 'veg' : 'non-veg'}">
                            ${item.isVeg ? '● VEG' : '▲ NON-VEG'}
                        </span>
                        ${item.isChefSpecial ? '<span class="special-tag">★ CHEF SPECIAL</span>' : ''}
                    </div>
                    <h3 class="menu-item-title">${item.name}</h3>
                    <p class="menu-item-desc">${item.description}</p>
                    <div class="menu-item-bottom">
                        <span class="menu-item-price">₹${Number(item.price).toFixed(0)}</span>
                        <div class="menu-item-controls">
                            ${isAdmin ? `
                                <button class="btn-admin-dish-edit" onclick="openEditMenuItemModal(${item.id})" title="Edit ${item.name} (Admin Only)">
                                    ✏️ Edit
                                </button>
                            ` : ''}
                            ${qty === 0 ? `
                                <button class="btn-add-item" onclick="addToCart(${item.id})">+ ADD</button>
                            ` : `
                                <div class="item-qty-control">
                                    <button class="qty-btn" onclick="updateItemQuantity(${item.id}, -1)">-</button>
                                    <span class="qty-num">${qty}</span>
                                    <button class="qty-btn" onclick="updateItemQuantity(${item.id}, 1)">+</button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                <div class="menu-item-img-container">
                    <img src="${item.imageUrl || 'images/hero-banner.jpg'}" alt="${item.name}" class="menu-item-img" loading="lazy" onerror="this.onerror=null; this.src='images/hero-banner.jpg';">
                </div>
            </div>
        `;
    }).join('');
}

function backToRestaurants() {
    document.getElementById('menu-view').style.display = 'none';
    document.getElementById('home-view').style.display = 'block';
    AppState.selectedRestaurant = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Cart Operations ───────────────────────────────────
function addToCart(itemId) {
    const item = AppState.menuItems.find(m => m.id === itemId) || 
                 SAMPLE_MENU_ITEMS.find(m => m.id === itemId);
    if (!item) return;

    // Check if adding from different restaurant
    if (AppState.cart.length > 0 && AppState.selectedRestaurant) {
        if (AppState.cart[0].restaurantId !== AppState.selectedRestaurant.id) {
            if (!confirm("Your cart contains dishes from another restaurant. Would you like to reset your cart to add this item?")) {
                return;
            }
            AppState.cart = [];
        }
    }

    const existing = AppState.cart.find(c => c.item.id === itemId);
    if (existing) {
        existing.quantity += 1;
    } else {
        AppState.cart.push({
            item: item,
            restaurantId: AppState.selectedRestaurant ? AppState.selectedRestaurant.id : item.restaurantId,
            restaurantName: AppState.selectedRestaurant ? AppState.selectedRestaurant.name : "Restaurant",
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    if (AppState.selectedRestaurant) {
        renderMenuItems();
    }
    showToast(`Added ${item.name} to your cart`, 'success');
}

function updateItemQuantity(itemId, delta) {
    const idx = AppState.cart.findIndex(c => c.item.id === itemId);
    if (idx !== -1) {
        AppState.cart[idx].quantity += delta;
        if (AppState.cart[idx].quantity <= 0) {
            AppState.cart.splice(idx, 1);
        }
    }
    saveCart();
    updateCartUI();
    if (AppState.selectedRestaurant) {
        renderMenuItems();
    }
}

function saveCart() {
    localStorage.setItem('food_cart', JSON.stringify(AppState.cart));
}

function updateCartUI() {
    const totalCount = AppState.cart.reduce((sum, c) => sum + c.quantity, 0);
    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.innerText = totalCount;
        badge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    renderCartDrawer();
}

function renderCartDrawer() {
    const container = document.getElementById('cart-items-container');
    const footer = document.getElementById('cart-footer');
    if (!container || !footer) return;

    if (AppState.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-state">
                <div class="empty-cart-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Explore delicious dishes from top restaurants and add them here!</p>
            </div>
        `;
        footer.style.display = 'none';
        return;
    }

    footer.style.display = 'block';
    container.innerHTML = AppState.cart.map(c => `
        <div class="cart-item-row">
            <img src="${c.item.imageUrl || 'images/hero-banner.jpg'}" alt="${c.item.name}" class="cart-item-thumb">
            <div class="cart-item-meta">
                <div class="cart-item-name">${c.item.name}</div>
                <div class="cart-item-price">₹${(c.item.price * c.quantity).toFixed(0)}</div>
            </div>
            <div class="item-qty-control">
                <button class="qty-btn" onclick="updateItemQuantity(${c.item.id}, -1)">-</button>
                <span class="qty-num">${c.quantity}</span>
                <button class="qty-btn" onclick="updateItemQuantity(${c.item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');

    // Totals calculations
    const subtotal = AppState.cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
    let deliveryFee = subtotal > 399 ? 0.00 : 49.00;
    let discount = 0;

    if (AppState.appliedPromo) {
        if (AppState.appliedPromo.freeDelivery) {
            deliveryFee = 0.00;
        } else if (AppState.appliedPromo.discountPercent) {
            discount = (subtotal * AppState.appliedPromo.discountPercent) / 100;
        } else if (AppState.appliedPromo.discountAmount) {
            discount = AppState.appliedPromo.discountAmount;
        }
    }

    const tax = (subtotal - discount) * 0.05; // 5% GST
    const grandTotal = Math.max(0, subtotal - discount + deliveryFee + tax);

    document.getElementById('cart-subtotal').innerText = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cart-delivery').innerText = deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`;
    document.getElementById('cart-tax').innerText = `₹${tax.toFixed(2)}`;
    document.getElementById('cart-discount-row').style.display = discount > 0 ? 'flex' : 'none';
    document.getElementById('cart-discount').innerText = `-₹${discount.toFixed(2)}`;
    document.getElementById('cart-grand-total').innerText = `₹${grandTotal.toFixed(2)}`;
}

// ── Promo Code ────────────────────────────────────────
function applyPromoCode() {
    const input = document.getElementById('promo-input');
    const code = input ? input.value.trim().toUpperCase() : '';
    if (PROMO_CODES[code]) {
        AppState.appliedPromo = PROMO_CODES[code];
        showToast(`Promo "${code}" applied: ${PROMO_CODES[code].description}`, 'success');
        updateCartUI();
    } else {
        showToast('Invalid promo code. Try FEAST20 or FREEDEL', 'info');
    }
}

// ── Drawers & Modals Toggle ───────────────────────────
function toggleCartDrawer(open) {
    const backdrop = document.getElementById('cart-backdrop');
    const drawer = document.getElementById('cart-drawer');
    if (open) {
        backdrop.classList.add('open');
        drawer.classList.add('open');
    } else {
        backdrop.classList.remove('open');
        drawer.classList.remove('open');
    }
}

function openCheckoutModal() {
    toggleCartDrawer(false);
    const checkoutAddressInput = document.getElementById('checkout-address');
    if (checkoutAddressInput && AppState.deliveryLocation) {
        checkoutAddressInput.value = AppState.deliveryLocation;
    }
    document.getElementById('checkout-modal').classList.add('open');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('open');
}

// ── Submit Order ──────────────────────────────────────
async function submitOrder(e) {
    e.preventDefault();
    const address = document.getElementById('checkout-address').value;
    const notes = document.getElementById('checkout-notes').value;

    if (!address.trim()) {
        showToast('Please enter your delivery address', 'info');
        return;
    }

    const subtotal = AppState.cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
    const deliveryFee = subtotal > 399 ? 0.00 : 49.00;
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + deliveryFee + tax;

    const orderData = {
        restaurantName: AppState.cart[0].restaurantName,
        items: [...AppState.cart],
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        tax: tax,
        totalAmount: totalAmount,
        deliveryAddress: address,
        notes: notes
    };

    const placedOrder = await ApiService.placeOrder(orderData);
    AppState.activeOrder = placedOrder;

    // Reset Cart
    AppState.cart = [];
    AppState.appliedPromo = null;
    saveCart();
    updateCartUI();

    closeCheckoutModal();
    showToast('🎉 Order placed successfully!', 'success');

    // Open Live Tracker
    openOrderTrackerModal(placedOrder);
    startOrderSimulation(placedOrder);
}

// ── Live Order Tracker (Spring Boot OrderStatus State Machine) ──
function openOrderTrackerModal(order) {
    const modal = document.getElementById('order-tracker-modal');
    renderOrderTracking(order);
    modal.classList.add('open');
}

function closeOrderTrackerModal() {
    document.getElementById('order-tracker-modal').classList.remove('open');
}

function renderOrderTracking(order) {
    if (!order) return;
    document.getElementById('track-order-id').innerText = order.id;
    document.getElementById('track-restaurant').innerText = order.restaurantName || "Express Kitchen";
    document.getElementById('track-address').innerText = order.deliveryAddress;
    document.getElementById('track-total').innerText = `₹${(order.totalAmount || 0).toFixed(2)}`;

    const statuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIdx = statuses.indexOf(order.status);

    const progressLine = document.getElementById('track-progress-line');
    if (progressLine) {
        const percent = (Math.max(0, currentIdx) / (statuses.length - 1)) * 100;
        progressLine.style.width = `${percent}%`;
    }

    statuses.forEach((s, idx) => {
        const node = document.getElementById(`step-${s.toLowerCase()}`);
        if (!node) return;
        node.className = 'step-node';
        if (idx < currentIdx) {
            node.classList.add('completed');
        } else if (idx === currentIdx) {
            node.classList.add('active');
        }
    });

    const statusMessage = document.getElementById('track-status-message');
    const messages = {
        'PLACED': 'Order received! Sending details to kitchen...',
        'CONFIRMED': 'Restaurant accepted your order!',
        'PREPARING': 'Chef is preparing your fresh meal 🍳',
        'OUT_FOR_DELIVERY': 'Driver is heading your way with your food 🛵',
        'DELIVERED': 'Delivered! Bon appétit! 🍽'
    };
    if (statusMessage) {
        statusMessage.innerText = messages[order.status] || order.status;
    }
}

function startOrderSimulation(order) {
    if (AppState.orderTimer) clearInterval(AppState.orderTimer);

    const statuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    
    AppState.orderTimer = setInterval(() => {
        const currentIdx = statuses.indexOf(order.status);
        if (currentIdx < statuses.length - 1) {
            order.status = statuses[currentIdx + 1];
            renderOrderTracking(order);

            // Update in localStorage
            const orders = ApiService.getSavedOrders();
            const idx = orders.findIndex(o => o.id === order.id);
            if (idx !== -1) {
                orders[idx].status = order.status;
                localStorage.setItem('food_orders', JSON.stringify(orders));
            }

            if (order.status === 'DELIVERED') {
                showToast(`Order ${order.id} has been delivered!`, 'success');
                clearInterval(AppState.orderTimer);
            }
        } else {
            clearInterval(AppState.orderTimer);
        }
    }, 12000); // Progresses step every 12 seconds in demo
}

// ── User Auth & Modal ─────────────────────────────────
function openAuthModal() {
    const emailInput = document.getElementById('auth-email');
    const pwdInput = document.getElementById('auth-password');
    const icon = document.getElementById('toggle-pwd-icon');
    
    // Clear fields to keep credentials private
    if (emailInput) emailInput.value = '';
    if (pwdInput) {
        pwdInput.value = '';
        pwdInput.type = 'password';
    }
    if (icon) icon.innerText = '👁️';

    document.getElementById('auth-modal').classList.add('open');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('open');
}

function togglePasswordVisibility() {
    const pwdInput = document.getElementById('auth-password');
    const icon = document.getElementById('toggle-pwd-icon');
    if (!pwdInput) return;

    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        if (icon) icon.innerText = '🔒';
    } else {
        pwdInput.type = 'password';
        if (icon) icon.innerText = '👁️';
    }
}

function isUserAdmin() {
    return ApiService.currentUser &&
           ApiService.currentUser.roles &&
           (ApiService.currentUser.roles.includes('ROLE_ADMIN') || ApiService.currentUser.email === 'admin@foodorder.com');
}

function renderAdminControls() {
    const container = document.getElementById('admin-actions-container');
    if (!container) return;

    if (isUserAdmin()) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span class="admin-badge-indicator">👑 Admin Panel</span>
                <button class="btn-add-restaurant" onclick="openAddRestaurantModal()" title="Add a new restaurant to catalog">
                    <span>➕ Add Restaurant</span>
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <button class="btn-admin-login-hint" onclick="openAuthModal()" title="Admins can sign in to add or edit restaurants">
                👑 Admin Access
            </button>
        `;
    }
}

async function quickLogin(email, password) {
    const emailInput = document.getElementById('auth-email');
    const pwdInput = document.getElementById('auth-password');
    if (emailInput) emailInput.value = email;
    if (pwdInput) pwdInput.value = password;
    await submitAuthForm();
}

async function submitAuthForm(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    const res = await ApiService.login(email, password);
    if (res.success) {
        renderUserAuthStatus();
        renderRestaurants();
        if (AppState.selectedRestaurant) {
            renderMenuHeader();
            renderMenuItems();
        }
        closeAuthModal();
        const isAdmin = isUserAdmin();
        const roleLabel = isAdmin ? '👑 Admin (Can Add & Edit Restaurants & Dishes)' : '👤 Customer (Food Ordering)';
        showToast(`Signed in successfully as ${res.user.name} (${roleLabel})`, 'success');
    } else {
        showToast(res.message || 'Login failed. Please check credentials', 'info');
    }
}

async function handleLogin(email) {
    const defaultPassword = email === 'admin@foodorder.com' ? 'admin123' : 'user123';
    const res = await ApiService.login(email, defaultPassword);
    if (res.success) {
        renderUserAuthStatus();
        renderRestaurants();
        if (AppState.selectedRestaurant) {
            renderMenuHeader();
            renderMenuItems();
        }
        closeAuthModal();
        showToast(`Signed in as ${ApiService.currentUser.name}`, 'success');
    }
}

function handleLogout() {
    ApiService.logout();
    renderUserAuthStatus();
    renderRestaurants();
    if (AppState.selectedRestaurant) {
        renderMenuHeader();
        renderMenuItems();
    }
    showToast('Signed out', 'info');
}

function renderUserAuthStatus() {
    const container = document.getElementById('user-nav-action');
    if (!container) return;

    if (ApiService.currentUser) {
        const isAdmin = isUserAdmin();
        container.innerHTML = `
            <button class="btn-nav-orders" onclick="handleLogout()" title="Click to logout" style="${isAdmin ? 'border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); color: #c4b5fd;' : ''}">
                ${isAdmin ? '👑' : '👤'} ${ApiService.currentUser.name} (Logout)
            </button>
        `;
    } else {
        container.innerHTML = `
            <button class="btn-nav-orders" onclick="openAuthModal()">
                Sign In
            </button>
        `;
    }
}

// ── Toast Notification System ─────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : 'ℹ'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ── Event Listeners ───────────────────────────────────
function initEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value;
            renderRestaurants();
        });
    }

    // Category filter chips
    const chips = document.querySelectorAll('.categories-bar .category-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            AppState.currentFilter = chip.getAttribute('data-category') || 'All';
            renderRestaurants();
        });
    });
}

// ── Add / Edit Restaurant Handlers ───────────────────
function openAddRestaurantModal() {
    if (!isUserAdmin()) {
        showToast('🔒 Only an Admin can add restaurants. Please log in as Admin.', 'info');
        openAuthModal();
        return;
    }
    const modalTitle = document.getElementById('restaurant-modal-title');
    if (modalTitle) modalTitle.innerText = '🍽️ Add New Restaurant (Admin Only)';
    document.getElementById('edit-restaurant-id').value = '';
    document.getElementById('edit-restaurant-name').value = '';
    document.getElementById('edit-restaurant-cuisine').value = '';
    document.getElementById('edit-restaurant-rating').value = '4.9';
    document.getElementById('edit-restaurant-desc').value = '';
    document.getElementById('edit-restaurant-image').value = 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=700&q=80';
    document.getElementById('edit-restaurant-time').value = '25-35 min';
    document.getElementById('edit-restaurant-fee').value = '49';
    document.getElementById('restaurant-modal').classList.add('open');
}

async function openEditRestaurantModal(id) {
    if (!isUserAdmin()) {
        showToast('🔒 Only an Admin can edit restaurants. Please log in as Admin.', 'info');
        openAuthModal();
        return;
    }
    const restaurant = await ApiService.getRestaurantById(id);
    if (!restaurant) return;

    const modalTitle = document.getElementById('restaurant-modal-title');
    if (modalTitle) modalTitle.innerText = `✏️ Edit ${restaurant.name} (Admin Only)`;
    document.getElementById('edit-restaurant-id').value = restaurant.id;
    document.getElementById('edit-restaurant-name').value = restaurant.name;
    document.getElementById('edit-restaurant-cuisine').value = restaurant.cuisine;
    document.getElementById('edit-restaurant-rating').value = restaurant.rating || 4.8;
    document.getElementById('edit-restaurant-desc').value = restaurant.description;
    document.getElementById('edit-restaurant-image').value = restaurant.imageUrl || '';
    document.getElementById('edit-restaurant-time').value = restaurant.deliveryTime || '25-35 min';
    document.getElementById('edit-restaurant-fee').value = restaurant.deliveryFee || 49;
    document.getElementById('restaurant-modal').classList.add('open');
}

function closeRestaurantModal() {
    const modal = document.getElementById('restaurant-modal');
    if (modal) modal.classList.remove('open');
}

async function handleSaveRestaurant(e) {
    e.preventDefault();
    if (!isUserAdmin()) {
        showToast('🔒 Unauthorized: Only Admin accounts can add or edit restaurants.', 'info');
        closeRestaurantModal();
        openAuthModal();
        return;
    }
    const id = document.getElementById('edit-restaurant-id').value;
    const name = document.getElementById('edit-restaurant-name').value.trim();
    const cuisine = document.getElementById('edit-restaurant-cuisine').value.trim();
    const rating = parseFloat(document.getElementById('edit-restaurant-rating').value) || 4.8;
    const description = document.getElementById('edit-restaurant-desc').value.trim();
    const imageUrl = document.getElementById('edit-restaurant-image').value.trim();
    const deliveryTime = document.getElementById('edit-restaurant-time').value.trim();
    const deliveryFee = parseFloat(document.getElementById('edit-restaurant-fee').value) || 49;

    const data = {
        name,
        cuisine,
        rating,
        description,
        imageUrl,
        deliveryTime,
        deliveryFee,
        tags: [cuisine, name.split(' ')[0]]
    };

    if (id) {
        data.id = Number(id);
    }

    await ApiService.saveRestaurant(data);
    await loadRestaurants();
    if (AppState.selectedRestaurant && AppState.selectedRestaurant.id === Number(id)) {
        AppState.selectedRestaurant = { ...AppState.selectedRestaurant, ...data };
        renderMenuHeader();
    }
    closeRestaurantModal();
    showToast(id ? `Updated "${name}" successfully!` : `Added "${name}" to restaurants!`);
}

// ── Admin Menu Item Management (Inside Restaurant) ────────────────
function openAddMenuItemModal() {
    if (!isUserAdmin()) {
        showToast('🔒 Only an Admin can add dishes. Please log in as Admin.', 'info');
        openAuthModal();
        return;
    }
    const modalTitle = document.getElementById('menu-item-modal-title');
    if (modalTitle) modalTitle.innerText = '🍽️ Add New Dish (Admin Only)';
    document.getElementById('edit-item-id').value = '';
    document.getElementById('edit-item-name').value = '';
    document.getElementById('edit-item-price').value = '199';
    document.getElementById('edit-item-category').value = 'Main Course';
    document.getElementById('edit-item-desc').value = '';
    document.getElementById('edit-item-image').value = '';
    document.getElementById('edit-item-is-veg').checked = true;
    document.getElementById('edit-item-is-special').checked = false;

    const delBtn = document.getElementById('btn-delete-menu-item');
    if (delBtn) delBtn.style.display = 'none';

    const modal = document.getElementById('menu-item-modal');
    if (modal) modal.classList.add('open');
}

function openEditMenuItemModal(itemId) {
    if (!isUserAdmin()) {
        showToast('🔒 Only an Admin can edit dishes. Please log in as Admin.', 'info');
        openAuthModal();
        return;
    }
    const item = AppState.menuItems.find(m => m.id === Number(itemId));
    if (!item) {
        showToast('Dish not found', 'info');
        return;
    }

    const modalTitle = document.getElementById('menu-item-modal-title');
    if (modalTitle) modalTitle.innerText = `✏️ Edit "${item.name}" (Admin Only)`;
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name || '';
    document.getElementById('edit-item-price').value = item.price || '';
    document.getElementById('edit-item-category').value = item.category || 'Main Course';
    document.getElementById('edit-item-desc').value = item.description || '';
    document.getElementById('edit-item-image').value = item.imageUrl || '';
    document.getElementById('edit-item-is-veg').checked = Boolean(item.isVeg);
    document.getElementById('edit-item-is-special').checked = Boolean(item.isChefSpecial);

    const delBtn = document.getElementById('btn-delete-menu-item');
    if (delBtn) delBtn.style.display = 'inline-block';

    const modal = document.getElementById('menu-item-modal');
    if (modal) modal.classList.add('open');
}

function closeMenuItemModal() {
    const modal = document.getElementById('menu-item-modal');
    if (modal) modal.classList.remove('open');
}

async function handleSaveMenuItem(e) {
    e.preventDefault();
    if (!isUserAdmin()) {
        showToast('🔒 Unauthorized: Only Admin accounts can modify dishes.', 'info');
        closeMenuItemModal();
        openAuthModal();
        return;
    }
    if (!AppState.selectedRestaurant) {
        showToast('No restaurant currently selected', 'info');
        return;
    }

    const id = document.getElementById('edit-item-id').value;
    const name = document.getElementById('edit-item-name').value.trim();
    const price = parseFloat(document.getElementById('edit-item-price').value) || 0;
    const category = document.getElementById('edit-item-category').value.trim() || 'Main Course';
    const description = document.getElementById('edit-item-desc').value.trim();
    const imageUrl = document.getElementById('edit-item-image').value.trim();
    const isVeg = document.getElementById('edit-item-is-veg').checked;
    const isChefSpecial = document.getElementById('edit-item-is-special').checked;

    const dishData = {
        name,
        price,
        category,
        description,
        imageUrl: imageUrl || (isVeg ? 'images/salad.jpg' : 'images/burger.jpg'),
        isVeg,
        isChefSpecial,
        restaurantId: AppState.selectedRestaurant.id
    };

    if (id) {
        dishData.id = Number(id);
    }

    await ApiService.saveMenuItem(AppState.selectedRestaurant.id, dishData);
    AppState.menuItems = await ApiService.getMenuItems(AppState.selectedRestaurant.id);
    renderMenuItems();
    closeMenuItemModal();
    showToast(id ? `Updated "${name}" successfully!` : `Added "${name}" to the menu!`, 'success');
}

async function handleDeleteMenuItem() {
    if (!isUserAdmin()) {
        showToast('🔒 Unauthorized: Only Admin accounts can delete dishes.', 'info');
        return;
    }
    const id = document.getElementById('edit-item-id').value;
    if (!id || !AppState.selectedRestaurant) return;

    if (!confirm('Are you sure you want to delete this dish from the menu?')) {
        return;
    }

    await ApiService.deleteMenuItem(AppState.selectedRestaurant.id, Number(id));
    AppState.menuItems = await ApiService.getMenuItems(AppState.selectedRestaurant.id);
    renderMenuItems();
    closeMenuItemModal();
    showToast('Dish removed from menu.', 'info');
}

// ── Delivery Location Management ─────────────────────
function updateDeliveryLocationUI() {
    const location = AppState.deliveryLocation || 'Indiranagar, Bengaluru';
    const locationEl = document.getElementById('current-delivery-location');
    if (locationEl) {
        locationEl.innerText = location;
    }
    const checkoutAddr = document.getElementById('checkout-address');
    if (checkoutAddr) {
        checkoutAddr.value = location;
    }
}

function openLocationModal() {
    const input = document.getElementById('custom-location-input');
    if (input) {
        input.value = AppState.deliveryLocation || 'Indiranagar, Bengaluru';
    }
    const modal = document.getElementById('location-modal');
    if (modal) modal.classList.add('open');
}

function closeLocationModal() {
    const modal = document.getElementById('location-modal');
    if (modal) modal.classList.remove('open');
}

function selectPresetLocation(locationText) {
    const input = document.getElementById('custom-location-input');
    if (input) input.value = locationText;
    saveDeliveryLocation(locationText);
}

function handleSaveLocation(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('custom-location-input');
    const newLocation = input ? input.value.trim() : '';
    if (!newLocation) {
        showToast('Please enter a delivery location', 'info');
        return;
    }
    saveDeliveryLocation(newLocation);
}

function saveDeliveryLocation(locationText) {
    AppState.deliveryLocation = locationText;
    localStorage.setItem('food_delivery_location', locationText);
    updateDeliveryLocationUI();
    closeLocationModal();
    showToast(`📍 Delivery place set to: ${locationText}`, 'success');
}

function useCurrentGpsLocation() {
    if ("geolocation" in navigator) {
        showToast('📍 Detecting current location...', 'info');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const detected = `Near (${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°), Bengaluru`;
                saveDeliveryLocation(detected);
            },
            (err) => {
                saveDeliveryLocation('Indiranagar 100ft Road, Bengaluru');
            },
            { timeout: 5000 }
        );
    } else {
        saveDeliveryLocation('Indiranagar 100ft Road, Bengaluru');
    }
}

