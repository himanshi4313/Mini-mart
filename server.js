const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mysql = require('mysql2');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234', // Jo aapne set kiya tha
    database: 'minimart'
});

db.connect(err => {
    if (err) console.error("❌ MySQL Connection Failed: " + err.message);
    else console.log("✅ MySQL Connected!");
});

// 1. Order Saving Route
app.post("/orders", (req, res) => {
    const { orderId, name, mobile, address, itemsSummary, totalAmt } = req.body;
    const sql = "INSERT INTO orders (orderId, name, mobile, address, itemsSummary, totalAmt) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [orderId, name, mobile, address, itemsSummary, totalAmt], (err) => {
        if (err) {
            console.error("❌ DB Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "Order Saved Successfully" });
    });
});

// 2. Fetch Orders (Admin Dashboard ke liye)
app.get("/orders", (req, res) => {
    db.query("SELECT * FROM orders", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 3. WhatsApp Notification Route (With Button)
app.post("/send-order-notification", async (req, res) => {
    const { orderDetails, customerMobile } = req.body;
    const url = `https://api.greenapi.com/waInstance7107659215/sendMessage/4a155d0f286649eba8885e48cf7e28fd9422d2703c1f4df0a8`;
    
    // Number format fix
    const chatId = customerMobile.startsWith("91") ? `${customerMobile}@c.us` : `91${customerMobile}@c.us`;

    try {
        await axios.post(url, {
            chatId: chatId,
            message: orderDetails + "\n\nClick the button below to confirm your order:",
            buttons: [{ buttonId: 'confirm_order', buttonText: { displayText: '✅ Confirm Order' }, type: 1 }]
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ WhatsApp Error:", error.message);
        res.status(500).json({ success: false });
    }
});

// 4. Webhook Route (Jab Customer Button Dabaye)
app.post("/webhook", async (req, res) => {
    const data = req.body;
    const ownerUrl = `https://api.greenapi.com/waInstance7107659215/sendMessage/4a155d0f286649eba8885e48cf7e28fd9422d2703c1f4df0a8`;

    // Agar customer button dabata hai
    if (data.typeWebhook === 'incomingMessageReceived' && 
        data.messageData?.extendedTextMessageData?.selectedButtonId === 'confirm_order') {
        
        // Owner (Aapko) alert bhejo
        await axios.post(ownerUrl, {
            chatId: "918769184313@c.us", 
            message: "🚨 ALERT: Customer ne order confirm kar diya hai!"
        });
        console.log("✅ Owner notified!");
    }
    res.status(200).send("OK");
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));