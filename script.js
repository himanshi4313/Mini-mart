// ─────────────────────────────────────────
//  PS STORE — script.js
// ─────────────────────────────────────────

// ── State ──────────────────────────────────
let cart            = [];
let allProducts     = [];
let wishlist        = [];
let isAdminAuth     = false;
let editProductId   = null;
let appliedCoupon   = null;
let deferredPWAPrompt = null;
let currentLat      = null;
let currentLng      = null;
let currentLocText  = "";
let locDebounce     = null;

const DELIVERY_FREE_THRESHOLD = 1500;
const AUTO_COUPONS = [
    { minOrder: 2500, code: "SAVE4",   type: "percent", value: 4   },
    { minOrder: 2000, code: "SAVE2.5", type: "percent", value: 2.5 },
];

// ─────────────────────────────────────────
//  API BASE URL
// ─────────────────────────────────────────
const API = "https://mini-mart-liard.vercel.app";


window.addEventListener("DOMContentLoaded", () => {
    updateUserUI();
    requestNotificationPermission();

    setTimeout(() => {
        const splash = document.getElementById("splash-screen");
        if (splash) splash.style.display = "none";
        const nav = document.querySelector(".bottom-nav");
        if (nav) nav.style.display = "flex";
    }, 2500);

    loadAllData();
    startBannerRotation();
});

function requestNotificationPermission() {
    if (Notification && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// ─────────────────────────────────────────
//  LOAD PRODUCTS
// ─────────────────────────────────────────
function loadAllData() {
    renderSkeleton("productList", 6);

    fetch(API + "/products")
        .then(r => r.json())
        .then(products => {
            allProducts = products;
            loadWishlist();
            const deals = allProducts.filter(p => p.discount > 0);
            renderProducts(deals, "productList");
            generateCategories(allProducts);
            if (isAdminAuth) {
                renderAdminInventory();
                loadAdminOrders();
            }
        })
        .catch(err => {
            console.error("Error loading products:", err);
            document.getElementById("productList").innerHTML =
                `<p style="text-align:center;color:#e53935;padding:20px;">Failed to load products. Check server.</p>`;
        });
}

// ─────────────────────────────────────────
//  RENDER PRODUCTS
// ─────────────────────────────────────────
function renderProducts(list, targetId) {
    if (!list.length) {
        document.getElementById(targetId).innerHTML =
            `<p style="text-align:center;color:#999;padding:30px;">No products found.</p>`;
        return;
    }
    let html = "";
    list.forEach(p => {
        const finalPrice = p.discount
            ? Math.round(p.price - (p.price * p.discount / 100))
            : p.price;
        const isWishlisted = wishlist.includes(p._id);
        const heartColor   = isWishlisted ? "#e53935" : "#ccc";
        const heartIcon    = isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart";

        html += `
        <div class="card">
            <div class="card-img-wrap">
                <img src="images/${p.image}" alt="${p.name}" onerror="this.src='images/default.png'">
                ${p.discount ? `<span class="offer">${p.discount}% OFF</span>` : ""}
                <button class="wish-btn" style="color:${heartColor};" onclick="toggleWishlist('${p._id}',this)">
                    <i class="${heartIcon}"></i>
                </button>
            </div>
            <h2>${p.name}</h2>
            <div class="card-price-row">
                <span class="card-price">Rs.${finalPrice}</span>
                ${p.discount ? `<span class="card-mrp">Rs.${p.price}</span>` : ""}
            </div>
            <p class="card-stock ${p.stock <= 5 ? "low-stock" : ""}">${p.stock <= 5 ? `Only ${p.stock} left!` : `Stock: ${p.stock}`}</p>
            <input type="number" value="1" min="1" max="${p.stock}" class="qty">
            <div class="card-btn-row">
                <button class="card-add-btn" onclick="addToCart('${p._id}','${p.name.replace(/'/g,"\\'")}',${finalPrice},${p.price},'${p.image}',${p.discount||0},this)">
                    Add to Cart
                </button>
                <button class="card-buy-btn" onclick="buyNow('${p._id}','${p.name.replace(/'/g,"\\'")}',${finalPrice},${p.price},'${p.image}',${p.discount||0})">
                    Buy Now
                </button>
            </div>
        </div>`;
    });
    document.getElementById(targetId).innerHTML = html;
}

// ─────────────────────────────────────────
//  CATEGORIES
// ─────────────────────────────────────────
const CATEGORY_ORDER = [
    "Grocery","Cosmetics","Dry Fruits","Dairy Products",
    "Cold Drinks","Stationery","Plastic Items","Undergarments","Cleaning"
];

function generateCategories(products) {
    const present = CATEGORY_ORDER.filter(c => products.some(p => p.category === c));
    if (!present.length) return;

    let html = "";
    present.forEach((cat, i) => {
        const img = cat.toLowerCase().replace(/\s+/g, "-") + ".png";
        html += `
        <div class="store-card ${i === 0 ? "active-cat" : ""}"
             onclick="filterCategory('${cat}', this)">
            <img src="images/categories/${img}"
                 onerror="this.src='images/categories/default.png'"
                 class="category-img" alt="${cat}">
            <p>${cat}</p>
        </div>`;
    });
    document.getElementById("categoryTabs").innerHTML = html;
    filterCategory(present[0]);
}

function filterCategory(name, el) {
    if (el) {
        document.querySelectorAll(".store-card")
            .forEach(c => c.classList.remove("active-cat"));
        el.classList.add("active-cat");
    }
    const title = document.getElementById("categoryTitle");
    if (title) title.textContent = name;
    renderProducts(allProducts.filter(p => p.category === name), "categoryProductList");
}

// ─────────────────────────────────────────
//  SEARCH
// ─────────────────────────────────────────
function searchProducts() {
    const kw = document.getElementById("searchInput").value.toLowerCase().trim();
    const filtered = kw
        ? allProducts.filter(p => p.name.toLowerCase().includes(kw))
        : allProducts;

    const homeVisible    = document.getElementById("home-view").style.display !== "none";
    const catVisible     = document.getElementById("category-view").style.display !== "none";
    const adminVisible   = document.getElementById("admin-view").style.display !== "none";

    if (homeVisible)  renderProducts(filtered.filter(p => p.discount > 0), "productList");
    if (catVisible)   renderProducts(filtered, "categoryProductList");
    if (adminVisible) renderAdminInventory(filtered);
}

function searchAdminProducts(kw) {
    const filtered = kw
        ? allProducts.filter(p => p.name.toLowerCase().includes(kw.toLowerCase()))
        : allProducts;
    renderAdminInventory(filtered);
}

// ─────────────────────────────────────────
//  CART
// ─────────────────────────────────────────
function addToCart(id, name, price, originalPrice, image, discount, btn) {
    const qtyInput = btn.parentElement.querySelector(".qty");
    const qty = parseInt(qtyInput.value) || 1;

    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id, name, price, originalPrice, image, discount, qty });
    }
    updateCartUI();
    showToast(`${name} added to cart 🛒`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    // re-check auto coupon after removal
    checkAutoCoupon();
    updateCartUI();
}

function updateCartUI() {
    const cartList    = document.getElementById("cartList");
    const cartSummary = document.getElementById("cartSummary");
    const emptyCart   = document.getElementById("emptyCart");
    const badge       = document.getElementById("cartBadge");

    let totalItems   = 0;
    let itemsTotal   = 0;
    let productDisc  = 0;
    let html         = "";

    cart.forEach((item, i) => {
        totalItems  += item.qty;
        itemsTotal  += item.originalPrice * item.qty;
        productDisc += (item.originalPrice - item.price) * item.qty;

        html += `
        <div class="cart-item">
            <img src="images/${item.image}" onerror="this.src='images/default.png'" alt="${item.name}">
            <div class="cart-details">
                <h4>${item.name}</h4>
                <p>₹${item.price} × ${item.qty} = <b>₹${item.price * item.qty}</b></p>
                ${item.discount ? `<span class="cart-discount-tag">${item.discount}% OFF</span>` : ""}
            </div>
            <div class="cart-qty-controls">
                <button onclick="changeQty(${i},-1)">−</button>
                <span>${item.qty}</span>
                <button onclick="changeQty(${i},1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    });

    if (cart.length === 0) {
        if (cartList)    cartList.innerHTML = "";
        if (cartSummary) cartSummary.style.display = "none";
        if (emptyCart)   emptyCart.style.display = "block";
        badge.style.display = "none";
        badge.textContent   = "0";
        return;
    }

    if (cartList)  cartList.innerHTML = html;
    if (emptyCart) emptyCart.style.display = "none";
    if (cartSummary) cartSummary.style.display = "block";

    badge.textContent   = totalItems;
    badge.style.display = "flex";

    checkAutoCoupon(itemsTotal - productDisc);
    updateSummaryUI(itemsTotal, productDisc);
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    checkAutoCoupon();
    updateCartUI();
}

// ─────────────────────────────────────────
//  ORDER SUMMARY & COUPONS
// ─────────────────────────────────────────
function checkAutoCoupon(subtotal) {
    if (subtotal === undefined) {
        subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    }
    // Only auto-apply if no manual coupon
    if (appliedCoupon && appliedCoupon.manual) return;

    let best = null;
    for (const c of AUTO_COUPONS) {
        if (subtotal >= c.minOrder) { best = c; break; }
    }
    if (best) {
        appliedCoupon = { ...best, manual: false };
    } else if (appliedCoupon && !appliedCoupon.manual) {
        appliedCoupon = null;
    }
}

function updateSummaryUI(itemsTotal, productDisc) {
    const subtotal       = itemsTotal - productDisc;
    const delivery       = subtotal >= DELIVERY_FREE_THRESHOLD ? 0 : 40;
    let   couponDisc     = 0;

    if (appliedCoupon) {
        couponDisc = appliedCoupon.type === "percent"
            ? Math.round(subtotal * appliedCoupon.value / 100)
            : appliedCoupon.value;
    }

    const grandTotal = Math.max(0, subtotal - couponDisc + delivery);

    // Cart page
    setEl("itemsTotal",     `₹${itemsTotal}`);
    setEl("productDiscount",`-₹${productDisc}`);
    setEl("deliveryCharge", delivery === 0 ? "FREE 🎉" : `₹${delivery}`);
    setEl("grandTotal",     `₹${grandTotal}`);

    const couponRow  = document.getElementById("couponDiscountRow");
    const couponCode = document.getElementById("couponCodeApplied");
    const couponAmt  = document.getElementById("couponDiscount");
    if (appliedCoupon) {
        if (couponRow)  couponRow.style.display  = "flex";
        if (couponCode) couponCode.textContent   = appliedCoupon.code;
        if (couponAmt)  couponAmt.textContent    = `-₹${couponDisc}`;
        const inp = document.getElementById("couponInput");
        if (inp && !appliedCoupon.manual) inp.value = appliedCoupon.code;
    } else {
        if (couponRow) couponRow.style.display = "none";
    }

    // Progress bar
    updateProgressBar(subtotal);

    // Sync checkout page
    syncCheckoutSummary(itemsTotal, productDisc, delivery, couponDisc, grandTotal);
}

function syncCheckoutSummary(itemsTotal, productDisc, delivery, couponDisc, grandTotal) {
    setEl("coItemsTotal",     `₹${itemsTotal}`);
    setEl("coProductDiscount",`-₹${productDisc}`);
    setEl("coDelivery",       delivery === 0 ? "FREE 🎉" : `₹${delivery}`);
    setEl("coGrandTotal",     `₹${grandTotal}`);

    const coCouponRow = document.getElementById("coCouponRow");
    if (appliedCoupon && coCouponRow) {
        coCouponRow.style.display = "flex";
        setEl("coCouponCode",     appliedCoupon.code);
        setEl("coCouponDiscount", `-₹${couponDisc}`);
    } else if (coCouponRow) {
        coCouponRow.style.display = "none";
    }
}

function updateProgressBar(subtotal) {
    const fill = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    if (!fill || !text) return;

    const pct  = Math.min(100, (subtotal / DELIVERY_FREE_THRESHOLD) * 100);
    fill.style.width = pct + "%";

    if (subtotal >= DELIVERY_FREE_THRESHOLD) {
        text.innerHTML = "🎉 You got <b>FREE Delivery!</b>";
        fill.style.background = "#0c831f";
    } else {
        const need = DELIVERY_FREE_THRESHOLD - subtotal;
        text.innerHTML = `Add <b>₹${need}</b> more for FREE Delivery 🚚`;
        fill.style.background = "";
    }
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val;
}

// Manual coupon
function applyCoupon() {
    const code = (document.getElementById("couponInput").value || "").trim().toUpperCase();
    if (!code) { showCouponMsg("Enter a coupon code", "error"); return; }

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

    fetch(API + "/coupons/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code, orderTotal: subtotal })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            showCouponMsg(data.message, "error");
            appliedCoupon = null;
        } else {
            appliedCoupon = { ...data.coupon, discount: data.discount, manual: true };
            showCouponMsg(`✅ ${code} applied! You save ₹${data.discount}`, "success");
            updateCartUI();
        }
    })
    .catch(() => showCouponMsg("Server error. Try again.", "error"));
}

function showCouponMsg(msg, type) {
    const el = document.getElementById("couponMsg");
    if (!el) return;
    el.textContent  = msg;
    el.className    = "coupon-msg " + type;
}

// ─────────────────────────────────────────
//  LOCATION
// ─────────────────────────────────────────
function openLocationModal() {
    document.getElementById("locationModal").style.display = "flex";
    loadSavedAddresses();
}

function closeLocationModal() {
    document.getElementById("locationModal").style.display = "none";
}

function setLocStatus(msg, isError) {
    const el = document.getElementById("locStatus");
    if (!el) return;
    el.textContent  = msg;
    el.style.color  = isError ? "#e53935" : "#0c831f";
}

function detectLocation() {
    if (!navigator.geolocation) {
        setLocStatus("Geolocation not supported by your browser.", true);
        return;
    }
    setLocStatus("📡 Detecting your location...", false);

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            setLocStatus("📍 Location detected! Fetching address...", false);
            await reverseGeocode(currentLat, currentLng);
        },
        (err) => {
            const msgs = {
                1: "Location permission denied. Please allow location in browser settings.",
                2: "Location unavailable. Try manual search.",
                3: "Location request timed out. Try again."
            };
            setLocStatus(msgs[err.code] || "Location error.", true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

async function reverseGeocode(lat, lng) {
    try {
        // Try Google Maps Geocoding first (most accurate)
        const googleRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&language=en&region=IN`
        );
        const googleData = await googleRes.json();

        if (googleData.status === "OK" && googleData.results.length > 0) {
            const addr = googleData.results[0].formatted_address;
            currentLocText = addr;
            showSelectedAddress(addr);
            showMapPreview(lat, lng);
            setLocStatus("✅ Location found!", false);
            return;
        }
    } catch (e) { /* fallback to nominatim */ }

    // Fallback: Nominatim
    try {
        const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        // Build a clean address from parts
        const a    = data.address || {};
        const parts = [
            a.house_number,
            a.road || a.pedestrian || a.footway,
            a.suburb || a.neighbourhood || a.quarter,
            a.city || a.town || a.village || a.county,
            a.state,
            a.postcode
        ].filter(Boolean);
        const addr = parts.length > 2 ? parts.join(", ") : data.display_name;
        currentLocText = addr;
        showSelectedAddress(addr);
        showMapPreview(lat, lng);
        setLocStatus("✅ Location found!", false);
    } catch {
        currentLocText = `${lat}, ${lng}`;
        showSelectedAddress(currentLocText);
        showMapPreview(lat, lng);
        setLocStatus("Address lookup failed, using coordinates.", true);
    }
}

function showMapPreview(lat, lng) {
    const box    = document.getElementById("mapPreview");
    const iframe = document.getElementById("mapIframe");
    const coords = document.getElementById("mapCoords");
    if (!box || !iframe) return;

    iframe.src   = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
    box.style.display = "block";
    if (coords) coords.textContent = `📌 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function showSelectedAddress(addr) {
    const box  = document.getElementById("selectedAddressBox");
    const text = document.getElementById("selectedAddressText");
    if (!box || !text) return;
    text.textContent = addr;
    box.style.display = "flex";
    const inp = document.getElementById("locInput");
    if (inp) inp.value = addr;
}

// Manual search with Nominatim
let searchDebounce = null;
function onLocSearchInput() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        const q = document.getElementById("locInput").value.trim();
        if (q.length > 2) searchLocationByText(q);
    }, 600);
}

function searchLocationByText(q) {
    if (!q) q = document.getElementById("locInput").value.trim();
    if (!q) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in&accept-language=en`)
        .then(r => r.json())
        .then(results => {
            const box = document.getElementById("locSuggestions");
            if (!box) return;
            if (!results.length) { box.innerHTML = `<div class="loc-sug-item">No results found</div>`; return; }
            box.innerHTML = results.map(r =>
                `<div class="loc-sug-item" onclick="selectSuggestion('${r.display_name.replace(/'/g,"\\'")}',${r.lat},${r.lon})">
                    <i class="fa-solid fa-map-pin" style="color:#df4b0b;margin-right:8px;"></i>${r.display_name}
                </div>`
            ).join("");
        })
        .catch(() => {});
}

function selectSuggestion(name, lat, lng) {
    currentLat      = parseFloat(lat);
    currentLng      = parseFloat(lng);
    currentLocText  = name;
    document.getElementById("locSuggestions").innerHTML = "";
    document.getElementById("locInput").value = name;
    showSelectedAddress(name);
    showMapPreview(currentLat, currentLng);
    setLocStatus("✅ Location selected!", false);
}

function saveLocation() {
    const addr = currentLocText || document.getElementById("locInput").value.trim();
    if (!addr) { setLocStatus("Please select or search a location first.", true); return; }

    localStorage.setItem("psLoc",     addr);
    localStorage.setItem("psLat",     currentLat || "");
    localStorage.setItem("psLng",     currentLng || "");

    document.getElementById("userLocation").textContent = addr;

    // Update checkout location display
    const coLoc = document.getElementById("checkoutLocationText");
    if (coLoc) coLoc.textContent = addr;
    const coCoords = document.getElementById("checkoutMapCoords");
    if (coCoords && currentLat) {
        coCoords.style.display  = "block";
        coCoords.textContent    = `📌 ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`;
    }

    // Save to DB if logged in
    const user = getUser();
    if (user) {
        fetch(API + `/users/${user.email}/location`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ location: addr, latitude: currentLat, longitude: currentLng })
        }).catch(() => {});
    }

    closeLocationModal();
    showToast("📍 Location saved!");
}

function loadSavedAddresses() {
    const user = getUser();
    if (!user) return;

    fetch(API + `/users/${user.email}`)
        .then(r => r.json())
        .then(data => {
            const addrs = data.savedAddresses || [];
            const box   = document.getElementById("savedAddressesBox");
            const list  = document.getElementById("savedAddressesList");
            if (!box || !list || !addrs.length) return;
            box.style.display = "block";
            list.innerHTML = addrs.map(a =>
                `<div class="saved-addr-item" onclick="useSavedAddress('${a.replace(/'/g,"\\'")}')">
                    <i class="fa-solid fa-location-dot"></i> ${a}
                </div>`
            ).join("");
        })
        .catch(() => {});
}

function useSavedAddress(addr) {
    currentLocText = addr;
    document.getElementById("locInput").value = addr;
    showSelectedAddress(addr);
    setLocStatus("✅ Saved address selected!", false);
}

// Load saved location on startup
window.addEventListener("load", () => {
    const loc = localStorage.getItem("psLoc");
    if (loc) {
        document.getElementById("userLocation").textContent = loc;
        currentLocText = loc;
        currentLat     = parseFloat(localStorage.getItem("psLat")) || null;
        currentLng     = parseFloat(localStorage.getItem("psLng")) || null;
        const coLoc    = document.getElementById("checkoutLocationText");
        if (coLoc) coLoc.textContent = loc;
    }
});

// ─────────────────────────────────────────
//  CHECKOUT & PLACE ORDER
// ─────────────────────────────────────────
function showCheckoutPage() {
    if (!cart.length) { alert("Your cart is empty!"); return; }
    const user = getUser();
    if (!user) { openGoogleLogin(); return; }

    // Pre-fill name/mobile from user
    const nameEl   = document.getElementById("custName");
    const mobileEl = document.getElementById("custMobile");
    if (nameEl   && !nameEl.value)   nameEl.value   = user.name  || "";
    if (mobileEl && !mobileEl.value) mobileEl.value = user.mobile || "";

    switchPage("checkout");
}

function placeOrder() {
    const user    = getUser();
    if (!user) { openGoogleLogin(); return; }

    const name    = document.getElementById("custName").value.trim();
    const mobile  = document.getElementById("custMobile").value.trim();
    const address = document.getElementById("custAddress").value.trim();

    if (!name)    { showToast("Please enter your name"); return; }
    if (!mobile || mobile.length < 10) { showToast("Please enter valid mobile number"); return; }
    if (!address) { showToast("Please enter delivery address"); return; }

    const payment = document.querySelector('input[name="payment"]:checked')?.value || "COD";

    // Recalculate totals
    let itemsTotal   = cart.reduce((s, i) => s + i.originalPrice * i.qty, 0);
    let productDisc  = cart.reduce((s, i) => s + (i.originalPrice - i.price) * i.qty, 0);
    let subtotal     = itemsTotal - productDisc;
    let delivery     = subtotal >= DELIVERY_FREE_THRESHOLD ? 0 : 40;
    let couponDisc   = 0;
    let couponCode   = "";

    if (appliedCoupon) {
        couponDisc = appliedCoupon.type === "percent"
            ? Math.round(subtotal * appliedCoupon.value / 100)
            : appliedCoupon.value;
        couponCode = appliedCoupon.code;
    }

    const grandTotal = Math.max(0, subtotal - couponDisc + delivery);
    const orderId    = "ORD-" + Date.now();

    const btn = document.getElementById("placeOrderBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = `<div class="btn-spinner"></div> Placing Order...`; }

    fetch(API + "/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            orderId,
            userEmail:      user.email,
            userName:       name,
            mobile,
            items:          cart,
            total:          itemsTotal,
            productDiscount: productDisc,
            couponDiscount:  couponDisc,
            couponCode,
            deliveryCharge:  delivery,
            grandTotal,
            paymentMethod:   payment,
            address,
            location:        currentLocText || "",
            latitude:        currentLat,
            longitude:       currentLng
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            cart         = [];
            appliedCoupon = null;
            updateCartUI();
            showOrderSuccess(orderId, grandTotal);
            switchPage("home", document.querySelector(".nav-item"));
        } else {
            throw new Error(data.message || "Order failed");
        }
    })
    .catch(err => {
        showToast("❌ Order failed: " + err.message);
    })
    .finally(() => {
        if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-check-circle"></i> Place Order`; }
    });
}

function showOrderSuccess(orderId, total) {
    showToast(`✅ Order placed! ID: ${orderId}`);
}

// ─────────────────────────────────────────
//  MY ORDERS
// ─────────────────────────────────────────
function showMyOrders() {
    const user = getUser();
    if (!user) { openGoogleLogin(); return; }

    switchPage("orders");
    document.getElementById("ordersList").innerHTML =
        `<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>`;

    fetch(API + `/orders/user/${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(orders => {
            if (!orders.length) {
                document.getElementById("ordersList").innerHTML =
                    `<div style="text-align:center;padding:40px;color:#999;">
                        <div style="font-size:50px;">📦</div>
                        <p style="margin-top:12px;">No orders yet</p>
                    </div>`;
                return;
            }

            const statusColors = {
                "Pending":          "#ff9800",
                "Accepted":         "#2196f3",
                "Packed":           "#9c27b0",
                "Out for Delivery": "#03a9f4",
                "Delivered":        "#4caf50"
            };
            const statusIcons = {
                "Pending":          "fa-clock",
                "Accepted":         "fa-check",
                "Packed":           "fa-box",
                "Out for Delivery": "fa-truck",
                "Delivered":        "fa-circle-check"
            };

            let html = "";
            orders.forEach(o => {
                const color = statusColors[o.status] || "#999";
                const icon  = statusIcons[o.status]  || "fa-circle";
                const date  = new Date(o.createdAt).toLocaleString("en-IN");
                const items = Array.isArray(o.items)
                    ? o.items.map(i => `${i.name} ×${i.qty}`).join(", ")
                    : o.items || "";

                html += `
                <div class="order-card">
                    <div class="order-card-header">
                        <div>
                            <span class="order-id">${o.orderId}</span>
                            <span class="order-date">${date}</span>
                        </div>
                        <span class="order-status-badge" style="background:${color}20;color:${color};">
                            <i class="fa-solid ${icon}"></i> ${o.status}
                        </span>
                    </div>
                    <p class="order-items">${items}</p>
                    <div class="order-card-footer">
                        <span class="order-total">Rs.${o.grandTotal}</span>
                        <span class="order-payment">${o.paymentMethod || "COD"}</span>
                    </div>
                    <button class="reorder-btn" onclick="reorder('${o.orderId}')">
                        <i class="fa-solid fa-rotate-right"></i> Reorder
                    </button>
                    <div class="order-progress">
                        ${["Pending","Accepted","Packed","Out for Delivery","Delivered"].map(s =>
                            `<div class="op-step ${isStatusReached(o.status, s) ? "done" : ""}">
                                <div class="op-dot"></div>
                                <span>${s}</span>
                            </div>`
                        ).join("")}
                    </div>
                </div>`;
            });
            document.getElementById("ordersList").innerHTML = html;
        })
        .catch(() => {
            document.getElementById("ordersList").innerHTML =
                `<p style="text-align:center;color:#e53935;padding:20px;">Failed to load orders.</p>`;
        });
}

const STATUS_STEPS = ["Pending","Accepted","Packed","Out for Delivery","Delivered"];
function isStatusReached(current, step) {
    return STATUS_STEPS.indexOf(current) >= STATUS_STEPS.indexOf(step);
}

// ─────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────
function handleAdminTabClick(element) {
    if (isAdminAuth) { switchPage("admin", element); }
    else {
        document.getElementById("adminPasswordInput").value = "";
        document.getElementById("adminAuthModal").style.display = "flex";
    }
}

function verifyAdminPassword() {
    if (document.getElementById("adminPasswordInput").value === "psstore@4313") {
        isAdminAuth = true;
        closeAuthModal();
        switchPage("admin", document.getElementById("adminNavItem"));
    } else {
        alert("Incorrect password!");
        document.getElementById("adminPasswordInput").value = "";
    }
}

function closeAuthModal() {
    document.getElementById("adminAuthModal").style.display = "none";
}

function logoutAdmin() {
    isAdminAuth   = false;
    editProductId = null;
    resetProductForm();
    switchPage("home", document.querySelector(".nav-item"));
}

// ── Admin Orders ────────────────────────
function loadAdminOrders() {
    const container = document.getElementById("adminOrdersList");
    if (!container) return;
    container.innerHTML = `<div style="text-align:center;padding:20px;"><div class="spinner"></div></div>`;

    fetch(API + "/orders")
        .then(r => r.json())
        .then(orders => {
            loadAdminStats(orders);
            if (!orders.length) {
                container.innerHTML = `<p style="color:#999;text-align:center;padding:20px;">No orders yet.</p>`;
                return;
            }
            let html = "";
            orders.forEach(o => {
                const date  = new Date(o.createdAt).toLocaleString("en-IN");
                const items = Array.isArray(o.items)
                    ? o.items.map(i => `${i.name} ×${i.qty}`).join(", ")
                    : o.items || "";
                const mapsLink = (o.latitude && o.longitude)
                    ? `https://www.google.com/maps?q=${o.latitude},${o.longitude}`
                    : null;

                html += `
                <div class="admin-order-card">
                    <div class="admin-order-header">
                        <b>${o.orderId}</b>
                        <span style="font-size:12px;color:#999;">${date}</span>
                    </div>
                    <p><i class="fa-solid fa-user"></i> ${o.userName} | ${o.mobile}</p>
                    <p><i class="fa-solid fa-location-dot"></i> ${o.address}</p>
                    ${mapsLink ? `<a href="${mapsLink}" target="_blank" class="maps-link"><i class="fa-solid fa-map"></i> Open on Google Maps</a>` : ""}
                    <p class="admin-order-items"><i class="fa-solid fa-box"></i> ${items}</p>
                    <div class="admin-order-footer">
                        <b style="color:#df4b0b;">₹${o.grandTotal}</b>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <select onchange="updateOrderStatus('${o._id}', this.value)" class="status-select">
                                ${STATUS_STEPS.map(s =>
                                    `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`
                                ).join("")}
                            </select>
                            ${o.mobile ? `<a href="https://wa.me/91${o.mobile}?text=${encodeURIComponent(`Hi ${o.userName}, your order ${o.orderId} status: ${o.status}`)}" target="_blank" class="wa-btn"><i class="fa-brands fa-whatsapp"></i></a>` : ""}
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        })
        .catch(() => { container.innerHTML = `<p style="color:#e53935;">Failed to load orders.</p>`; });
}

function updateOrderStatus(id, status) {
    fetch(API + `/orders/${id}/status`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status })
    })
    .then(r => r.json())
    .then(() => showToast(`Order status updated: ${status}`))
    .catch(() => showToast("Failed to update status"));
}

// ── Admin Inventory ────────────────────
function renderAdminInventory(products) {
    products = products || allProducts;
    const container = document.getElementById("adminInventoryGrid");
    if (!container) return;

    if (!products.length) {
        container.innerHTML = `<p style="color:#999;text-align:center;padding:20px;">No products found.</p>`;
        return;
    }

    let html = "";
    products.forEach(p => {
        const finalPrice = p.discount
            ? Math.round(p.price - (p.price * p.discount / 100))
            : p.price;
        html += `
        <div class="cart-item">
            <img src="images/${p.image}" onerror="this.src='images/default.png'" alt="${p.name}">
            <div class="cart-details">
                <h4>${p.name}</h4>
                <p>${p.category} | Stock: ${p.stock}</p>
                <p>₹${finalPrice} ${p.discount ? `<del>₹${p.price}</del> <b style="color:#0c831f;">${p.discount}% OFF</b>` : ""}</p>
            </div>
            <button onclick="populateEditForm('${p._id}')" class="remove-btn" style="background:#e8f5e9;color:#0c831f;margin-right:6px;">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button onclick="deleteProduct('${p._id}')" class="remove-btn">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>`;
    });
    container.innerHTML = html;
}

function populateEditForm(id) {
    const p = allProducts.find(x => x._id === id);
    if (!p) return;
    editProductId = id;

    document.getElementById("pName").value     = p.name;
    document.getElementById("pCategory").value = p.category;
    document.getElementById("pPrice").value    = p.price;
    document.getElementById("pDiscount").value = p.discount;
    document.getElementById("pStock").value    = p.stock;
    document.getElementById("pIdentity").value = p.image;

    document.getElementById("saveProductBtn").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Update Product`;
    document.getElementById("formTitle").innerHTML      = `<i class="fa-solid fa-pen"></i> Edit Product`;
    document.getElementById("cancelEditBtn").style.display = "block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveProductAction() {
    const payload = {
        name:     document.getElementById("pName").value.trim(),
        category: document.getElementById("pCategory").value,
        price:    parseFloat(document.getElementById("pPrice").value),
        discount: parseFloat(document.getElementById("pDiscount").value) || 0,
        stock:    parseInt(document.getElementById("pStock").value),
        image:    document.getElementById("pIdentity").value.trim()
    };

    if (!payload.name || !payload.price) { showToast("Name and Price are required"); return; }

    const url    = editProductId ? `/products/${editProductId}` : "/products";
    const method = editProductId ? "PUT" : "POST";

    fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(r => r.json())
        .then(() => {
            showToast(editProductId ? "Product updated ✅" : "Product added ✅");
            resetProductForm();
            loadAllData();
        })
        .catch(() => showToast("Failed to save product"));
}

function resetProductForm() {
    editProductId = null;
    ["pName","pPrice","pStock","pIdentity"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    document.getElementById("pCategory").value = "";
    document.getElementById("pDiscount").value = "0";
    document.getElementById("saveProductBtn").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save to Database`;
    document.getElementById("formTitle").innerHTML      = `<i class="fa-solid fa-plus-circle"></i> Add New Product`;
    document.getElementById("cancelEditBtn").style.display = "none";
}

function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    fetch(API + `/products/${id}`, { method: "DELETE" })
        .then(r => r.json())
        .then(() => { showToast("Product deleted"); loadAllData(); })
        .catch(() => showToast("Failed to delete"));
}

// ─────────────────────────────────────────
//  GOOGLE AUTH
// ─────────────────────────────────────────
const GOOGLE_CLIENT_ID = "217168067871-t4bhfqeqmin2klhgrt6p2h0c9ajfq7qh.apps.googleusercontent.com";

function openGoogleLogin()  { document.getElementById("googleLoginModal").style.display = "flex"; }
function closeGoogleLogin() { document.getElementById("googleLoginModal").style.display = "none"; }

function startGoogleOAuth() {
    const redirectUri = window.location.origin;
    const scope       = "openid email profile";
    const url = `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent(scope)}` +
        `&prompt=select_account`;

    const popup = window.open(url, "googleLogin", "width=500,height=600,left=200,top=100");

    const timer = setInterval(() => {
        try {
            if (!popup || popup.closed) { clearInterval(timer); return; }
            const popupUrl = popup.location.href;
            if (popupUrl.includes(window.location.origin)) {
                const hash   = new URL(popupUrl).hash.substring(1);
                const params = new URLSearchParams(hash);
                const token  = params.get("access_token");
                if (token) {
                    clearInterval(timer);
                    popup.close();
                    fetchGoogleProfile(token);
                }
            }
        } catch (e) { /* cross-origin, ignore */ }
    }, 500);
}

async function fetchGoogleProfile(accessToken) {
    try {
        const res  = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        const user = { uid: data.sub, name: data.name, email: data.email, picture: data.picture };
        localStorage.setItem("psUser", JSON.stringify(user));
        updateUserUI();
        closeGoogleLogin();
        showToast(`Welcome, ${user.name}! ✅`);

        // Sync to DB
        fetch(API + "/users/sync", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(user)
        }).catch(() => {});
    } catch (e) {
        showToast("Login failed. Try again.");
    }
}

// Legacy GIS callback (kept for backward compat)
function handleGoogleCredential(response) {
    try {
        const data = JSON.parse(atob(response.credential.split(".")[1]));
        const user = { uid: data.sub, name: data.name, email: data.email, picture: data.picture };
        localStorage.setItem("psUser", JSON.stringify(user));
        updateUserUI();
        closeGoogleLogin();
        showToast(`Welcome, ${user.name}! ✅`);
        fetch(API + "/users/sync", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(user)
        }).catch(() => {});
    } catch(e) { showToast("Login failed."); }
}

function updateUserUI() {
    const user        = getUser();
    const guestEl     = document.getElementById("profileGuest");
    const userEl      = document.getElementById("profileUser");
    if (!guestEl || !userEl) return;

    if (user) {
        guestEl.style.display = "none";
        userEl.style.display  = "block";
        setEl("pmName",  user.name  || "User");
        setEl("pmEmail", user.email || "");
        const avatar = user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=df4b0b&color=fff`;
        document.getElementById("pmAvatar").src      = avatar;
        document.getElementById("profileAvatar").src = avatar;
    } else {
        guestEl.style.display = "block";
        userEl.style.display  = "none";
    }
}

function signOutUser() {
    localStorage.removeItem("psUser");
    location.reload();
}

function getUser() {
    try { return JSON.parse(localStorage.getItem("psUser")) || null; }
    catch { return null; }
}

function openWishlist() {
    showToast("Wishlist coming soon!");
}

// ─────────────────────────────────────────
//  PROFILE MENU
// ─────────────────────────────────────────
function toggleProfileMenu() {
    document.getElementById("profileMenu").classList.toggle("open");
}
document.addEventListener("click", e => {
    const menu = document.getElementById("profileMenu");
    const btn  = document.getElementById("profileBtn");
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove("open");
    }
});

// ─────────────────────────────────────────
//  PAGE NAVIGATION
// ─────────────────────────────────────────
const PAGES = ["home","category","cart","checkout","orders","wishlist","admin"];

function switchPage(pageId, element) {
    PAGES.forEach(id => {
        const el = document.getElementById(id + "-view");
        if (el) el.style.display = "none";
    });

    const target = document.getElementById(pageId + "-view");
    if (target) target.style.display = "block";

    if (element) {
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        element.classList.add("active");
    }

    if (pageId === "admin" && isAdminAuth) {
        renderAdminInventory();
        loadAdminOrders();
    }
    if (pageId === "cart") updateCartUI();
}

// ─────────────────────────────────────────
//  BANNER SLIDER
// ─────────────────────────────────────────
let currentSlide = 0;
const TOTAL_SLIDES = 3;

function startBannerRotation() {
    setInterval(() => {
        currentSlide = (currentSlide + 1) % TOTAL_SLIDES;
        goToSlide(currentSlide);
    }, 4000);
}

function goToSlide(index) {
    currentSlide = index;
    const track = document.getElementById("bannerTrack");
    if (track) track.style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll(".dot").forEach((d, i) => {
        d.classList.toggle("active", i === index);
    });
}

function filterAndGo(category, el) {
    // Update active chip on home page if clicked from chips
    if (el) {
        document.querySelectorAll(".cat-chip")
            .forEach(c => c.classList.remove("active-chip"));
        el.classList.add("active-chip");
    }
    switchPage("category", document.querySelectorAll(".nav-item")[1]);
    setTimeout(() => filterCategory(category), 100);
}

// ─────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────
function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

// ─────────────────────────────────────────
//  PWA
// ─────────────────────────────────────────
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
}

window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPWAPrompt = e;
    const btn = document.getElementById("pwaInstallBtn");
    if (btn) btn.style.display = "flex";
});

window.addEventListener("appinstalled", () => {
    deferredPWAPrompt = null;
    const btn = document.getElementById("pwaInstallBtn");
    if (btn) btn.style.display = "none";
    showToast("PS STORE app installed! 🎉");
});

function installPWA() {
    if (!deferredPWAPrompt) {
        showToast("Open in browser to install app");
        return;
    }
    deferredPWAPrompt.prompt();
    deferredPWAPrompt.userChoice.then(choice => {
        if (choice.outcome === "accepted") showToast("Installing PS STORE app... 🚀");
        deferredPWAPrompt = null;
    });
}

// ─────────────────────────────────────────
//  SKELETON LOADING
// ─────────────────────────────────────────
function renderSkeleton(targetId, count = 6) {
    const el = document.getElementById(targetId);
    if (!el) return;
    let html = "";
    for (let i = 0; i < count; i++) {
        html += `
        <div class="card skeleton-card">
            <div class="skel skel-img"></div>
            <div class="skel skel-title"></div>
            <div class="skel skel-price"></div>
            <div class="skel skel-btn"></div>
        </div>`;
    }
    el.innerHTML = html;
}

// ─────────────────────────────────────────
//  SORT PRODUCTS
// ─────────────────────────────────────────
function sortProducts(type, el) {
    document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active-sort"));
    if (el) el.classList.add("active-sort");

    let sorted = [...allProducts];
    if (type === "discount") sorted = sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    else if (type === "low")  sorted = sorted.sort((a, b) => {
        const pa = a.discount ? Math.round(a.price - a.price * a.discount / 100) : a.price;
        const pb = b.discount ? Math.round(b.price - b.price * b.discount / 100) : b.price;
        return pa - pb;
    });
    else if (type === "high") sorted = sorted.sort((a, b) => {
        const pa = a.discount ? Math.round(a.price - a.price * a.discount / 100) : a.price;
        const pb = b.discount ? Math.round(b.price - b.price * b.discount / 100) : b.price;
        return pb - pa;
    });
    else sorted = sorted.filter(p => p.discount > 0);

    renderProducts(sorted, "productList");
}

// ─────────────────────────────────────────
//  WISHLIST
// ─────────────────────────────────────────
function loadWishlist() {
    const user = getUser();
    if (user) {
        fetch(API + `/users/${user.email}`)
            .then(r => r.json())
            .then(data => { wishlist = data.wishlist || []; })
            .catch(() => {});
    } else {
        wishlist = JSON.parse(localStorage.getItem("psWishlist") || "[]");
    }
}

function toggleWishlist(productId, btn) {
    const idx = wishlist.indexOf(productId);
    if (idx === -1) {
        wishlist.push(productId);
        if (btn) { btn.style.color = "#e53935"; btn.innerHTML = `<i class="fa-solid fa-heart"></i>`; }
        showToast("Added to Wishlist ❤️");
    } else {
        wishlist.splice(idx, 1);
        if (btn) { btn.style.color = "#ccc"; btn.innerHTML = `<i class="fa-regular fa-heart"></i>`; }
        showToast("Removed from Wishlist");
    }

    const user = getUser();
    if (user) {
        fetch(API + `/users/${user.email}/wishlist`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wishlist })
        }).catch(() => {});
    } else {
        localStorage.setItem("psWishlist", JSON.stringify(wishlist));
    }
}

function openWishlist() {
    document.getElementById("profileMenu").classList.remove("open");
    switchPage("wishlist");
    const wishlistProducts = allProducts.filter(p => wishlist.includes(p._id));
    const grid = document.getElementById("wishlistGrid");
    if (!wishlistProducts.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">
            <div style="font-size:50px;margin-bottom:12px;">❤️</div>
            <p>Your wishlist is empty</p>
            <button class="checkout-btn" style="max-width:200px;margin-top:16px;" onclick="switchPage('home',document.querySelector('.nav-item'))">Shop Now</button>
        </div>`;
        return;
    }
    renderProducts(wishlistProducts, "wishlistGrid");
}

// ─────────────────────────────────────────
//  BUY NOW
// ─────────────────────────────────────────
function buyNow(id, name, price, originalPrice, image, discount) {
    const user = getUser();
    if (!user) { openGoogleLogin(); return; }

    cart = [{ id, name, price, originalPrice, image, discount, qty: 1 }];
    updateCartUI();
    showCheckoutPage();
}

// ─────────────────────────────────────────
//  ADMIN DASHBOARD STATS
// ─────────────────────────────────────────
function loadAdminStats(orders) {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const revenue     = todayOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
    const lowStock    = allProducts.filter(p => p.stock <= 5).length;

    setEl("statTodayOrders", todayOrders.length);
    setEl("statRevenue",     `Rs.${revenue}`);
    setEl("statTotalOrders", orders.length);
    setEl("statLowStock",    lowStock > 0 ? `<span style="color:#e53935;">${lowStock}</span>` : "0");
}

// ─────────────────────────────────────────
//  REORDER
// ─────────────────────────────────────────
function reorder(orderId) {
    const user = getUser();
    if (!user) { openGoogleLogin(); return; }

    fetch(API + `/orders/user/${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(orders => {
            const order = orders.find(o => o.orderId === orderId);
            if (!order || !order.items.length) { showToast("Order not found"); return; }

            cart = order.items.map(i => ({
                id:            i.id || i._id || "",
                name:          i.name,
                price:         i.price,
                originalPrice: i.originalPrice || i.price,
                image:         i.image || "default.png",
                discount:      i.discount || 0,
                qty:           i.qty
            }));
            updateCartUI();
            switchPage("cart", document.querySelectorAll(".nav-item")[2]);
            showToast("Items added to cart! 🛒");
        })
        .catch(() => showToast("Failed to reorder"));
}
