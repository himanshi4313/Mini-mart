require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const { MongoClient } = require("mongodb");

const products = [

// ── ATTA / GRAINS / RICE ─────────────────────
{name:"Rajdhani Whole Wheat Atta",category:"Grocery",price:235,discount:5,stock:40,image:"atta.jpg",unit:"5kg",
 variants:[{unit:"2kg",price:100,stock:60},{unit:"5kg",price:235,stock:40},{unit:"10kg",price:460,stock:20}]},
{name:"Patanjali Atta",category:"Grocery",price:220,discount:5,stock:40,image:"atta.jpg",unit:"5kg",
 variants:[{unit:"2kg",price:95,stock:60},{unit:"5kg",price:220,stock:40}]},
{name:"Sharbati Atta",category:"Grocery",price:260,discount:5,stock:40,image:"atta.jpg",unit:"5kg",
 variants:[{unit:"5kg",price:260,stock:40},{unit:"10kg",price:510,stock:20}]},
{name:"Sona Masoori Rice",category:"Grocery",price:75,discount:0,stock:50,image:"rice.jpg",unit:"1kg",
 variants:[{unit:"1kg",price:75,stock:50},{unit:"5kg",price:360,stock:30},{unit:"10kg",price:700,stock:20}]},
{name:"PR Rice",category:"Grocery",price:55,discount:0,stock:60,image:"rice.jpg",unit:"1kg",
 variants:[{unit:"1kg",price:55,stock:60},{unit:"5kg",price:265,stock:40},{unit:"10kg",price:520,stock:20}]},
{name:"Dawat Rozana Basmati Rice",category:"Grocery",price:140,discount:5,stock:40,image:"rice.jpg",unit:"1kg",
 variants:[{unit:"1kg",price:140,stock:40},{unit:"5kg",price:670,stock:20}]},
{name:"Maize Flour Makki Atta",category:"Grocery",price:50,discount:0,stock:40,image:"atta.jpg",unit:"1kg",
 variants:[{unit:"1kg",price:50,stock:40},{unit:"5kg",price:240,stock:20}]},
{name:"Besan Chickpea Flour",category:"Grocery",price:65,discount:0,stock:50,image:"besan.jpg",unit:"1kg",
 variants:[{unit:"500g",price:35,stock:60},{unit:"1kg",price:65,stock:50},{unit:"2kg",price:125,stock:30}]},
{name:"Suji Semolina",category:"Grocery",price:45,discount:0,stock:50,image:"suji.jpg",unit:"1kg",
 variants:[{unit:"500g",price:25,stock:60},{unit:"1kg",price:45,stock:50}]},
{name:"Maida Refined Flour",category:"Grocery",price:45,discount:0,stock:50,image:"maida.jpg",unit:"1kg",
 variants:[{unit:"1kg",price:45,stock:50},{unit:"5kg",price:210,stock:30}]},
{name:"Poha Flattened Rice",category:"Grocery",price:50,discount:0,stock:50,image:"poha.jpg",unit:"500g",
 variants:[{unit:"500g",price:50,stock:50},{unit:"1kg",price:95,stock:30}]},

// ── DAALS / PULSES ───────────────────────────
{name:"Toor Dal",category:"Grocery",price:160,discount:5,stock:50,image:"daal.jpg",unit:"1kg",
 variants:[{unit:"500g",price:85,stock:60},{unit:"1kg",price:160,stock:50},{unit:"5kg",price:775,stock:20}]},
{name:"Chana Dal",category:"Grocery",price:110,discount:5,stock:50,image:"daal.jpg",unit:"1kg",
 variants:[{unit:"500g",price:58,stock:60},{unit:"1kg",price:110,stock:50},{unit:"5kg",price:530,stock:20}]},
{name:"Moong Dal",category:"Grocery",price:130,discount:5,stock:50,image:"daal.jpg",unit:"1kg",
 variants:[{unit:"500g",price:68,stock:60},{unit:"1kg",price:130,stock:50}]},
{name:"Urad Dal",category:"Grocery",price:145,discount:5,stock:50,image:"daal.jpg",unit:"1kg",
 variants:[{unit:"500g",price:75,stock:60},{unit:"1kg",price:145,stock:50}]},
{name:"Masoor Dal",category:"Grocery",price:115,discount:5,stock:50,image:"daal.jpg",unit:"1kg",
 variants:[{unit:"500g",price:60,stock:60},{unit:"1kg",price:115,stock:50}]},
{name:"Rajma Red Kidney Beans",category:"Grocery",price:120,discount:5,stock:40,image:"rajma.jpg",unit:"1kg",
 variants:[{unit:"500g",price:65,stock:50},{unit:"1kg",price:120,stock:40}]},
{name:"Kabuli Chana",category:"Grocery",price:125,discount:5,stock:40,image:"chana.jpg",unit:"1kg",
 variants:[{unit:"500g",price:65,stock:50},{unit:"1kg",price:125,stock:40}]},
{name:"Kala Chana Black Chickpea",category:"Grocery",price:100,discount:5,stock:40,image:"chana.jpg",unit:"1kg",
 variants:[{unit:"500g",price:52,stock:50},{unit:"1kg",price:100,stock:40}]},
{name:"Moong Whole Green",category:"Grocery",price:115,discount:5,stock:40,image:"daal.jpg",unit:"1kg",
 variants:[{unit:"500g",price:60,stock:50},{unit:"1kg",price:115,stock:40}]},

// ── OIL & GHEE ───────────────────────────────
{name:"Amul Pure Ghee",category:"Grocery",price:295,discount:5,stock:40,image:"ghee.jpg",unit:"500ml",
 variants:[{unit:"200ml",price:130,stock:50},{unit:"500ml",price:295,stock:40},{unit:"1L",price:570,stock:20}]},
{name:"Patanjali Cow Ghee",category:"Grocery",price:275,discount:5,stock:40,image:"ghee.jpg",unit:"500ml",
 variants:[{unit:"500ml",price:275,stock:40},{unit:"1L",price:540,stock:20}]},
{name:"Dhara Mustard Oil",category:"Grocery",price:175,discount:5,stock:40,image:"oil.jpg",unit:"1L",
 variants:[{unit:"1L",price:175,stock:40},{unit:"5L",price:840,stock:20}]},
{name:"Saffola Active Oil",category:"Grocery",price:145,discount:8,stock:40,image:"oil.jpg",unit:"1L",
 variants:[{unit:"1L",price:145,stock:40},{unit:"2L",price:280,stock:30},{unit:"5L",price:660,stock:20}]},
{name:"Sundrop Sunflower Oil",category:"Grocery",price:135,discount:8,stock:40,image:"oil.jpg",unit:"1L",
 variants:[{unit:"1L",price:135,stock:40},{unit:"5L",price:640,stock:20}]},
{name:"Dalda Vanaspati",category:"Grocery",price:135,discount:5,stock:30,image:"dalda.jpg",unit:"1kg",
 variants:[{unit:"500g",price:70,stock:40},{unit:"1kg",price:135,stock:30}]},

// ── SUGAR / JAGGERY ──────────────────────────
{name:"Tata Sugar",category:"Grocery",price:50,discount:0,stock:60,image:"sugar.jpg",unit:"1kg",
 variants:[{unit:"1kg",price:50,stock:60},{unit:"5kg",price:240,stock:30}]},
{name:"Patanjali Desi Khand",category:"Grocery",price:60,discount:0,stock:50,image:"sugar.jpg",unit:"1kg",
 variants:[{unit:"1kg",price:60,stock:50}]},
{name:"Organic Jaggery Gud",category:"Grocery",price:65,discount:0,stock:50,image:"jaggery.jpg",unit:"500g",
 variants:[{unit:"500g",price:65,stock:50},{unit:"1kg",price:125,stock:30}]},

// ── SPICES / MASALA ──────────────────────────
{name:"Turmeric Powder Haldi",category:"Grocery",price:55,discount:5,stock:60,image:"haldi.jpg",unit:"100g",
 variants:[{unit:"100g",price:55,stock:60},{unit:"200g",price:100,stock:40}]},
{name:"Coriander Powder Dhania",category:"Grocery",price:50,discount:5,stock:60,image:"masala.jpg",unit:"100g",
 variants:[{unit:"100g",price:50,stock:60},{unit:"200g",price:95,stock:40}]},
{name:"Everest Sambhar Masala",category:"Grocery",price:65,discount:5,stock:50,image:"masala.jpg",unit:"100g",
 variants:[{unit:"100g",price:65,stock:50}]},
{name:"MDH Chana Masala",category:"Grocery",price:60,discount:5,stock:50,image:"masala.jpg",unit:"100g",
 variants:[{unit:"100g",price:60,stock:50}]},
{name:"Catch Cumin Seeds Jeera",category:"Grocery",price:55,discount:5,stock:50,image:"masala.jpg",unit:"100g",
 variants:[{unit:"100g",price:55,stock:50},{unit:"200g",price:105,stock:30}]},
{name:"Tata Sampann Rajwadi Masala",category:"Grocery",price:75,discount:8,stock:50,image:"masala.jpg",unit:"100g",
 variants:[{unit:"100g",price:75,stock:50}]},

// ── PACKAGED / INSTANT FOOD ──────────────────
{name:"Knorr Soup Tomato",category:"Grocery",price:35,discount:5,stock:60,image:"soup.jpg",unit:"53g",
 variants:[{unit:"53g",price:35,stock:60}]},
{name:"Ching's Schezwan Noodles",category:"Grocery",price:30,discount:5,stock:60,image:"noodles.jpg",unit:"60g",
 variants:[{unit:"60g",price:30,stock:60},{unit:"6x60g",price:170,stock:30}]},
{name:"Yippee Noodles",category:"Grocery",price:14,discount:0,stock:100,image:"noodles.jpg",unit:"70g",
 variants:[{unit:"70g",price:14,stock:100},{unit:"4x70g",price:55,stock:60}]},
{name:"Top Ramen Noodles",category:"Grocery",price:14,discount:0,stock:100,image:"noodles.jpg",unit:"70g",
 variants:[{unit:"70g",price:14,stock:100},{unit:"4x70g",price:55,stock:60}]},
{name:"MTR Poha Mix",category:"Grocery",price:50,discount:5,stock:50,image:"poha.jpg",unit:"200g",
 variants:[{unit:"200g",price:50,stock:50}]},
{name:"MTR Upma Mix",category:"Grocery",price:55,discount:5,stock:50,image:"poha.jpg",unit:"200g",
 variants:[{unit:"200g",price:55,stock:50}]},

// ── SAUCES / CONDIMENTS ──────────────────────
{name:"Maggi Hot Sweet Sauce",category:"Grocery",price:65,discount:5,stock:50,image:"sauce.jpg",unit:"400g",
 variants:[{unit:"200g",price:35,stock:60},{unit:"400g",price:65,stock:50}]},
{name:"Heinz Tomato Ketchup",category:"Grocery",price:90,discount:8,stock:40,image:"ketchup.jpg",unit:"500g",
 variants:[{unit:"200g",price:45,stock:50},{unit:"500g",price:90,stock:40}]},
{name:"Dr Oetker Mayonnaise",category:"Grocery",price:85,discount:8,stock:40,image:"mayo.jpg",unit:"275g",
 variants:[{unit:"275g",price:85,stock:40}]},
{name:"Cremica Tomato Ketchup",category:"Grocery",price:75,discount:5,stock:50,image:"ketchup.jpg",unit:"500g",
 variants:[{unit:"200g",price:35,stock:60},{unit:"500g",price:75,stock:50}]},

// ── BREAKFAST / OATS ─────────────────────────
{name:"Quaker Oats",category:"Grocery",price:95,discount:8,stock:50,image:"oats.jpg",unit:"500g",
 variants:[{unit:"200g",price:45,stock:60},{unit:"500g",price:95,stock:50},{unit:"1kg",price:175,stock:30}]},
{name:"Kellogs Corn Flakes",category:"Grocery",price:165,discount:10,stock:40,image:"cornflakes.jpg",unit:"300g",
 variants:[{unit:"300g",price:165,stock:40},{unit:"700g",price:360,stock:20}]},
{name:"Bagrry Muesli",category:"Grocery",price:180,discount:10,stock:30,image:"muesli.jpg",unit:"500g",
 variants:[{unit:"500g",price:180,stock:30},{unit:"1kg",price:340,stock:20}]},
];

async function run() {
    const client = new MongoClient(process.env.MONGO_URI, { tls:true, tlsInsecure:true, serverSelectionTimeoutMS:15000 });
    await client.connect();
    const db = client.db("mini-mrt");

    // Get existing names to avoid duplicates
    const existing = await db.collection("products").distinct("name");
    const toAdd = products.filter(p => !existing.includes(p.name));

    if (!toAdd.length) { console.log("All already exist!"); await client.close(); process.exit(0); }

    const result = await db.collection("products").insertMany(toAdd.map(p => ({...p, createdAt:new Date()})));
    console.log("Added:", result.insertedCount, "new products");
    console.log("Skipped (already exist):", products.length - toAdd.length);
    const total = await db.collection("products").countDocuments();
    console.log("Total in DB:", total);
    await client.close();
    process.exit(0);
}
run().catch(e => { console.log("ERROR:", e.message); process.exit(1); });
