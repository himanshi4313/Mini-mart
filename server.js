require("dotenv").config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mysql = require('mysql2');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// TEST ROUTE
app.get('/test', (req, res) => {
  res.json({
    status: "working",
    host: process.env.MYSQLHOST,
    database: process.env.MYSQLDATABASE
  });
});

// TEST PRODUCTS ROUTE

app.get('/products', (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});