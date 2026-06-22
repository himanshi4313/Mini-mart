const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mysql = require('mysql2');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'minimart'
});

db.connect(err => {
    if (err) console.error("❌ MySQL Connection Failed: " + err.message);
    else console.log("✅ MySQL Connected!");
});

// Route: Save Order to DB
app.post("/orders", (req, res) => {
    const { orderId, name, mobile, address, itemsSummary, totalAmt } = req.body;
    const sql = "INSERT INTO orders (orderId, name, mobile, address, itemsSummary, totalAmt) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [orderId, name, mobile, address, itemsSummary, totalAmt], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).json({ message: "Order Saved" });
    });
});

// Route: Send WhatsApp with Button
app.post("/send-order-notification", async (req, res) => {
    const { orderDetails, customerMobile } = req.body;
    const url = `https://api.greenapi.com/waInstance7107659215/sendMessage/4a155d0f286649eba8885e48cf7e28fd9422d2703c1f4df0a8`;
    const chatId = customerMobile.startsWith("91") ? `${customerMobile}@c.us` : `91${customerMobile}@c.us`;

    try {
        await axios.post(url, {
            chatId: chatId,
            message: orderDetails + "\n\nClick below to confirm:",
            buttons: [{ buttonId: 'confirm_order', buttonText: { displayText: '✅ Confirm Order' }, type: 1 }]
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));