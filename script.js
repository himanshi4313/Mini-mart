let cart = [];
let allProducts = [];
let isAdminAuthenticated = false;
let editProductId = null;

// ====================
// APP START
// ====================

window.addEventListener("DOMContentLoaded", () => {

    if (
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
    ) {
        Notification.requestPermission();
    }

    setTimeout(() => {

        const splash =
            document.getElementById("splash-screen");

        const mainContent =
            document.getElementById("main-content");

        if (splash && mainContent) {

            splash.style.opacity = "0";
            splash.style.visibility = "hidden";

            mainContent.style.opacity = "1";
            mainContent.style.transform =
                "translateY(0)";
                document.querySelector(".bottom-nav").style.display = "flex";

        }

    }, 2500);

    loadAllData();

});

// ====================
// LOAD PRODUCTS
// ====================

function loadAllData() {

    fetch(
        "https://mini-mart-production.up.railway.app/products"
    )
    .then(res => res.json())
    .then(products => {

        allProducts = products;

        let discountProducts =
            allProducts.filter(
                p => p.discount > 0
            );

        renderProducts(
            discountProducts,
            "productList"
        );

        generateCategories(allProducts);

        if (isAdminAuthenticated) {

            renderAdminInventory();
            loadAdminOrders();

        }

    })
    .catch(err => {

        console.error(
            "Error loading products:",
            err
        );

    });

}

// ====================
// RENDER PRODUCTS
// ====================

function renderProducts(
    productsList,
    targetId
) {

    let html = "";

    productsList.forEach(product => {

        let finalPrice = product.price;

        if (product.discount) {

            finalPrice =
                product.price -
                (product.price *
                    product.discount /
                    100);

        }

        html += `
        <div class="card">

            <img src="images/${product.image}">

            <h2>${product.name}</h2>

            <p class="offer">
                ${product.discount || 0}% OFF
            </p>

            <p>
                ₹${finalPrice}
                <del>
                    ₹${product.price}
                </del>
            </p>

            <p
                style="
                font-size:11px;
                color:#666;
                "
            >
                Stock: ${product.stock}
            </p>

            <input
                type="number"
                value="1"
                min="1"
                class="qty"
            >

            <button
                onclick="
                addToCart(
                    '${product.name}',
                    ${finalPrice},
                    '${product.image}',
                    this
                )
                "
            >
                Add to Cart
            </button>

        </div>
        `;

    });

    document.getElementById(
        targetId
    ).innerHTML =
        html ||
        `
        <p
            style="
            text-align:center;
            color:#999;
            "
        >
            No products found.
        </p>
        `;

}

// ====================
// CATEGORY SYSTEM
// ====================
// ====================
// CATEGORY SYSTEM
// ====================


function generateCategories(products) {

    let categories = [
        ...new Set(
            products
                .map(p => p.category)
                .filter(Boolean)
        )
    ];

    let html = "";

    categories.forEach((cat, index) => {

        let imageName =
            cat.toLowerCase()
               .replace(/\s+/g, "-");

        html += `
        <div
            class="store-card ${index === 0 ? "active-cat" : ""}"
            onclick="filterCategory('${cat}', this)"
        >

            <img
                src="images/categories/${imageName}.png"
                onerror="this.src='images/categories/default.png'"
                class="category-img"
            >

            <p>${cat}</p>

        </div>
        `;

    });

    document.getElementById("categoryTabs").innerHTML = html;

    if (categories.length > 0) {
        filterCategory(categories[0]);
    }

}
// ====================
// FILTER CATEGORY
// ====================

function filterCategory(categoryName, element) {

    if (element) {

        document
            .querySelectorAll(".store-card")
            .forEach(card =>
                card.classList.remove("active-cat")
            );

        element.classList.add("active-cat");

    }

    let filteredProducts =
        allProducts.filter(
            p => p.category === categoryName
        );

    renderProducts(
        filteredProducts,
        "categoryProductList"
    );

}


// ====================
// ADD TO CART
// ====================

function addToCart(name, price, image, btn) {

    let qtyInput =
        btn.parentElement.querySelector(".qty");

    let qty =
        parseInt(qtyInput.value) || 1;

    let existingItem =
        cart.find(item => item.name === name);

    if (existingItem) {

        existingItem.qty += qty;

    } else {

        cart.push({
            name: name,
            price: price,
            image: image,
            qty: qty
        });

    }

    updateCartUI();

    showToast(name + " Added To Cart 🛒");

}


// ====================
// UPDATE CART
// ====================


function updateCartUI() {

    let totalItems = 0;
    let totalAmount = 0;

    let html = "";

    cart.forEach((item, index) => {

        totalItems += item.qty;
        totalAmount += item.price * item.qty;

        html += `
        <div class="cart-item">

            <img src="images/${item.image}">

            <div class="cart-details">
                <h4>${item.name}</h4>

                <p>
                    ₹${item.price} x ${item.qty}
                    = ₹${item.price * item.qty}
                </p>

            </div>

            <button
                class="remove-btn"
                onclick="removeFromCart(${index})"
            >
                🗑
            </button>

        </div>
        `;

    });

    document.getElementById("cartBadge").innerText =
        totalItems;

    document.getElementById("totalItems").innerText =
        totalItems;

    document.getElementById("totalAmount").innerText =
        "₹" + totalAmount;

    document.getElementById("cartList").innerHTML =
        html || "<p>Cart Empty</p>";

    const cartSummary =
        document.getElementById("cartSummary");

    if (cartSummary) {

        cartSummary.style.display =
            cart.length > 0
                ? "block"
                : "none";

    }

}

// ====================
// REMOVE FROM CART
// ====================

function removeFromCart(index) {

    cart.splice(index, 1);

    updateCartUI();

}
{



    

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

    let enteredPassword =
        document.getElementById(
            "adminPasswordInput"
        ).value;

    if (enteredPassword === "psstore@4313") {

        isAdminAuthenticated = true;

        closeAuthModal();

        switchPage(
            'admin',
            document.getElementById("adminNavItem")
        );

    } else {

        alert("Incorrect Password! and only admins can acces this page");

        document.getElementById(
            "adminPasswordInput"
        ).value = "";

    }

}

function closeAuthModal() {
    document.getElementById("adminAuthModal").style.display = "none";
}

function logoutAdmin() {
    isAdminAuthenticated = false;
    editProductId = null;
    resetProductForm();

    alert("Admin Logged Out");
    switchPage('home', document.querySelector('.nav-item'));
}

function renderAdminInventory() {

    let html = "";

    allProducts.forEach(product => {

        html += `
        <div class="cart-item">

            <img src="images/${product.image}">

            <div class="cart-details">
                <h4>${product.name}</h4>

                <p>
                    Category: ${product.category}<br>
                    Stock: ${product.stock}<br>
                    Price: ₹${product.price}<br>
                    Discount: ${product.discount}%
                </p>
            </div>

            <button
                onclick="populateEditForm(${product.id})"
                class="remove-btn"
                style="background:green;margin-right:10px;"
            >
                <i class="fa-solid fa-pen"></i>
            </button>

            <button
                onclick="deleteProduct(${product.id})"
                class="remove-btn"
            >
                <i class="fa-solid fa-trash"></i>
            </button>

        </div>
        `;

    });

    document.getElementById("adminInventoryGrid").innerHTML =
        html || "<p>No Products Found</p>";
}

function populateEditForm(id) {

    let product = allProducts.find(p => p.id === id);

    if (!product) return;

    editProductId = id;

    document.getElementById("pName").value = product.name;
    document.getElementById("pCategory").value = product.category;
    document.getElementById("pPrice").value = product.price;
    document.getElementById("pDiscount").value = product.discount;
    document.getElementById("pStock").value = product.stock;
    document.getElementById("pIdentity").value = product.image;

    document.getElementById("saveProductBtn").innerText =
        "Update Product";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function saveProductAction() {

    if (editProductId !== null) {
        updateExistingProduct();
    } else {
        addNewProduct();
    }

}

function addNewProduct() {

    let payload = {
        name: document.getElementById("pName").value,
        category: document.getElementById("pCategory").value,
        price: parseInt(document.getElementById("pPrice").value),
        discount: parseInt(document.getElementById("pDiscount").value),
        stock: parseInt(document.getElementById("pStock").value),
        image: document.getElementById("pIdentity").value
    };

    fetch("https://mini-mart-production.up.railway.app/products", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)

    })
    .then(res => {

        if (res.ok) {

            alert("Product Added");

            resetProductForm();

            loadAllData();

        }

    });

}
function updateExistingProduct() {

    let payload = {
        name: document.getElementById("pName").value,
        category: document.getElementById("pCategory").value,
        price: parseInt(document.getElementById("pPrice").value),
        discount: parseInt(document.getElementById("pDiscount").value),
        stock: parseInt(document.getElementById("pStock").value),
        image: document.getElementById("pIdentity").value
    };

    fetch(
        `https://mini-mart-production.up.railway.app/products/${editProductId}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)
        }
    )
    .then(res => {

        if (res.ok) {

            alert("Product Updated");

            resetProductForm();

            loadAllData();

        }

    });

}

function resetProductForm() {

    editProductId = null;

    document.getElementById("pName").value = "";
    document.getElementById("pCategory").value = "";
    document.getElementById("pPrice").value = "";
    document.getElementById("pDiscount").value = "0";
    document.getElementById("pStock").value = "";
    document.getElementById("pIdentity").value = "";

    document.getElementById("saveProductBtn").innerText =
        "Save Product";

}

function deleteProduct(id) {

    if (!confirm("Delete this product?")) return;

    fetch(
        `https://mini-mart-production.up.railway.app/products/${id}`,
        {
            method: "DELETE"
        }
    )
    .then(res => {

        if (res.ok) {

            alert("Product Deleted");

            loadAllData();

        }

    });

}

function loadAdminOrders() {

    fetch("https://mini-mart-production.up.railway.app/orders")

    .then(res => res.json())

    .then(orders => {

        let html = "";

        orders.forEach(order => {

            html += `
            <tr>

                <td>${order.orderId}</td>
                <td>${order.name}</td>
                <td>${order.mobile}</td>
                <td>${order.address}</td>
                <td>${order.itemsSummary}</td>
                <td>₹${order.totalAmt}</td>

            </tr>
            `;

        });

        document.getElementById(
            "adminOrderTableBody"
        ).innerHTML =
            html ||
            `
            <tr>
                <td colspan="6">
                    No Orders Found
                </td>
            </tr>
            `;

    });

}
function showCheckoutPage() {

    if (cart.length === 0) {

        alert("Cart is empty!");
        return;

    }

    switchPage("checkout");

}

function switchPage(pageId, element) {

    if (element) {

        document
            .querySelectorAll(".nav-item")
            .forEach(item =>
                item.classList.remove("active")
            );

        element.classList.add("active");

    }

    document.getElementById("home-view").style.display =
        "none";

    document.getElementById("category-view").style.display =
        "none";

    document.getElementById("cart-view").style.display =
        "none";

    document.getElementById("checkout-view").style.display =
        "none";

    document.getElementById("admin-view").style.display =
        "none";

    document.getElementById(
        pageId + "-view"
    ).style.display = "block";

    if (pageId === "admin") {

        renderAdminInventory();

        loadAdminOrders();

    }

}

let Banners = [
    "images/banner1.jpg",
    "images/banner2.jpg",
    "images/banner3.jpg" 
];

let idx = 0;

setInterval(() => {

    const img =
        document.getElementById("bannerImg");

    if (!img) return;

    img.style.opacity = "0.8";

    setTimeout(() => {

        idx = (idx + 1) % Banners.length;

        img.src = Banners[idx];

        img.style.opacity = "1";

    }, 300);

}, 4000);

function placeOrder() {

    let name =
        document.getElementById("custName").value;

    let mobile =
        document.getElementById("custMobile").value;

    let address =
        document.getElementById("custAddress").value;

    if (!name || !mobile || !address) {

        alert("Please fill all details");
        return;

    }

    if (cart.length === 0) {

        alert("Cart is empty");
        return;

    }

    let itemsSummary =
        cart.map(item =>
            `${item.name} x ${item.qty}`
        ).join(", ");

        const orderId = "ORD-" + Date.now();

    let totalAmt =
        cart.reduce(
            (sum, item) =>
                sum + item.price * item.qty,
            0
        );

    fetch(
        "https://mini-mart-production.up.railway.app/orders",
        {
            method: "POST",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
                orderId,
                name,
                mobile,
                address,
                itemsSummary,
                totalAmt
            })
        }
    )
    .then(res => res.json())
    .then(data => {

        alert("Order placed successfully!");

        cart = [];

        updateCartUI();

        switchPage("home");

    })
    .catch(err => {

        console.error(err);

        alert("Order failed!");

    });

}
function showToast(msg) {
    const toast = document.getElementById("toast");

    toast.innerText = msg;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}
function searchProducts() {

    let keyword = document
        .getElementById("searchInput")
        .value
        .toLowerCase();

    let filteredProducts = allProducts.filter(product =>
        product.name
            .toLowerCase()
            .includes(keyword)
    );

    // Home page par search
    if (
        document.getElementById("home-view")
        .style.display !== "none"
    ) {

        renderProducts(
            filteredProducts,
            "productList"
        );

    }

    // Category page par search
    if (
        document.getElementById("category-view")
        .style.display !== "none"
    ) {

        renderProducts(
            filteredProducts,
            "categoryProductList"
        );

    }

}