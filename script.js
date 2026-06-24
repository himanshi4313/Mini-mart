let cart = [];
let allProducts = [];
let isAdminAuthenticated = false;
let editProductId = null; // Tracks if we are editing an item

window.addEventListener('DOMContentLoaded', () => {
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
  
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    if (splash && mainContent) {
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      mainContent.style.opacity = '1';
      mainContent.style.transform = 'translateY(0)';
    }
  }, 2500);
  loadAllData();
});

function loadAllData() {
  fetch("https://mini-mart-production.up.railway.app/products")
    .then(res => res.json())
    .then(products => {
        allProducts = products;
        let discountProducts = allProducts.filter(p => p.discount > 0);
        renderProducts(discountProducts, "productList");
        generateCategories(allProducts);
        if(isAdminAuthenticated) {
            renderAdminInventory();
            loadAdminOrders();
        }
    })
    .catch(err => console.error("Error loading products:", err));
}

function renderProducts(productsList, targetId) {
    let html = "";
    productsList.forEach(product => {
        let finalPrice = product.price;
        if(product.discount){
            finalPrice = product.price - (product.price * product.discount / 100);
        }
        html += `
        <div class="card">
          <img src="images/${product.image}">
          <h2>${product.name}</h2>
          <p class="offer">${product.discount || 0}% OFF</p>
          <p>₹${finalPrice} <del>₹${product.price}</del></p>
          <p style="font-size: 11px; color: #666;">Stock: ${product.stock}</p>
          <input type="number" value="1" min="1" class="qty">
          <button onclick="addToCart('${product.name}', ${finalPrice}, '${product.image}', this)">Add to Cart</button>
        </div>
        `;
    });
    document.getElementById(targetId).innerHTML = html || "<p style='grid-column:1/-1; text-align:center; color:#999;'>No products found.</p>";
}

function generateCategories(products) {
    let categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    let catHtml = "";
    
    categories.forEach((cat, index) => {
        let iconClass = "fa-solid fa-box"; 
        if(cat.toLowerCase().includes("grocer")) iconClass = "fa-solid fa-basket-shopping";
        if(cat.toLowerCase().includes("dairy") || cat.toLowerCase().includes("milk")) iconClass = "fa-solid fa-bottle-dropper";
        if(cat.toLowerCase().includes("snack") || cat.toLowerCase().includes("biscuit")) iconClass = "fa-solid fa-cookie-bite";
        
        catHtml += `
          <div class="store-card ${index === 0 ? 'active-cat' : ''}" onclick="filterCategory('${cat}', this)">
            <i class="${iconClass}"></i>
            <p>${cat}</p>
          </div>
        `;
    });
    
    document.getElementById("categoryTabs").innerHTML = catHtml || "<p style='text-align:center;'>No categories structured yet.</p>";
    if(categories.length > 0) {
        filterCategory(categories[0], null);
    }
}

function filterCategory(categoryName, element) {
    if(element) {
        document.querySelectorAll('#categoryTabs .store-card').forEach(el => el.classList.remove('active-cat'));
        element.classList.add('active-cat');
    }
    let filtered = allProducts.filter(p => p.category === categoryName);
    renderProducts(filtered, "categoryProductList");
}

function searchProducts() {
    let query = document.getElementById("searchInput").value.toLowerCase();
    let filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
    
    if(document.getElementById("home-view").style.display !== "none") {
        renderProducts(filtered, "productList");
    } else if(document.getElementById("category-view").style.display !== "none") {
        renderProducts(filtered, "categoryProductList");
    }
}

function addToCart(name, price, image, btn) {
    let qtyInput = btn.parentElement.querySelector(".qty");
    let qty = parseInt(qtyInput.value) || 1;

    let existingItem = cart.find(item => item.name === name);
    if(existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ name: name, price: price, image: image, qty: qty });
    }
    updateCartUI();
    alert(name + " added to cart!");
}

function updateCartUI() {
    let totalItems = 0;
    let totalAmount = 0;
    let html = "";

    cart.forEach((item, index) => {
        totalItems += item.qty;
        totalAmount += (item.price * item.qty);
        html += `
          <div class="cart-item">
            <img src="images/${item.image}">
            <div class="cart-details">
              <h4>${item.name}</h4>
              <p>₹${item.price} x ${item.qty} = <b>₹${item.price * item.qty}</b></p>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        `;
    });

    document.getElementById("cartBadge").innerText = totalItems;
    document.getElementById("totalItems").innerText = totalItems;
    document.getElementById("totalAmount").innerText = "₹" + totalAmount;

    if(cart.length === 0) {
        document.getElementById("cartList").innerHTML = "<p style='text-align:center; color:#999; padding:20px;'>Your cart is empty!</p>";
        document.getElementById("cartSummary").style.display = "none";
    } else {
        document.getElementById("cartList").innerHTML = html;
        document.getElementById("cartSummary").style.display = "block";
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function showCheckoutPage() {
    document.getElementById('cart-view').style.display = 'none';
    document.getElementById('checkout-view').style.display = 'block';
}

// MODIFIED: Place Order function optimized for Green API WhatsApp dispatch
function placeOrder() {
    let name = document.getElementById("custName").value;
    let mobile = document.getElementById("custMobile").value;
    let address = document.getElementById("custAddress").value;

    if(!name || !mobile || !address) {
        alert("Please fill all fields!");
        return;
    }

    let itemsSummary = cart.map(i => `${i.name} (${i.qty})`).join(", ");
    let totalAmt = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    let orderId = "MMJ-" + Math.floor(100000 + Math.random() * 900000);

    let orderData = { orderId, name, mobile, address, itemsSummary, totalAmt };

    // Pehle database mein try karega, agar route missing hai toh catch karke notification chala dega
    fetch("http://localhost:3000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    })
    .then(res => {
        if(!res.ok) throw new Error("Order table route missing, dispatching WhatsApp alert directly.");
        return res.json();
    })
    .then(() => {
        sendWhatsAppNotification(orderId, name, mobile, address, itemsSummary, totalAmt);
    })
    .catch(err => {
        console.warn(err.message);
        // Agar database save ni bhi hua, toh seedha WhatsApp bhej ke customer ko successful bolenge
        sendWhatsAppNotification(orderId, name, mobile, address, itemsSummary, totalAmt);
    });
}

// NEW HELPER FUNCTION: Calls Green API route setup inside server.js
function sendWhatsAppNotification(orderId, name, mobile, address, itemsSummary, totalAmt) {
    let textToSend = `*Order ID:* ${orderId}\n*Customer:* ${name}\n*Mobile:* ${mobile}\n*Address:* ${address}\n*Items:* ${itemsSummary}\n*Total Bill:* ₹${totalAmt}`;

    fetch("http://localhost:3000/send-order-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderDetails: textToSend })
    })
    .then(() => {
        if (Notification.permission === "granted") {
            new Notification("New Order Received! 📦", {
                body: `Order ID: ${orderId}\nCustomer: ${name}\nTotal: ₹${totalAmt}`
            });
        }
        alert("Order Successful! ID: " + orderId);
        cart = [];
        updateCartUI();
        document.getElementById("custName").value = "";
        document.getElementById("custMobile").value = "";
        document.getElementById("custAddress").value = "";
        switchPage('home', document.querySelector('.bottom-nav .nav-item'));
    })
    .catch(err => console.error("WhatsApp dispatch network error:", err));
}

function handleAdminTabClick(element) {
    if (isAdminAuthenticated) {
        switchPage('admin', element);
    } else {
        document.getElementById("adminPasswordInput").value = "";
        document.getElementById("adminAuthModal").style.display = "flex";
    }
}

function verifyAdminPassword() {
    let enteredPassword = document.getElementById("adminPasswordInput").value;
    if (enteredPassword === "minimart@4313") {
        isAdminAuthenticated = true;
        document.getElementById("adminAuthModal").style.display = "none";
        switchPage('admin', document.getElementById("adminNavItem"));
    } else {
        alert("Access Denied: Invalid Security Key!");
    }
}

function closeAuthModal() {
    document.getElementById("adminAuthModal").style.display = "none";
}

function logoutAdmin() {
    isAdminAuthenticated = false;
    editProductId = null;
    resetProductForm();
    alert("Dashboard locked safely.");
    switchPage('home', document.querySelector('.bottom-nav .nav-item'));
}

function renderAdminInventory() {
    let html = "";
    allProducts.forEach(product => {
        html += `
          <div class="cart-item" style="justify-content: space-between;">
            <div style="display:flex; align-items:center;">
              <img src="images/${product.image}" style="width:40px; height:40px; margin-right:10px;">
              <div>
                <h5 style="margin:0; font-size:14px;">${product.name}</h5>
                <p style="margin:0; font-size:11px; color:#666;">Category: ${product.category} | Stock: ${product.stock} | Price: ₹${product.price} (${product.discount}% Off)</p>
              </div>
            </div>
            <div>
              <button class="remove-btn" style="color:#00704A; margin-right:15px;" onclick="populateEditForm(${product.id})"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="remove-btn" onclick="deleteProduct(${product.id})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        `;
    });
    document.getElementById("adminInventoryGrid").innerHTML = html || "<p>Inventory is empty.</p>";
}

function populateEditForm(id) {
    let product = allProducts.find(p => p.id === id);
    if(!product) return;

    editProductId = id; 
    document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Update Product: ${product.name}`;
    document.getElementById("saveProductBtn").innerText = "Update Product Metadata";
    
    document.getElementById("pName").value = product.name;
    document.getElementById("pCategory").value = product.category;
    document.getElementById("pPrice").value = product.price;
    document.getElementById("pDiscount").value = product.discount;
    document.getElementById("pStock").value = product.stock;
    document.getElementById("pIdentity").value = product.image;

    document.getElementById("formTitle").scrollIntoView({ behavior: 'smooth' });
}

function saveProductAction() {
    if (editProductId !== null) {
        updateExistingProduct();
    } else {
        addNewProduct();
    }
}

function addNewProduct() {
    let name = document.getElementById("pName").value;
    let category = document.getElementById("pCategory").value; 
    let price = parseInt(document.getElementById("pPrice").value);
    let discount = parseInt(document.getElementById("pDiscount").value) || 0;
    let stock = parseInt(document.getElementById("pStock").value);
    let image = document.getElementById("pIdentity").value;

    if(!name || !category || !price || isNaN(stock) || !image) {
        alert("Please completely fill out product fields.");
        return;
    }

    let payload = { name, category, price, discount, stock, image };

    fetch("http://localhost:3000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if(res.ok) {
            alert("Product saved to MySQL successfully!");
            resetProductForm();
            loadAllData();
        }
    });
}

function updateExistingProduct() {
    let name = document.getElementById("pName").value;
    let category = document.getElementById("pCategory").value; 
    let price = parseInt(document.getElementById("pPrice").value);
    let discount = parseInt(document.getElementById("pDiscount").value) || 0;
    let stock = parseInt(document.getElementById("pStock").value);
    let image = document.getElementById("pIdentity").value;

    if(!name || !category || !price || isNaN(stock) || !image) {
        alert("Please completely fill out product fields.");
        return;
    }

    let payload = { name, category, price, discount, stock, image };

    fetch(`http://localhost:3000/products/${editProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if(res.ok) {
            alert("Product metadata updated perfectly!");
            resetProductForm();
            loadAllData();
        } else {
            alert("Update orchestration failed.");
        }
    })
    .catch(err => console.error(err));
}

function resetProductForm() {
    editProductId = null;
    document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-plus-circle"></i> Add New Product`;
    document.getElementById("saveProductBtn").innerText = "Save to Database";
    
    document.getElementById("pName").value = "";
    document.getElementById("pCategory").value = "";
    document.getElementById("pPrice").value = "";
    document.getElementById("pDiscount").value = "0";
    document.getElementById("pStock").value = "";
    document.getElementById("pIdentity").value = "";
}

function deleteProduct(id) {
    if(!confirm("Are you sure you want to discard this item?")) return;

    fetch(`http://localhost:3000/products/${id}`, {
        method: "DELETE"
    })
    .then(res => {
        if(res.ok) {
            alert("Product dropped from database.");
            if(editProductId === id) resetProductForm();
            loadAllData();
        }
    });
}// Apni script.js mein ye check karo:
const backendUrl = "http://localhost:3000/send-order-notification";
console.log("Calling backend at:", backendUrl); // Ye console mein dikhna chahiye

fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderDetails: "Test Order Details" })
})

function loadAdminOrders() {
    fetch("http://localhost:3000/orders")
    .then(res => res.json())
    .then(orders => {
        let html = "";
        orders.forEach(o => {
            html += `
              <tr>
                <td><b>#${o.orderId}</b></td>
                <td>${o.name}</td>
                <td>${o.mobile}</td>
                <td>${o.address}</td>
                <td>${o.itemsSummary}</td>
                <td><b style="color:#00704A;">₹${o.totalAmt}</b></td>
              </tr>
            `;
        });
        document.getElementById("adminOrderTableBody").innerHTML = html || "<tr><td colspan='6' style='text-align:center;'>No active orders found.</td></tr>";
    })
    .catch(err => console.error("Error loading orders:", err));
}

function switchPage(pageId, element) {
  if(element) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
  }

  document.getElementById('home-view').style.display = 'none';
  document.getElementById('category-view').style.display = 'none';
  document.getElementById('cart-view').style.display = 'none';
  document.getElementById('checkout-view').style.display = 'none';
  document.getElementById('admin-view').style.display = 'none';

  document.getElementById(pageId + '-view').style.display = 'block';

  if(pageId === 'admin') {
      loadAdminOrders();
      renderAdminInventory();
  }
}

let Banners = ["images/banner1.jpg", "images/banner2.jpg", "images/banner3.jpg"];
let idx = 0;
setInterval(() => {
  let img = document.getElementById("bannerImg");
  if(img) {
    img.style.opacity = "0";
    setTimeout(() => {
      idx++;
      if (idx >= Banners.length) { idx = 0; }
      img.src = Banners[idx];
      img.style.opacity = "1";
    }, 500);
  }
}, 3200);