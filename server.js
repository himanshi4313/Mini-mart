require("dotenv").config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mysql = require('mysql2');
const path = require('path');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './'))); // Isse index.html load hogi

// 1. MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect(err => {
    if (err) console.error("❌ DB Connection Error:", err);
    else console.log("✅ MySQL Connected!");
});

// 2. Homepage (Taki Cannot GET / na aaye)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Products Fetch Route
app.get('/products', (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 4. WhatsApp Notification Route
app.post("/send-order-notification", async (req, res) => {
    const { orderDetails } = req.body;
    const url = `https://api.greenapi.com/waInstance7107659215/sendMessage/4a155d0f286649eba8885e48cf7e28fd9422d2703c1f4df0a8`;
    
    try {
        await axios.post(url, {
            chatId: "919928769308@c.us",
            message: orderDetails
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 5. Orders Fetch Route
app.get('/orders', (req, res) => {
    db.query("SELECT * FROM orders", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));