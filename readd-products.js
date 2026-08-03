require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8","8.8.4.4"]);
const { MongoClient } = require("mongodb");

// Only products with EXISTING images mapped correctly
const products = [
// GROCERY — using existing images
{name:"Aashirvaad Atta",category:"Grocery",price:280,discount:5,stock:50,image:"aashirvaad_aata.jpg",unit:"5kg",variants:[{unit:"2kg",price:120,stock:60},{unit:"5kg",price:280,stock:50},{unit:"10kg",price:530,stock:30}]},
{name:"Wheat Atta (Sharbati)",category:"Grocery",price:260,discount:5,stock:40,image:"wheat.jpg",unit:"5kg",variants:[{unit:"2kg",price:110,stock:60},{unit:"5kg",price:260,stock:40},{unit:"10kg",price:510,stock:20}]},
{name:"Sona Masoori Rice",category:"Grocery",price:75,discount:0,stock:50,image:"rice.jpg",unit:"1kg",variants:[{unit:"1kg",price:75,stock:50},{unit:"5kg",price:360,stock:30},{unit:"10kg",price:700,stock:20}]},
{name:"Tata Salt",category:"Grocery",price:24,discount:0,stock:100,image:"salt.jpg",unit:"1kg",variants:[{unit:"1kg",price:24,stock:100},{unit:"2kg",price:46,stock:60}]},
{name:"Tata Tea Gold",category:"Grocery",price:85,discount:5,stock:60,image:"tea.jpg",unit:"250g",variants:[{unit:"250g",price:85,stock:60},{unit:"500g",price:165,stock:40}]},
{name:"Bru Instant Coffee",category:"Grocery",price:90,discount:8,stock:40,image:"coffee.jpg",unit:"50g",variants:[{unit:"50g",price:90,stock:40},{unit:"100g",price:175,stock:30}]},
{name:"Kissan Ketchup",category:"Grocery",price:85,discount:8,stock:40,image:"kisaan.jpg",unit:"500g",variants:[{unit:"200g",price:40,stock:50},{unit:"500g",price:85,stock:40},{unit:"1kg",price:155,stock:20}]},
{name:"Maggi Noodles",category:"Grocery",price:14,discount:0,stock:100,image:"namkeen.jpg",unit:"70g",variants:[{unit:"70g",price:14,stock:100},{unit:"4x70g",price:56,stock:60}]},
{name:"Parle G Biscuit",category:"Grocery",price:10,discount:0,stock:100,image:"parle1kg.jpg",unit:"100g",variants:[{unit:"100g",price:10,stock:100},{unit:"250g",price:25,stock:80},{unit:"1kg",price:98,stock:40}]},
{name:"Monaco Biscuit",category:"Grocery",price:30,discount:5,stock:80,image:"monaco.jpg",unit:"200g",variants:[{unit:"200g",price:30,stock:80},{unit:"400g",price:58,stock:40}]},
{name:"KrackJack Biscuit",category:"Grocery",price:30,discount:5,stock:80,image:"krackjack.jpg",unit:"200g",variants:[{unit:"200g",price:30,stock:80},{unit:"400g",price:58,stock:40}]},
{name:"Lays Classic Chips",category:"Grocery",price:20,discount:0,stock:100,image:"lays.jpg",unit:"26g",variants:[{unit:"26g",price:20,stock:100},{unit:"52g",price:40,stock:60}]},
{name:"Kurkure Masala Munch",category:"Grocery",price:20,discount:0,stock:100,image:"kurkure.jpg",unit:"45g",variants:[{unit:"45g",price:20,stock:100},{unit:"90g",price:40,stock:60}]},
{name:"Cadbury Dairy Milk",category:"Grocery",price:40,discount:5,stock:80,image:"chocolate.jpg",unit:"38g",variants:[{unit:"38g",price:40,stock:80},{unit:"110g",price:100,stock:40}]},
{name:"Good Day Cashew Biscuit",category:"Grocery",price:35,discount:5,stock:80,image:"gooddaycashew.jpd",unit:"200g",variants:[{unit:"200g",price:35,stock:80},{unit:"400g",price:65,stock:40}]},
{name:"Fortune Soyabean Oil",category:"Grocery",price:140,discount:8,stock:40,image:"Soya.jpg",unit:"1L",variants:[{unit:"1L",price:140,stock:40},{unit:"2L",price:270,stock:30},{unit:"5L",price:650,stock:20}]},
{name:"Fortune Soya Oil 5L",category:"Grocery",price:650,discount:5,stock:20,image:"Soya5.jpg",unit:"5L",variants:[{unit:"5L",price:650,stock:20}]},
{name:"Tata Sugar",category:"Grocery",price:50,discount:0,stock:60,image:"suger.jpg",unit:"1kg",variants:[{unit:"1kg",price:50,stock:60},{unit:"5kg",price:240,stock:30}]},
{name:"Surf Excel Detergent",category:"Grocery",price:55,discount:8,stock:60,image:"surf.jpg",unit:"500g",variants:[{unit:"500g",price:55,stock:60},{unit:"1kg",price:105,stock:40}]},
{name:"Toor Dal",category:"Grocery",price:160,discount:5,stock:50,image:"turdal.jpg",unit:"1kg",variants:[{unit:"500g",price:85,stock:60},{unit:"1kg",price:160,stock:50},{unit:"5kg",price:775,stock:20}]},
{name:"Moong Dal",category:"Grocery",price:130,discount:5,stock:50,image:"moongdal.jpg",unit:"1kg",variants:[{unit:"500g",price:68,stock:60},{unit:"1kg",price:130,stock:50}]},
{name:"Namkeen Mixture",category:"Grocery",price:60,discount:5,stock:60,image:"namkeen.jpg",unit:"200g",variants:[{unit:"200g",price:60,stock:60},{unit:"400g",price:115,stock:30}]},
{name:"Popcorn",category:"Grocery",price:30,discount:0,stock:60,image:"popcorn.jpg",unit:"70g",variants:[{unit:"70g",price:30,stock:60}]},
{name:"Amul Butter",category:"Dairy Products",price:60,discount:0,stock:60,image:"butter.jpg",unit:"100g",variants:[{unit:"100g",price:60,stock:60},{unit:"500g",price:285,stock:30}]},
{name:"Amul Taaza Milk",category:"Dairy Products",price:32,discount:0,stock:100,image:"taaza.jpg",unit:"500ml",variants:[{unit:"500ml",price:32,stock:100},{unit:"1L",price:64,stock:80}]},
{name:"Amul Dahi",category:"Dairy Products",price:45,discount:5,stock:60,image:"curd.jpg",unit:"400g",variants:[{unit:"200g",price:25,stock:60},{unit:"400g",price:45,stock:50},{unit:"1kg",price:95,stock:30}]},
// COLD DRINKS
{name:"Coca Cola",category:"Cold Drinks",price:40,discount:0,stock:80,image:"coke.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:80},{unit:"750ml",price:40,stock:60},{unit:"1.25L",price:65,stock:40},{unit:"2L",price:90,stock:30}]},
{name:"Pepsi",category:"Cold Drinks",price:40,discount:0,stock:80,image:"pepsi.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:80},{unit:"750ml",price:40,stock:60},{unit:"2L",price:90,stock:30}]},
{name:"Sprite",category:"Cold Drinks",price:40,discount:0,stock:70,image:"sprite.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:70},{unit:"750ml",price:40,stock:50}]},
{name:"Thums Up",category:"Cold Drinks",price:40,discount:0,stock:70,image:"thumsup.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:70},{unit:"750ml",price:40,stock:50}]},
{name:"Frooti Mango",category:"Cold Drinks",price:20,discount:0,stock:80,image:"frooti.jpg",unit:"200ml",variants:[{unit:"200ml",price:20,stock:80},{unit:"500ml",price:45,stock:50}]},
{name:"Maaza Mango",category:"Cold Drinks",price:20,discount:0,stock:80,image:"maaza.jpg",unit:"250ml",variants:[{unit:"250ml",price:20,stock:80},{unit:"600ml",price:45,stock:50}]},
{name:"Limca",category:"Cold Drinks",price:40,discount:0,stock:60,image:"limca.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:60},{unit:"750ml",price:40,stock:40}]},
{name:"Mountain Dew",category:"Cold Drinks",price:40,discount:0,stock:60,image:"mountaindew.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:60},{unit:"750ml",price:40,stock:40}]},
{name:"Appy Fizz",category:"Cold Drinks",price:30,discount:0,stock:60,image:"appyfizz.jpg",unit:"250ml",variants:[{unit:"250ml",price:30,stock:60}]},
{name:"Real Juice",category:"Cold Drinks",price:50,discount:5,stock:50,image:"realjuice.jpg",unit:"200ml",variants:[{unit:"200ml",price:50,stock:50},{unit:"1L",price:130,stock:30}]},
// CLEANING
{name:"Harpic Toilet Cleaner",category:"Cleaning",price:110,discount:8,stock:50,image:"harpic.jpg",unit:"500ml",variants:[{unit:"200ml",price:50,stock:60},{unit:"500ml",price:110,stock:50},{unit:"1L",price:190,stock:30}]},
{name:"Colin Glass Cleaner",category:"Cleaning",price:110,discount:10,stock:50,image:"colin.jpg",unit:"500ml",variants:[{unit:"250ml",price:60,stock:60},{unit:"500ml",price:110,stock:50}]},
{name:"Floor Cleaner Phenyl",category:"Cleaning",price:80,discount:5,stock:50,image:"phenyl.jpg",unit:"500ml",variants:[{unit:"500ml",price:80,stock:50},{unit:"1L",price:150,stock:30}]},
{name:"Surf Excel Easy Wash",category:"Cleaning",price:55,discount:8,stock:60,image:"mr_white_surf.jpg",unit:"500g",variants:[{unit:"500g",price:55,stock:60},{unit:"1kg",price:105,stock:40}]},
{name:"Tide Plus Detergent",category:"Cleaning",price:55,discount:8,stock:60,image:"Tide.jpg",unit:"500g",variants:[{unit:"500g",price:55,stock:60},{unit:"1kg",price:105,stock:40}]},
{name:"Dettol Handwash",category:"Cleaning",price:70,discount:8,stock:60,image:"handwash.jpg",unit:"200ml",variants:[{unit:"200ml",price:70,stock:60},{unit:"500ml",price:145,stock:40}]},
{name:"Lifebuoy Handwash",category:"Cleaning",price:65,discount:5,stock:60,image:"handwash.jpg",unit:"200ml",variants:[{unit:"200ml",price:65,stock:60},{unit:"500ml",price:130,stock:40}]},
{name:"Floor Cleaner",category:"Cleaning",price:95,discount:5,stock:35,image:"floorcleaner.jpg",unit:"1L",variants:[{unit:"500ml",price:55,stock:50},{unit:"1L",price:95,stock:35}]},
// COSMETICS
{name:"Jo Soap",category:"Cosmetics",price:35,discount:0,stock:60,image:"jo_soap.jpg",unit:"150g",variants:[{unit:"150g",price:35,stock:60}]},
{name:"Ponds Body Lotion",category:"Cosmetics",price:120,discount:8,stock:50,image:"ponds_lotion.jpg",unit:"200ml",variants:[{unit:"100ml",price:70,stock:60},{unit:"200ml",price:120,stock:50}]},
{name:"Perfume Spray",category:"Cosmetics",price:180,discount:10,stock:40,image:"perfume.jpg",unit:"100ml",variants:[{unit:"100ml",price:180,stock:40}]},
{name:"Wild Stone Deo",category:"Cosmetics",price:180,discount:8,stock:40,image:"wildstone.jpg",unit:"150ml",variants:[{unit:"150ml",price:180,stock:40}]},
{name:"Oral B Toothpaste",category:"Cosmetics",price:65,discount:10,stock:60,image:"toothpaste.jpg",unit:"75g",variants:[{unit:"75g",price:65,stock:60},{unit:"150g",price:115,stock:40}]},
{name:"Clinic Plus Shampoo",category:"Cosmetics",price:55,discount:5,stock:60,image:"shampoo.jpg",unit:"175ml",variants:[{unit:"80ml",price:30,stock:80},{unit:"175ml",price:55,stock:60}]},
];

async function run() {
    const client = new MongoClient(process.env.MONGO_URI, { tls:true, tlsInsecure:true, serverSelectionTimeoutMS:15000 });
    await client.connect();
    const db = client.db("mini-mrt");

    const existing = await db.collection("products").distinct("name");
    const toAdd = products.filter(p => !existing.includes(p.name));

    if (toAdd.length) {
        const result = await db.collection("products").insertMany(toAdd.map(p => ({...p, createdAt:new Date()})));
        console.log("Added:", result.insertedCount);
    }

    const total = await db.collection("products").countDocuments();
    console.log("Total in DB:", total);
    await client.close();
    process.exit(0);
}
run().catch(e => { console.log("ERROR:", e.message); process.exit(1); });
