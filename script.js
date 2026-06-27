 let cart = [];
let allProducts = [];
let isAdminAuthenticated = false;
let editProductId = null;

// ====================
// APP START
// ====================
window.addEventListener("DOMContentLoaded", () => {
    loadAllData();
});

// ====================
// LOAD PRODUCTS
// ====================
function loadAllData() {
    fetch("https://mini-mart-production.up.railway.app/products")
    .then(res => res.json())
    .then(products => {
        allProducts = products;
        renderProducts(allProducts, "productList");
        generateCategories(allProducts);
    })
    .catch(err => console.error("Error loading products:", err));
}

// ====================
// RENDER PRODUCTS
// ====================
function renderProducts(productsList, targetId) {
    let html = "";
    productsList.forEach(product => {
        let finalPrice = product.price - (product.price * (product.discount || 0) / 100);
        html += `
        <div class="card">
            <img src="images/${product.image}" onerror="this.src='https://via.placeholder.com/150'">
            <h2>${product.name}</h2>
            <p>₹${finalPrice} <del>₹${product.price}</del></p>
            <input type="number" value="1" min="1" class="qty" id="qty-${product.id}">
            <button onclick="addToCart('${product.name}', ${finalPrice}, 'qty-${product.id}')">Add to Cart</button>
        </div>`;
    });
    document.getElementById(targetId).innerHTML = html || "<p>No products found.</p>";
}

// ====================
// CART & WHATSAPP
// ====================
function addToCart(name, price, qtyInputId) {
    let qty = parseInt(document.getElementById(qtyInputId).value) || 1;
    let item = cart.find(i => i.name === name);
    if (item) item.qty += qty;
    else cart.push({ name, price, qty });
    alert(name + " added to cart!");
}

function sendOrderToWhatsApp() {
    if (cart.length === 0) return alert("Cart is empty!");
    
    let summary = "🛒 New Order:\n" + cart.map(i => `${i.name} (${i.qty}) - ₹${i.price * i.qty}`).join("\n");
    let total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    summary += `\n\nTotal: ₹${total}`;

    // Backend ko call
    fetch("https://mini-mart-production.up.railway.app/send-order-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderDetails: summary })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) alert("Order sent to WhatsApp!");
        else alert("Failed to send notification.");
    });
}

// ====================
// ADMIN & CATEGORY
// ====================
function generateCategories(products) {
    let cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    document.getElementById("categoryTabs").innerHTML = cats.map(cat => 
        `<div class="store-card" onclick="filterCategory('${cat}')"><p>${cat}</p></div>`).join("");
}

function filterCategory(cat) {
    renderProducts(allProducts.filter(p => p.category === cat), "productList");
}

function verifyAdminPassword() {
    if (document.getElementById("adminPasswordInput").value === "psstore@4313") {
        isAdminAuthenticated = true;
        document.getElementById("adminAuthModal").style.display = "none";
        alert("Admin Mode Activated");
    } else alert("Invalid Password!");
}