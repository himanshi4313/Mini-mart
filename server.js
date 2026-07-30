require("dotenv").config();

// Fix TLS for Node.js v24
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Force IPv4 DNS — only works in local/VPS, skip on Vercel serverless
try {
    const dns = require("dns");
    dns.setDefaultResultOrder("ipv4first");
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
    // ignore in serverless environments
}

const express        = require("express");
const cors           = require("cors");
const axios          = require("axios");
const { MongoClient, ObjectId } = require("mongodb");
const path           = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "./")));

// ─────────────────────────────────────────
//  MONGODB CONNECTION (native driver)
// ─────────────────────────────────────────
const client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    tlsInsecure: true,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000
});

let db;

async function connectDB() {
    if (db) return db;  // reuse existing connection
    await client.connect();
    db = client.db("mini-mrt");
    console.log("✅ MongoDB Connected");
    return db;
}

connectDB().catch(err => console.error("❌ MongoDB Error:", err));

// Helper: get collection
const col = (name) => db.collection(name);

// ─────────────────────────────────────────
//  STATIC ROUTES (always available)
// ─────────────────────────────────────────
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/test", async (req, res) => {
    try {
        await connectDB();
        res.json({ success: true, message: "Server Running ✅", dbReady: true });
    } catch(e) {
        res.json({ success: true, message: "Server Running ✅", dbReady: false, error: e.message });
    }
});

// Middleware: ensure DB is ready before any API route
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (e) {
        res.status(503).json({ message: "Database connection failed: " + e.message });
    }
});

// ─────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────
app.post("/users/sync", async (req, res) => {
    try {
        const { uid, name, email } = req.body;
        await col("users").updateOne(
            { email },
            { $set: { uid, name, email }, $setOnInsert: { savedAddresses: [], wishlist: [], currentLocation: {} } },
            { upsert: true }
        );
        const user = await col("users").findOne({ email });
        res.json({ success: true, user });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/users/:email", async (req, res) => {
    try {
        const user = await col("users").findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/users/:email/address", async (req, res) => {
    try {
        await col("users").updateOne(
            { email: req.params.email },
            { $addToSet: { savedAddresses: req.body.address } }
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/users/:email/location", async (req, res) => {
    try {
        const { location, latitude, longitude } = req.body;
        await col("users").updateOne(
            { email: req.params.email },
            { $set: { currentLocation: { location, latitude, longitude } } }
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────
//  PRODUCTS
// ─────────────────────────────────────────
app.get("/products", async (req, res) => {
    try {
        const products = await col("products").find().sort({ createdAt: -1 }).toArray();
        res.json(products);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/products", async (req, res) => {
    try {
        const { name, price, stock, image, discount, category } = req.body;
        const result = await col("products").insertOne({
            name, price, stock, image, discount: discount || 0, category,
            createdAt: new Date()
        });
        res.json({ success: true, id: result.insertedId });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/products/:id", async (req, res) => {
    try {
        await col("products").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/products/:id", async (req, res) => {
    try {
        await col("products").deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────
//  CATEGORIES
// ─────────────────────────────────────────
app.get("/categories", async (req, res) => {
    try {
        const cats = await col("categories").find().sort({ order: 1 }).toArray();
        res.json(cats);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/categories", async (req, res) => {
    try {
        const result = await col("categories").insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────
//  COUPONS
// ─────────────────────────────────────────
app.get("/coupons", async (req, res) => {
    try {
        const coupons = await col("coupons").find({ active: true }).toArray();
        res.json(coupons);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/coupons/validate", async (req, res) => {
    try {
        const { code, orderTotal } = req.body;
        const coupon = await col("coupons").findOne({ code: code.toUpperCase(), active: true });
        if (!coupon) return res.status(404).json({ success: false, message: "Invalid coupon code" });
        if (orderTotal < (coupon.minOrder || 0)) {
            return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrder} required` });
        }
        const discount = coupon.type === "percent"
            ? Math.round(orderTotal * coupon.value / 100)
            : coupon.value;
        res.json({ success: true, coupon, discount });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────
app.post("/orders", async (req, res) => {
    try {
        const {
            orderId, userEmail, userName, mobile,
            items, total, productDiscount, couponDiscount, couponCode,
            deliveryCharge, grandTotal, paymentMethod,
            address, location, latitude, longitude
        } = req.body;

        const order = {
            orderId, userEmail, userName, mobile,
            items, total, productDiscount: productDiscount || 0,
            couponDiscount: couponDiscount || 0, couponCode: couponCode || "",
            deliveryCharge: deliveryCharge || 0, grandTotal, paymentMethod: paymentMethod || "COD",
            address, location: location || "", latitude: latitude || null, longitude: longitude || null,
            status: "Pending", createdAt: new Date()
        };

        await col("orders").insertOne(order);

        // WhatsApp message
        const itemsList = Array.isArray(items)
            ? items.map(i => `  • ${i.name} x${i.qty} = ₹${i.price * i.qty}`).join("\n")
            : String(items);
        const mapsLink = (latitude && longitude)
            ? `https://www.google.com/maps?q=${latitude},${longitude}`
            : "Not provided";

        const waMsg =
`🛒 *NEW ORDER — PS STORE*

👤 *Customer:* ${userName}
📞 *Mobile:* ${mobile}
📧 *Email:* ${userEmail}

📍 *Address:* ${address}
🗺️ *Location:* ${location || "—"}
📌 *Maps:* ${mapsLink}

📦 *Items:*
${itemsList}

━━━━━━━━━━━━━━━━━
💰 Items Total:      ₹${total}
🏷️ Product Discount: -₹${productDiscount || 0}
🎟️ Coupon (${couponCode || "—"}):  -₹${couponDiscount || 0}
🚚 Delivery:         ₹${deliveryCharge || 0}
━━━━━━━━━━━━━━━━━
🧾 *Grand Total:     ₹${grandTotal}*
💳 Payment: ${paymentMethod || "COD"}`;

        try {
            await axios.post(
                "https://api.greenapi.com/waInstance7107659215/sendMessage/4a155d0f286649eba8885e48cf7e28fd9422d2703c1f4df0a8",
                { chatId: "919784721900@c.us", message: waMsg }
            );
            console.log("✅ WhatsApp sent");
        } catch (waErr) { console.log("❌ WhatsApp error:", waErr.message); }

        res.json({ success: true, orderId });
    } catch (e) {
        console.error("ORDER ERROR:", e);
        res.status(500).json({ message: e.message });
    }
});

app.get("/orders", async (req, res) => {
    try {
        const orders = await col("orders").find().sort({ createdAt: -1 }).toArray();
        res.json(orders);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/orders/user/:email", async (req, res) => {
    try {
        const orders = await col("orders").find({ userEmail: req.params.email }).sort({ createdAt: -1 }).toArray();
        res.json(orders);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/orders/:id/status", async (req, res) => {
    try {
        await col("orders").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { status: req.body.status } }
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────
//  SERVER START
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
