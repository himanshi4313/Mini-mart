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

db.connect(err => {
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
message: "Server is running"
});
});

// Products Route
app.get("/products", (req, res) => {
db.query("SELECT * FROM products", (err, results) => {
if (err) {
console.error(err);
return res.status(500).json(err);
}
res.json(results);
});
});

// Orders List Route
app.get("/orders", (req, res) => {
db.query("SELECT * FROM orders", (err, results) => {
if (err) {
console.error(err);
return res.status(500).json(err);
}
res.json(results);
});
});

// Save Order Route
app.post("/orders", (req, res) => {
const { orderId, name, mobile, address, itemsSummary, totalAmt } = req.body;

const sql = "INSERT INTO orders (orderId, name, mobile, address, itemsSummary, totalAmt) VALUES (?, ?, ?, ?, ?, ?)";

db.query(
sql,
[orderId, name, mobile, address, itemsSummary, totalAmt],
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

// WhatsApp Notification Route
app.post("/send-order-notification", async (req, res) => {
try {
const { orderDetails } = req.body;

const url =
  "https://api.greenapi.com/waInstance7107659215/sendMessage/4a155d0f286649eba8885e48cf7e28fd9422d2703c1f4df0a8";

const response = await axios.post(url, {
  chatId: "918107872665@c.us",
  message: orderDetails
});

console.log("WhatsApp Sent:", response.data);

res.json({
  success: true
});

} catch (error) {
console.error(
"WhatsApp Error:",
error.response?.data || error.message
);

res.status(500).json({
  success: false
});

}
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
con sole.log("🚀 Server running on port ${PORT}");
});