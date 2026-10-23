/**
 * QuickBite / FoodExpress - Core Web Application Logic
 * Features: Multi-restaurant cart, cancel order with 50% refund, QR payment, food availability
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
    initCustomScrollRail();

    // Check if there is an active tracking order saved
    const savedOrders = ApiService.getSavedOrders();
    if (savedOrders.length > 0 && savedOrders[0].status !== 'DELIVERED' && savedOrders[0].status !== 'CANCELLED') {
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
        // Availability: default to true if not set
        const available = item.available !== false;

        return `
            <div class="menu-item-card glass ${!available ? 'unavailable-card' : ''}">
                <div class="menu-item-details">
                    <div class="item-badges">
                        <span class="veg-tag ${item.isVeg ? 'veg' : 'non-veg'}">
                            ${item.isVeg ? '● VEG' : '▲ NON-VEG'}
                        </span>
                        ${item.isChefSpecial ? '<span class="special-tag">★ CHEF SPECIAL</span>' : ''}
                        <span class="availability-tag ${available ? 'available' : 'not-available'}">
                            ${available ? '✔ Available' : '✘ Not Available'}
                        </span>
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
                            ${!available ? `
                                <span class="btn-unavailable">Unavailable</span>
                            ` : qty === 0 ? `
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
                    ${!available ? '<div class="img-unavailable-overlay">SOLD OUT</div>' : ''}
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

// ── Cart Operations (Multi-Restaurant support) ────────────────────
function addToCart(itemId) {
    const item = AppState.menuItems.find(m => m.id === itemId) || 
                 SAMPLE_MENU_ITEMS.find(m => m.id === itemId);
    if (!item) return;

    // Check availability
    if (item.available === false) {
        showToast('This item is currently not available', 'info');
        return;
    }

    // Allow multi-restaurant ordering — no reset prompt
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

    // ALWAYS keep menu items in sync with current cart state so '+ ADD' is always correct!
    if (AppState.selectedRestaurant) {
        renderMenuItems();
    }
}

function clearCart() {
    AppState.cart = [];
    AppState.appliedPromo = null;
    saveCart();
    updateCartUI();
    showToast('🛒 Cart cleared. All menu items reset to + ADD', 'info');
}

// ── Global scroll helper — called by inline onclick on ▲/▼ buttons ────────
window.scrollCartItems = function(delta) {
    var c = document.getElementById('cart-items-container');
    if (!c) return;

    var maxScroll = c.scrollHeight - c.clientHeight;
    if (maxScroll <= 0) {
        c.style.transition = 'transform 0.12s ease';
        c.style.transform = delta > 0 ? 'translateY(-6px)' : 'translateY(6px)';
        setTimeout(function() { c.style.transform = ''; }, 140);
        return;
    }

    var startTop = c.scrollTop;
    c.scrollBy({ top: delta, behavior: 'smooth' });

    setTimeout(function() {
        if (delta > 0 && c.scrollTop <= startTop) {
            c.scrollTop = Math.min(startTop + delta, maxScroll);
        } else if (delta < 0 && c.scrollTop >= startTop) {
            c.scrollTop = Math.max(0, startTop + delta);
        }
        if (window.updateCustomRailThumb) window.updateCustomRailThumb();
    }, 120);
};

// Scroll helper for dishes list in Live Order Tracker
window.scrollTrackerItems = function(delta) {
    var c = document.getElementById('track-items-container');
    if (!c) return;
    c.scrollBy({ top: delta, behavior: 'smooth' });
    var max = c.scrollHeight - c.clientHeight;
    var fill = document.getElementById('tracker-scroll-fill');
    if (max > 0 && fill) {
        var pct = (c.scrollTop / max) * 100;
        fill.style.width = Math.max(25, pct) + '%';
    }
};

// ── Custom Scroll Rail (re-attaches every time cart drawer opens) ──────────
function initCustomScrollRail() {
    var container = document.getElementById('cart-items-container');
    var rail      = document.getElementById('custom-scroll-rail');
    var track     = document.getElementById('rail-track');
    var thumb     = document.getElementById('rail-thumb');

    if (!container || !rail || !track || !thumb) return;

    // ── Thumb position sync ──
    function updateRailThumb() {
        var scrollH  = container.scrollHeight;
        var clientH  = container.clientHeight;
        var maxScroll = scrollH - clientH;
        var trackH   = track.clientHeight;

        var btnUp   = document.getElementById('rail-btn-up');
        var btnDown = document.getElementById('rail-btn-down');

        if (maxScroll <= 2 || trackH <= 0) {
            thumb.style.display = 'none';
            if (btnUp)   btnUp.style.opacity   = '0.4';
            if (btnDown) btnDown.style.opacity = '0.4';
            return;
        }
        thumb.style.display = 'block';
        if (btnUp)   btnUp.style.opacity   = container.scrollTop > 5  ? '1' : '0.5';
        if (btnDown) btnDown.style.opacity = container.scrollTop < maxScroll - 5 ? '1' : '0.5';

        var thumbH   = Math.max(34, Math.min(trackH * (clientH / scrollH), trackH - 10));
        var maxThumb = trackH - thumbH;
        var thumbTop = maxScroll > 0 ? (container.scrollTop / maxScroll) * maxThumb : 0;

        thumb.style.height = thumbH + 'px';
        thumb.style.top    = thumbTop + 'px';
    }
    window.updateCustomRailThumb = updateRailThumb;

    container.addEventListener('scroll', updateRailThumb);
    rail.addEventListener('wheel', function(e) {
        container.scrollTop += e.deltaY;
        updateRailThumb();
        e.preventDefault();
    }, { passive: false });

    // ── Thumb drag ──
    thumb.addEventListener('mousedown', function(e) {
        e.preventDefault();
        var startY   = e.clientY;
        var startTop = parseFloat(thumb.style.top) || 0;
        document.body.style.userSelect = 'none';

        function onMove(ev) {
            var trackH  = track.clientHeight;
            var thumbH  = thumb.clientHeight;
            var maxTop  = trackH - thumbH;
            var newTop  = Math.max(0, Math.min(startTop + (ev.clientY - startY), maxTop));
            var maxSc   = container.scrollHeight - container.clientHeight;
            thumb.style.top      = newTop + 'px';
            container.scrollTop  = maxTop > 0 ? (newTop / maxTop) * maxSc : 0;
        }
        function onUp() {
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        }
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });

    // ── Track click-to-jump ──
    track.addEventListener('mousedown', function(e) {
        if (e.target === thumb) return;
        var rect    = track.getBoundingClientRect();
        var clickY  = e.clientY - rect.top;
        var thumbH  = thumb.clientHeight;
        var trackH  = track.clientHeight;
        var maxTop  = trackH - thumbH;
        var newTop  = Math.max(0, Math.min(clickY - thumbH / 2, maxTop));
        var maxSc   = container.scrollHeight - container.clientHeight;
        container.scrollTop = maxTop > 0 ? (newTop / maxTop) * maxSc : 0;
        updateRailThumb();
    });

    // ── Press-and-hold on ▲/▼ buttons ──
    var holdTimer    = null;
    var holdInterval = null;

    function startHold(delta) {
        stopHold();
        window.scrollCartItems(delta);
        holdTimer = setTimeout(function() {
            holdInterval = setInterval(function() {
                window.scrollCartItems(delta);
            }, 60);
        }, 220);
    }
    function stopHold() {
        clearTimeout(holdTimer);
        clearInterval(holdInterval);
    }

    // Re-grab buttons each time
    function bindRailBtns() {
        var up   = document.getElementById('rail-btn-up');
        var down = document.getElementById('rail-btn-down');
        if (up) {
            up.onclick = function() { window.scrollCartItems(-140); };
            up.onmousedown = function() { startHold(-140); };
            up.onmouseup = stopHold;
            up.onmouseleave = stopHold;
            up.ontouchstart = function() { startHold(-140); };
            up.ontouchend = stopHold;
        }
        if (down) {
            down.onclick = function() { window.scrollCartItems(140); };
            down.onmousedown = function() { startHold(140); };
            down.onmouseup = stopHold;
            down.onmouseleave = stopHold;
            down.ontouchstart = function() { startHold(140); };
            down.ontouchend = stopHold;
        }
    }
    bindRailBtns();
    window._bindRailBtns = bindRailBtns;

    setTimeout(updateRailThumb, 100);
}

function renderCartDrawer() {
    const container = document.getElementById('cart-items-container');
    const footer = document.getElementById('cart-footer');
    const scrollBar = document.getElementById('cart-scroll-indicator-bar');
    const scrollFill = document.getElementById('cart-scroll-line-fill');
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
        const scrollHint = document.getElementById('cart-scroll-hint');
        if (scrollHint) scrollHint.style.display = 'none';
        if (scrollBar) scrollBar.style.display = 'none';
        if (window.updateCustomRailThumb) window.updateCustomRailThumb();
        return;
    }

    footer.style.display = 'block';

    // Group cart items by restaurant
    const byRestaurant = {};
    AppState.cart.forEach(c => {
        const rName = c.restaurantName || 'Restaurant';
        if (!byRestaurant[rName]) byRestaurant[rName] = [];
        byRestaurant[rName].push(c);
    });

    const scrollHint = document.getElementById('cart-scroll-hint');
    if (scrollHint) {
        const totalItems = AppState.cart.reduce((sum, c) => sum + c.quantity, 0);
        const rCount = Object.keys(byRestaurant).length;
        scrollHint.style.display = 'block';
        if (totalItems > 1) {
            scrollHint.innerText = `↕ Scroll down straight line to view all ${totalItems} items (${rCount} kitchen${rCount > 1 ? 's' : ''})`;
        } else {
            scrollHint.innerText = `↕ 1 item in your order`;
        }
    }

    // Straight line scroll progress tracking & custom rail updates
    container.onscroll = () => {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0 && scrollBar && scrollFill) {
            scrollBar.style.display = 'block';
            const pct = (container.scrollTop / maxScroll) * 100;
            scrollFill.style.width = `${Math.max(15, pct)}%`;
        }
        if (window.updateCustomRailThumb) window.updateCustomRailThumb();
    };

    // Direct active wheel scrolling
    container.onwheel = (e) => {
        container.scrollTop += e.deltaY;
        e.preventDefault();
        if (window.updateCustomRailThumb) window.updateCustomRailThumb();
    };

    setTimeout(() => {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 15 && scrollBar && scrollFill) {
            scrollBar.style.display = 'block';
            const pct = (container.scrollTop / maxScroll) * 100;
            scrollFill.style.width = `${Math.max(15, pct)}%`;
        } else if (scrollBar) {
            scrollBar.style.display = 'none';
        }
        if (window.updateCustomRailThumb) window.updateCustomRailThumb();
    }, 70);

    const groupedHTML = Object.entries(byRestaurant).map(([rName, items]) => `
        <div class="cart-restaurant-group">
            <div class="cart-restaurant-label">🏪 ${rName}</div>
            ${items.map(c => `
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
            `).join('')}
        </div>
    `).join('');

    container.innerHTML = groupedHTML;

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
        setTimeout(() => {
            initCustomScrollRail();
            if (window.updateCustomRailThumb) window.updateCustomRailThumb();
        }, 120);
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

    // Automatically select UPI / GPay by default and render the real scannable QR code
    const upiRadio = document.querySelector('input[name="payment"][value="upi"]');
    if (upiRadio) {
        upiRadio.checked = true;
        onPaymentMethodChange(upiRadio);
    }

    // Default select "Ring bell" for delivery instructions
    const bellRadio = document.querySelector('input[name="delivery_instruction"][value="Ring bell"]');
    if (bellRadio) {
        bellRadio.checked = true;
        onDeliveryInstructionChange(bellRadio);
    }
}

function onDeliveryInstructionChange(radio) {
    const labels = ['inst-label-door', 'inst-label-bell', 'inst-label-contact'];
    labels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('payment-active');
    });

    const parentLabel = radio.closest('.payment-label');
    if (parentLabel) {
        parentLabel.classList.add('payment-active');
    }

    const notesEl = document.getElementById('checkout-notes');
    if (notesEl) {
        notesEl.value = radio.value;
    }
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('open');
}

// ── QR Code Panel (shown when UPI online payment selected) ──
function hideQRPanel() {
    const qrPanel = document.getElementById('qr-payment-panel');
    if (qrPanel) qrPanel.style.display = 'none';
}

function renderUPIQRCode(amount) {
    const box = document.getElementById('qr-code-box');
    if (!box) return;

    const formattedAmount = Number(amount || 0).toFixed(2);
    // Standard NPCI UPI URI: scanned by Google Pay, PhonePe, Paytm, BHIM, etc.
    const upiUri = `upi://pay?pa=quickbite@upi&pn=QuickBite%20Foods&am=${formattedAmount}&cu=INR&tn=Food%20Order`;

    box.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
        try {
            new QRCode(box, {
                text: upiUri,
                width: 170,
                height: 170,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });

            // Remove duplicate img immediately if canvas exists
            const immediateCanvas = box.querySelector('canvas');
            const immediateImg = box.querySelector('img');
            if (immediateCanvas && immediateImg) {
                immediateImg.remove();
            }

            setTimeout(() => {
                const canvas = box.querySelector('canvas');
                const img = box.querySelector('img');
                if (canvas) {
                    canvas.style.borderRadius = 'var(--radius-md)';
                    canvas.style.background = '#ffffff';
                    canvas.style.padding = '8px';
                    canvas.style.border = '2px solid var(--primary)';
                    canvas.style.boxShadow = '0 0 16px var(--primary-glow)';
                    canvas.style.display = 'block';
                    canvas.style.margin = '0 auto';
                    // Strictly guarantee ONLY ONE QR code is displayed
                    if (img) img.remove();
                } else if (img) {
                    img.style.borderRadius = 'var(--radius-md)';
                    img.style.background = '#ffffff';
                    img.style.padding = '8px';
                    img.style.border = '2px solid var(--primary)';
                    img.style.boxShadow = '0 0 16px var(--primary-glow)';
                    img.style.margin = '0 auto';
                    img.style.display = 'block';
                    img.style.width = '170px';
                    img.style.height = '170px';
                }
            }, 10);
            return;
        } catch (err) {
            console.warn('QRCode generation failed, falling back to dynamic image:', err);
        }
    }

    // Dynamic QR server fallback with local failover
    const fallbackImg = document.createElement('img');
    fallbackImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&ecc=M&data=${encodeURIComponent(upiUri)}`;
    fallbackImg.alt = 'UPI QR Code';
    fallbackImg.className = 'qr-code-img';
    fallbackImg.onerror = function() {
        this.src = 'images/upi_qr.png';
    };
    box.appendChild(fallbackImg);
}

function onPaymentMethodChange(radio) {
    const qrPanel = document.getElementById('qr-payment-panel');
    const amountEl = document.getElementById('qr-amount-display');

    // Move the orange active border to the selected payment label (UPI or Cash on Delivery)
    const labels = ['pay-label-upi', 'pay-label-cod'];
    labels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('payment-active');
    });
    const selectedLabel = document.getElementById(`pay-label-${radio.value}`);
    if (selectedLabel) selectedLabel.classList.add('payment-active');

    if (!qrPanel) return;

    if (radio.value === 'upi') {
        // Calculate exact total amount
        const subtotal = AppState.cart.reduce((sum, c) => sum + (((c.item && c.item.price) || 0) * c.quantity), 0);
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
        const tax = Math.max(0, subtotal - discount) * 0.05;
        const grandTotal = Math.max(0, subtotal - discount + deliveryFee + tax);

        if (amountEl) amountEl.innerText = `₹${grandTotal.toFixed(2)}`;
        renderUPIQRCode(grandTotal);
        qrPanel.style.display = 'block';
    } else {
        qrPanel.style.display = 'none';
    }
}

// ── Submit Order ──────────────────────────────────────
async function submitOrder(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
        const addressEl = document.getElementById('checkout-address');
        const notesEl = document.getElementById('checkout-notes');
        const address = addressEl ? addressEl.value.trim() : '';
        const notes = notesEl ? notesEl.value.trim() : '';

        if (!address) {
            showToast('Please enter your delivery address', 'info');
            return;
        }

        if (!AppState.cart || AppState.cart.length === 0) {
            showToast('Your cart is empty. Please add items before checking out.', 'info');
            closeCheckoutModal();
            return;
        }

        const subtotal = AppState.cart.reduce((sum, c) => sum + (((c.item && c.item.price) || 0) * c.quantity), 0);
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

        const tax = (subtotal - discount) * 0.05;
        const totalAmount = Math.max(0, subtotal - discount + deliveryFee + tax);

        // Build restaurant names from multi-restaurant cart
        const restaurantNames = [...new Set(AppState.cart.map(c => c.restaurantName || 'Restaurant'))].join(' + ');

        const orderData = {
            restaurantName: restaurantNames,
            items: JSON.parse(JSON.stringify(AppState.cart)),
            subtotal: subtotal,
            discount: discount,
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
    } catch (err) {
        console.error('Error in submitOrder:', err);
        showToast('Error placing order. Please try again.', 'info');
    }
}

// ── Live Order Tracker ──────────────────────────────────
function openOrderTrackerModal(order) {
    const modal = document.getElementById('order-tracker-modal');
    renderOrderTracking(order);
    if (modal) modal.classList.add('open');
}

function closeOrderTrackerModal() {
    const modal = document.getElementById('order-tracker-modal');
    if (modal) modal.classList.remove('open');
    if (AppState.activeOrder && AppState.activeOrder.status === 'DELIVERED') {
        AppState.cart = [];
        AppState.appliedPromo = null;
        saveCart();
        updateCartUI();
        if (AppState.selectedRestaurant) {
            renderMenuItems();
        }
    }
}

function renderOrderTracking(order) {
    if (!order) return;
    const orderIdEl = document.getElementById('track-order-id');
    const rNameEl = document.getElementById('track-restaurant');
    const addrEl = document.getElementById('track-address');
    const totalEl = document.getElementById('track-total');
    if (orderIdEl) orderIdEl.innerText = order.id || '#ORD-1001';
    if (rNameEl) rNameEl.innerText = order.restaurantName || "Express Kitchen";
    if (addrEl) addrEl.innerText = order.deliveryAddress || "Indiranagar, Bengaluru";
    if (totalEl) totalEl.innerText = `₹${(order.totalAmount || 0).toFixed(2)}`;

    const statuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIdx = statuses.indexOf(order.status);

    const progressLine = document.getElementById('track-progress-line');
    const runner = document.getElementById('delivery-runner');

    if (currentIdx !== -1) {
        const ratio = currentIdx / (statuses.length - 1);
        if (progressLine) {
            progressLine.style.width = `calc((100% - 40px) * ${ratio})`;
        }
        if (runner) {
            if (order.status === 'CANCELLED') {
                runner.style.display = 'none';
            } else {
                runner.style.display = 'flex';
                runner.style.left = `calc(20px + (100% - 40px) * ${ratio})`;

                const runnerIcon = runner.querySelector('.runner-icon');
                const runnerPack = runner.querySelector('.runner-pack');
                if (order.status === 'OUT_FOR_DELIVERY') {
                    if (runnerIcon) runnerIcon.innerText = '🏃‍♂️';
                    if (runnerPack) runnerPack.innerText = '🛵💨';
                } else if (order.status === 'DELIVERED') {
                    if (runnerIcon) runnerIcon.innerText = '🎉';
                    if (runnerPack) runnerPack.innerText = '🍽️';
                } else {
                    if (runnerIcon) runnerIcon.innerText = '🏃‍♂️';
                    if (runnerPack) runnerPack.innerText = '📦';
                }
            }
        }
    } else {
        if (progressLine) progressLine.style.width = '0%';
        if (runner) runner.style.display = 'none';
    }

    // Render ordered dishes inside tracker so customer can scroll to see what they ordered
    const itemsContainer = document.getElementById('track-items-container');
    const itemsCountEl = document.getElementById('tracker-items-count');
    if (itemsContainer && order.items && order.items.length > 0) {
        if (itemsCountEl) itemsCountEl.innerText = `(${order.items.length} item${order.items.length > 1 ? 's' : ''})`;
        itemsContainer.innerHTML = order.items.map(c => `
            <div class="tracker-dish-row">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="${(c.item && c.item.imageUrl) || 'images/pizza.jpg'}" alt="${c.item ? c.item.name : 'Dish'}" style="width: 28px; height: 28px; border-radius: 4px; object-fit: cover;">
                    <span style="font-weight: 600; color: #fff;">${c.item ? c.item.name : 'Item'} <strong style="color: var(--primary);">× ${c.quantity}</strong></span>
                </div>
                <span style="color: var(--accent-emerald); font-weight: 700;">₹${((c.item ? c.item.price : 0) * c.quantity).toFixed(0)}</span>
            </div>
        `).join('');

        itemsContainer.onscroll = () => {
            const max = itemsContainer.scrollHeight - itemsContainer.clientHeight;
            const fill = document.getElementById('tracker-scroll-fill');
            if (max > 0 && fill) {
                const pct = (itemsContainer.scrollTop / max) * 100;
                fill.style.width = `${Math.max(25, pct)}%`;
            }
        };
    } else if (itemsContainer) {
        if (itemsCountEl) itemsCountEl.innerText = '(0)';
        itemsContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">Dishes in preparation</div>';
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
        'DELIVERED': 'Delivered! Bon appétit! 🍽',
        'CANCELLED': '❌ Order cancelled. Refund processing...'
    };
    if (statusMessage) {
        statusMessage.innerText = messages[order.status] || order.status;
    }

    // Show/hide cancel button based on cancellable statuses (active before DELIVERED)
    const cancelBtn = document.getElementById('btn-cancel-order');
    if (cancelBtn) {
        const cancellable = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'];
        cancelBtn.style.display = cancellable.includes(order.status) ? 'block' : 'none';
    }

    // Show/hide delivered actions box
    const deliveredBox = document.getElementById('delivered-actions-box');
    if (deliveredBox) {
        deliveredBox.style.display = order.status === 'DELIVERED' ? 'block' : 'none';
    }

    // Show/hide cancelled actions box with 50% refund
    const cancelledBox = document.getElementById('cancelled-actions-box');
    const refundEl = document.getElementById('track-refund-amount');
    if (cancelledBox) {
        if (order.status === 'CANCELLED') {
            cancelledBox.style.display = 'block';
            if (refundEl) {
                const refund = ((order.totalAmount || 0) * 0.5).toFixed(2);
                refundEl.innerText = `₹${refund}`;
            }
        } else {
            cancelledBox.style.display = 'none';
        }
    }
}

// ── Cancel Order with 50% Refund ────────────────────
function cancelOrder() {
    if (!AppState.activeOrder) return;
    const order = AppState.activeOrder;

    const cancellable = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'];
    if (!cancellable.includes(order.status)) {
        showToast('Order cannot be cancelled at this stage', 'info');
        return;
    }

    // Open the cancel confirmation modal
    const refundAmount = ((order.totalAmount || 0) * 0.5).toFixed(2);
    const refundEl = document.getElementById('cancel-refund-amount');
    const orderIdEl = document.getElementById('cancel-order-id');
    if (refundEl) refundEl.innerText = `₹${refundAmount}`;
    if (orderIdEl) orderIdEl.innerText = order.id || '#ORD';
    const cancelModal = document.getElementById('cancel-confirm-modal');
    if (cancelModal) cancelModal.classList.add('open');
}

function closeCancelModal() {
    const cancelModal = document.getElementById('cancel-confirm-modal');
    if (cancelModal) cancelModal.classList.remove('open');
}

function confirmCancelOrder() {
    if (!AppState.activeOrder) return;
    const order = AppState.activeOrder;
    const refundAmount = ((order.totalAmount || 0) * 0.5).toFixed(2);

    order.status = 'CANCELLED';
    order.refundAmount = refundAmount;
    if (AppState.orderTimer) clearInterval(AppState.orderTimer);

    // Update localStorage
    const orders = ApiService.getSavedOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx !== -1) {
        orders[idx].status = 'CANCELLED';
        orders[idx].refundAmount = refundAmount;
        localStorage.setItem('food_orders', JSON.stringify(orders));
    }

    // Reset dishes so customer can order again
    AppState.cart = [];
    AppState.appliedPromo = null;
    saveCart();
    updateCartUI();
    if (AppState.selectedRestaurant) {
        renderMenuItems();
    }

    renderOrderTracking(order);
    closeCancelModal();
    showToast(`❌ Order cancelled. ₹${refundAmount} (50% refund) credited to your account.`, 'success');
}

function startOrderSimulation(order) {
    if (AppState.orderTimer) clearInterval(AppState.orderTimer);

    const statuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    
    AppState.orderTimer = setInterval(() => {
        if (order.status === 'CANCELLED') {
            clearInterval(AppState.orderTimer);
            return;
        }
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
                // Food was delivered! Reset cart and dishes to '+ ADD'
                AppState.cart = [];
                AppState.appliedPromo = null;
                saveCart();
                updateCartUI();
                if (AppState.selectedRestaurant) {
                    renderMenuItems();
                }

                showToast(`🎉 Order ${order.id} has been delivered! Dishes now reset to + ADD for your next order.`, 'success');
                clearInterval(AppState.orderTimer);
            }
        } else {
            clearInterval(AppState.orderTimer);
        }
    }, 12000); // Progresses step every 12 seconds in demo
}

// ── User Auth & Modal (Admin-only Sign In) ─────────────
function openAuthModal() {
    const idInput = document.getElementById('admin-id-input');
    const pwdInput = document.getElementById('admin-pwd-input');
    const icon = document.getElementById('admin-pwd-icon');
    if (idInput) idInput.value = '';
    if (pwdInput) { pwdInput.value = ''; pwdInput.type = 'password'; }
    if (icon) icon.innerText = '👁️';
    document.getElementById('auth-modal').classList.add('open');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('open');
}

function toggleAdminPwd() {
    const pwdInput = document.getElementById('admin-pwd-input');
    const icon = document.getElementById('admin-pwd-icon');
    if (!pwdInput) return;
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        if (icon) icon.innerText = '🔒';
    } else {
        pwdInput.type = 'password';
        if (icon) icon.innerText = '👁️';
    }
}

// Keep old togglePasswordVisibility for backward compat
function togglePasswordVisibility() { toggleAdminPwd(); }

async function submitAdminLogin(e) {
    if (e) e.preventDefault();
    const adminId = (document.getElementById('admin-id-input').value || '').trim();
    const password = (document.getElementById('admin-pwd-input').value || '').trim();

    if (!adminId || !password) {
        showToast('Please enter both Admin ID and Password', 'info');
        return;
    }

    const res = await ApiService.login(adminId, password);
    if (res.success && isUserAdmin()) {
        renderUserAuthStatus();
        renderAdminControls();
        renderRestaurants();
        if (AppState.selectedRestaurant) {
            renderMenuHeader();
            renderMenuItems();
        }
        closeAuthModal();
        showToast(`✅ Successfully signed in as 👑 Admin!`, 'success');
    } else {
        showToast(res.message || '❌ Invalid Admin ID or Password. Please try again.', 'info');
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

    if (isUserAdmin()) {
        container.innerHTML = `
            <button class="btn-nav-orders" onclick="handleLogout()" title="Click to logout" style="border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); color: #c4b5fd;">
                👑 ${ApiService.currentUser.name || 'Admin'} (Logout)
            </button>
        `;
    } else {
        // ALWAYS show Admin Login button when not authenticated as admin!
        container.innerHTML = `
            <button class="btn-nav-orders" onclick="openAuthModal()" title="Admin login with ID & Password">
                👑 Admin Login
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

// ── Admin Menu Item Management ────────────────────────
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
    document.getElementById('edit-item-available').checked = true;

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
    document.getElementById('edit-item-available').checked = item.available !== false;

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
    const available = document.getElementById('edit-item-available').checked;

    const dishData = {
        name,
        price,
        category,
        description,
        imageUrl: imageUrl || (isVeg ? 'images/salad.jpg' : 'images/burger.jpg'),
        isVeg,
        isChefSpecial,
        available,
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
