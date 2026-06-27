require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mysql = require("mysql2");
const path = require("path");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "./")));

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

db.connect((err) => {
    if (err) {
        console.error("❌ DB Connection Error:", err);
    } else {
        console.log("✅ MySQL Connected!");
    }
});

// Home Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Test Route
app.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Server Running Successfully"
    });
});

// ================= PRODUCTS =================

// Get All Products
app.get("/products", (req, res) => {

    db.query(
        "SELECT * FROM products ORDER BY id DESC",
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json(results);

        }
    );

});

// Add Product
app.post("/products", (req, res) => {

    const {
        name,
        price,
        stock,
        image,
        discount,
        category
    } = req.body;

    const sql = `
        INSERT INTO products
        (name, price, stock, image, discount, category)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, price, stock, image, discount, category],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true,
                id: result.insertId
            });

        }
    );

});

// Update Product
app.put("/products/:id", (req, res) => {

    const id = req.params.id;

    const {
        name,
        price,
        stock,
        image,
        discount,
        category
    } = req.body;

    const sql = `
        UPDATE products
        SET
        name=?,
        price=?,
        stock=?,
        image=?,
        discount=?,
        category=?
        WHERE id=?
    `;

    db.query(
        sql,
        [
            name,
            price,
            stock,
            image,
            discount,
            category,
            id
        ],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true
            });

        }
    );

});

// Delete Product
app.delete("/products/:id", (req, res) => {

    const id = req.params.id;

    db.query(
        "DELETE FROM products WHERE id=?",
        [id],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true
            });

        }
    );

});

// ================= ORDERS =================

// Save Order
app.post("/orders", (req, res) => {

    const {
        orderId,
        name,
        mobile,
        address,
        itemsSummary,
        totalAmt
    } = req.body;

    const sql = `
        INSERT INTO orders
        (orderId, name, mobile, address, itemsSummary, totalAmt)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
    sql,
    [
        orderId,
        name,
        mobile,
        address,
        itemsSummary,
        totalAmt
    ],

    async (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }

        const message = `
🛒 NEW ORDER

👤 Name: ${name}
📞 Mobile: ${mobile}
📍 Address: ${address}

📦 Items:
${itemsSummary}

💰 Total: ₹${totalAmt}
`;

        try {

            await axios.post(
                "https://api.greenapi.com/waInstance7107659215/sendMessage/4a155d0f286649eba8885e48cf7e28fd9422d2703c1f4df0a8",
                {
                    chatId: "919928769308@c.us",
                    message: message
                }
            );

            console.log("✅ WhatsApp Sent");

        } catch (error) {

            console.log(
                "❌ WhatsApp Error:",
                error.response?.data ||
                error.message
            );

        }

        res.json({
            success: true,
            id: result.insertId
        });

    }
);

// Get Orders
app.get("/orders", (req, res) => {

    db.query(
        "SELECT * FROM orders ORDER BY id DESC",
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json(results);

        }
    );

});

// ================= WHATSAPP =================

app.post("/send-order-notification", async (req, res) => {

    try {

        const { orderDetails } = req.body;

        const url =
            "https://api.greenapi.com/waInstance7107659215/sendMessage/4a155d0f286649eba8885e48cf7e28fd9422d2703c1f4df0a8";

        const response = await axios.post(url, {
            chatId: "919928769308@c.us",
            message: orderDetails
        });

        console.log("✅ WhatsApp Sent:", response.data);

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "❌ WhatsApp Error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false
        });

    }

});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});