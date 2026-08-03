require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const { MongoClient } = require("mongodb");

const products = [
// GROCERY
{name:"Aashirvaad Atta",category:"Grocery",price:280,discount:5,stock:50,image:"atta.jpg",unit:"5kg",variants:[{unit:"2kg",price:120,stock:60},{unit:"5kg",price:280,stock:50},{unit:"10kg",price:530,stock:30}]},
{name:"Fortune Soyabean Oil",category:"Grocery",price:140,discount:8,stock:40,image:"oil.jpg",unit:"1L",variants:[{unit:"1L",price:140,stock:40},{unit:"2L",price:270,stock:30},{unit:"5L",price:650,stock:20}]},
{name:"Tata Salt",category:"Grocery",price:24,discount:0,stock:100,image:"salt.jpg",unit:"1kg",variants:[{unit:"1kg",price:24,stock:100},{unit:"2kg",price:46,stock:60}]},
{name:"India Gate Basmati Rice",category:"Grocery",price:155,discount:5,stock:40,image:"rice.jpg",unit:"1kg",variants:[{unit:"1kg",price:155,stock:40},{unit:"5kg",price:740,stock:20}]},
{name:"Tata Tea Gold",category:"Grocery",price:85,discount:5,stock:60,image:"tea.jpg",unit:"250g",variants:[{unit:"250g",price:85,stock:60},{unit:"500g",price:165,stock:40}]},
{name:"Bru Instant Coffee",category:"Grocery",price:90,discount:8,stock:40,image:"coffee.jpg",unit:"50g",variants:[{unit:"50g",price:90,stock:40},{unit:"100g",price:175,stock:30}]},
{name:"Kissan Ketchup",category:"Grocery",price:85,discount:8,stock:40,image:"kisaan.jpg",unit:"500g",variants:[{unit:"200g",price:40,stock:50},{unit:"500g",price:85,stock:40},{unit:"1kg",price:155,stock:20}]},
{name:"Maggi Noodles",category:"Grocery",price:14,discount:0,stock:100,image:"maggi.jpg",unit:"70g",variants:[{unit:"70g",price:14,stock:100},{unit:"4x70g",price:56,stock:60},{unit:"12x70g",price:162,stock:30}]},
{name:"Parle G Biscuit",category:"Grocery",price:10,discount:0,stock:100,image:"parle1kg.jpg",unit:"100g",variants:[{unit:"100g",price:10,stock:100},{unit:"250g",price:25,stock:80},{unit:"1kg",price:98,stock:40}]},
{name:"Monaco Biscuit",category:"Grocery",price:30,discount:5,stock:80,image:"monaco.jpg",unit:"200g",variants:[{unit:"200g",price:30,stock:80},{unit:"400g",price:58,stock:40}]},
{name:"KrackJack Biscuit",category:"Grocery",price:30,discount:5,stock:80,image:"krackjack.jpg",unit:"200g",variants:[{unit:"200g",price:30,stock:80},{unit:"400g",price:58,stock:40}]},
{name:"Lays Classic Chips",category:"Grocery",price:20,discount:0,stock:100,image:"lays.jpg",unit:"26g",variants:[{unit:"26g",price:20,stock:100},{unit:"52g",price:40,stock:60}]},
{name:"Kurkure Masala Munch",category:"Grocery",price:20,discount:0,stock:100,image:"kurkure.jpg",unit:"45g",variants:[{unit:"45g",price:20,stock:100},{unit:"90g",price:40,stock:60}]},
{name:"Cadbury Dairy Milk",category:"Grocery",price:40,discount:5,stock:80,image:"chocolate.jpg",unit:"38g",variants:[{unit:"38g",price:40,stock:80},{unit:"110g",price:100,stock:40}]},
{name:"Britannia Bourbon Biscuit",category:"Grocery",price:30,discount:5,stock:80,image:"bourbon.jpg",unit:"200g",variants:[{unit:"200g",price:30,stock:80}]},
{name:"Good Day Cashew Biscuit",category:"Grocery",price:35,discount:5,stock:80,image:"goodday.jpg",unit:"200g",variants:[{unit:"200g",price:35,stock:80},{unit:"400g",price:65,stock:40}]},
{name:"Hide N Seek Biscuit",category:"Grocery",price:35,discount:5,stock:60,image:"hidenseek.jpg",unit:"200g",variants:[{unit:"200g",price:35,stock:60}]},
{name:"Sunfeast Dark Fantasy",category:"Grocery",price:35,discount:5,stock:60,image:"darkfantasy.jpg",unit:"150g",variants:[{unit:"150g",price:35,stock:60}]},
{name:"Haldiram Aloo Bhujia",category:"Grocery",price:60,discount:5,stock:60,image:"bhujia.jpg",unit:"200g",variants:[{unit:"200g",price:60,stock:60},{unit:"400g",price:115,stock:30}]},
{name:"Too Yumm Rice Crackers",category:"Grocery",price:30,discount:8,stock:60,image:"tooyumm.jpg",unit:"60g",variants:[{unit:"60g",price:30,stock:60}]},
{name:"Catch Black Pepper",category:"Grocery",price:65,discount:5,stock:50,image:"pepper.jpg",unit:"100g",variants:[{unit:"50g",price:35,stock:50},{unit:"100g",price:65,stock:40}]},
{name:"MDH Garam Masala",category:"Grocery",price:70,discount:5,stock:50,image:"garammasala.jpg",unit:"100g",variants:[{unit:"50g",price:38,stock:60},{unit:"100g",price:70,stock:50}]},
{name:"Everest Chilli Powder",category:"Grocery",price:55,discount:5,stock:50,image:"chilli.jpg",unit:"100g",variants:[{unit:"100g",price:55,stock:50}]},
{name:"Saffola Honey",category:"Grocery",price:180,discount:8,stock:40,image:"honey.jpg",unit:"500g",variants:[{unit:"250g",price:100,stock:50},{unit:"500g",price:180,stock:40}]},
{name:"Dabur Chyawanprash",category:"Grocery",price:195,discount:10,stock:40,image:"chyawanprash.jpg",unit:"500g",variants:[{unit:"250g",price:110,stock:50},{unit:"500g",price:195,stock:40}]},
// DAIRY
{name:"Amul Taaza Milk",category:"Dairy Products",price:32,discount:0,stock:100,image:"milk.jpg",unit:"500ml",variants:[{unit:"500ml",price:32,stock:100},{unit:"1L",price:64,stock:80}]},
{name:"Amul Gold Full Cream Milk",category:"Dairy Products",price:35,discount:0,stock:80,image:"milk.jpg",unit:"500ml",variants:[{unit:"500ml",price:35,stock:80},{unit:"1L",price:68,stock:60}]},
{name:"Amul Butter",category:"Dairy Products",price:60,discount:0,stock:60,image:"butter.jpg",unit:"100g",variants:[{unit:"100g",price:60,stock:60},{unit:"500g",price:285,stock:30}]},
{name:"Amul Dahi",category:"Dairy Products",price:45,discount:5,stock:60,image:"curd.jpg",unit:"400g",variants:[{unit:"200g",price:25,stock:60},{unit:"400g",price:45,stock:50},{unit:"1kg",price:95,stock:30}]},
{name:"Amul Cheese Slices",category:"Dairy Products",price:115,discount:5,stock:40,image:"cheese.jpg",unit:"200g",variants:[{unit:"200g",price:115,stock:40},{unit:"400g",price:220,stock:20}]},
{name:"Amul Malai Paneer",category:"Dairy Products",price:95,discount:5,stock:40,image:"paneer.jpg",unit:"200g",variants:[{unit:"200g",price:95,stock:40},{unit:"500g",price:225,stock:20}]},
{name:"Amul Shrikhand",category:"Dairy Products",price:75,discount:5,stock:40,image:"shrikhand.jpg",unit:"200g",variants:[{unit:"200g",price:75,stock:40},{unit:"500g",price:180,stock:20}]},
{name:"Mother Dairy Mishti Doi",category:"Dairy Products",price:40,discount:0,stock:40,image:"curd.jpg",unit:"200g",variants:[{unit:"200g",price:40,stock:40}]},
{name:"Amul Lassi",category:"Dairy Products",price:25,discount:0,stock:60,image:"lassi.jpg",unit:"200ml",variants:[{unit:"200ml",price:25,stock:60},{unit:"500ml",price:55,stock:40}]},
{name:"Amul Kool Milk",category:"Dairy Products",price:30,discount:0,stock:60,image:"kool.jpg",unit:"200ml",variants:[{unit:"200ml",price:30,stock:60}]},
// COLD DRINKS
{name:"Coca Cola",category:"Cold Drinks",price:40,discount:0,stock:80,image:"coke.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:80},{unit:"750ml",price:40,stock:60},{unit:"1.25L",price:65,stock:40},{unit:"2L",price:90,stock:30}]},
{name:"Pepsi",category:"Cold Drinks",price:40,discount:0,stock:80,image:"pepsi.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:80},{unit:"750ml",price:40,stock:60},{unit:"2L",price:90,stock:30}]},
{name:"Sprite",category:"Cold Drinks",price:40,discount:0,stock:70,image:"sprite.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:70},{unit:"750ml",price:40,stock:50}]},
{name:"Thums Up",category:"Cold Drinks",price:40,discount:0,stock:70,image:"thumsup.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:70},{unit:"750ml",price:40,stock:50}]},
{name:"Frooti Mango",category:"Cold Drinks",price:20,discount:0,stock:80,image:"frooti.jpg",unit:"200ml",variants:[{unit:"200ml",price:20,stock:80},{unit:"500ml",price:45,stock:50}]},
{name:"Maaza Mango",category:"Cold Drinks",price:20,discount:0,stock:80,image:"maaza.jpg",unit:"250ml",variants:[{unit:"250ml",price:20,stock:80},{unit:"600ml",price:45,stock:50}]},
{name:"Limca",category:"Cold Drinks",price:40,discount:0,stock:60,image:"limca.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:60},{unit:"750ml",price:40,stock:40}]},
{name:"7Up",category:"Cold Drinks",price:40,discount:0,stock:60,image:"7up.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:60},{unit:"750ml",price:40,stock:40}]},
{name:"Mountain Dew",category:"Cold Drinks",price:40,discount:0,stock:60,image:"mountaindew.jpg",unit:"750ml",variants:[{unit:"250ml",price:20,stock:60},{unit:"750ml",price:40,stock:40}]},
{name:"Appy Fizz",category:"Cold Drinks",price:30,discount:0,stock:60,image:"appyfizz.jpg",unit:"250ml",variants:[{unit:"250ml",price:30,stock:60}]},
{name:"Real Juice",category:"Cold Drinks",price:50,discount:5,stock:50,image:"realjuice.jpg",unit:"200ml",variants:[{unit:"200ml",price:50,stock:50},{unit:"1L",price:130,stock:30}]},
{name:"B Natural Juice",category:"Cold Drinks",price:55,discount:5,stock:50,image:"bnatural.jpg",unit:"200ml",variants:[{unit:"200ml",price:55,stock:50},{unit:"1L",price:140,stock:30}]},
{name:"Red Bull Energy Drink",category:"Cold Drinks",price:125,discount:0,stock:40,image:"redbull.jpg",unit:"250ml",variants:[{unit:"250ml",price:125,stock:40}]},
// COSMETICS
{name:"Lux Soft Touch Soap",category:"Cosmetics",price:45,discount:5,stock:100,image:"lux.jpg",unit:"100g",variants:[{unit:"100g",price:45,stock:100},{unit:"3x100g",price:125,stock:50}]},
{name:"Lifebuoy Total Soap",category:"Cosmetics",price:38,discount:5,stock:100,image:"lifebuoy.jpg",unit:"125g",variants:[{unit:"75g",price:25,stock:100},{unit:"125g",price:38,stock:80}]},
{name:"Dove Cream Soap",category:"Cosmetics",price:65,discount:8,stock:80,image:"dove.jpg",unit:"100g",variants:[{unit:"100g",price:65,stock:80},{unit:"3x100g",price:180,stock:40}]},
{name:"Pears Gentle Soap",category:"Cosmetics",price:55,discount:5,stock:80,image:"pears.jpg",unit:"125g",variants:[{unit:"125g",price:55,stock:80},{unit:"3x125g",price:155,stock:40}]},
{name:"Dettol Original Soap",category:"Cosmetics",price:48,discount:5,stock:100,image:"dettol.jpg",unit:"125g",variants:[{unit:"75g",price:30,stock:100},{unit:"125g",price:48,stock:80}]},
{name:"Santoor Sandalwood Soap",category:"Cosmetics",price:38,discount:5,stock:80,image:"santoor.jpg",unit:"150g",variants:[{unit:"150g",price:38,stock:80},{unit:"4x150g",price:148,stock:40}]},
{name:"Head Shoulders Shampoo",category:"Cosmetics",price:175,discount:10,stock:50,image:"headshoulders.jpg",unit:"180ml",variants:[{unit:"72ml",price:70,stock:60},{unit:"180ml",price:175,stock:50},{unit:"340ml",price:320,stock:30}]},
{name:"Pantene Shampoo",category:"Cosmetics",price:165,discount:10,stock:50,image:"pantene.jpg",unit:"180ml",variants:[{unit:"72ml",price:65,stock:60},{unit:"180ml",price:165,stock:50}]},
{name:"Dove Shampoo",category:"Cosmetics",price:175,discount:10,stock:50,image:"doveshampoo.jpg",unit:"180ml",variants:[{unit:"80ml",price:80,stock:60},{unit:"180ml",price:175,stock:50},{unit:"340ml",price:320,stock:30}]},
{name:"Clinic Plus Shampoo",category:"Cosmetics",price:55,discount:5,stock:60,image:"clinicplus.jpg",unit:"175ml",variants:[{unit:"80ml",price:30,stock:80},{unit:"175ml",price:55,stock:60}]},
{name:"Colgate Toothpaste",category:"Cosmetics",price:55,discount:8,stock:80,image:"colgate.jpg",unit:"100g",variants:[{unit:"100g",price:55,stock:80},{unit:"200g",price:100,stock:60}]},
{name:"Dabur Red Toothpaste",category:"Cosmetics",price:80,discount:10,stock:60,image:"daburredp.jpg",unit:"200g",variants:[{unit:"100g",price:45,stock:80},{unit:"200g",price:80,stock:60}]},
{name:"Patanjali Dant Kanti",category:"Cosmetics",price:60,discount:10,stock:60,image:"dantkanti.jpg",unit:"150g",variants:[{unit:"100g",price:45,stock:80},{unit:"150g",price:60,stock:60}]},
{name:"Colgate Extra Clean Brush",category:"Cosmetics",price:35,discount:5,stock:80,image:"colgate1.jpg",unit:"1pc",variants:[{unit:"1pc",price:35,stock:80},{unit:"3pc",price:95,stock:40}]},
{name:"Parachute Coconut Oil",category:"Cosmetics",price:75,discount:8,stock:60,image:"hairoil.jpg",unit:"200ml",variants:[{unit:"100ml",price:45,stock:60},{unit:"200ml",price:75,stock:50},{unit:"500ml",price:170,stock:30}]},
{name:"Vaseline Body Lotion",category:"Cosmetics",price:120,discount:8,stock:50,image:"lotion.jpg",unit:"200ml",variants:[{unit:"100ml",price:70,stock:60},{unit:"200ml",price:120,stock:50},{unit:"400ml",price:210,stock:30}]},
{name:"Nivea Cream",category:"Cosmetics",price:110,discount:10,stock:50,image:"nivea.jpg",unit:"100ml",variants:[{unit:"50ml",price:60,stock:60},{unit:"100ml",price:110,stock:50}]},
{name:"Fair Lovely Cream",category:"Cosmetics",price:65,discount:0,stock:60,image:"fairlovely.jpg",unit:"50g",variants:[{unit:"25g",price:35,stock:60},{unit:"50g",price:65,stock:50}]},
{name:"Dettol Face Wash",category:"Cosmetics",price:120,discount:8,stock:50,image:"facewash.jpg",unit:"100ml",variants:[{unit:"50ml",price:65,stock:60},{unit:"100ml",price:120,stock:50}]},
{name:"Denver Deo Spray",category:"Cosmetics",price:180,discount:10,stock:40,image:"denver_deo.jpg",unit:"165ml",variants:[{unit:"165ml",price:180,stock:40}]},
{name:"Fogg Deo Spray",category:"Cosmetics",price:210,discount:10,stock:40,image:"fogg.jpg",unit:"150ml",variants:[{unit:"150ml",price:210,stock:40}]},
{name:"Wild Stone Deo",category:"Cosmetics",price:180,discount:8,stock:40,image:"wildstone.jpg",unit:"150ml",variants:[{unit:"150ml",price:180,stock:40}]},
{name:"Gillette Shaving Foam",category:"Cosmetics",price:175,discount:5,stock:40,image:"gillette.jpg",unit:"200g",variants:[{unit:"200g",price:175,stock:40}]},
// CLEANING
{name:"Harpic Toilet Cleaner",category:"Cleaning",price:110,discount:8,stock:50,image:"harpic.jpg",unit:"500ml",variants:[{unit:"200ml",price:50,stock:60},{unit:"500ml",price:110,stock:50},{unit:"1L",price:190,stock:30}]},
{name:"Colin Glass Cleaner",category:"Cleaning",price:110,discount:10,stock:50,image:"colin.jpg",unit:"500ml",variants:[{unit:"250ml",price:60,stock:60},{unit:"500ml",price:110,stock:50}]},
{name:"Lizol Floor Cleaner",category:"Cleaning",price:130,discount:8,stock:50,image:"lizol.jpg",unit:"500ml",variants:[{unit:"500ml",price:130,stock:50},{unit:"1L",price:230,stock:30}]},
{name:"Vim Dishwash Bar",category:"Cleaning",price:30,discount:5,stock:80,image:"vim.jpg",unit:"200g",variants:[{unit:"200g",price:30,stock:80},{unit:"400g",price:55,stock:60}]},
{name:"Pril Dishwash Gel",category:"Cleaning",price:80,discount:8,stock:60,image:"pril.jpg",unit:"250ml",variants:[{unit:"250ml",price:80,stock:60},{unit:"500ml",price:145,stock:40}]},
{name:"Surf Excel Easy Wash",category:"Cleaning",price:55,discount:8,stock:60,image:"surfexcel.jpg",unit:"500g",variants:[{unit:"500g",price:55,stock:60},{unit:"1kg",price:105,stock:40},{unit:"2kg",price:200,stock:20}]},
{name:"Ariel Detergent Powder",category:"Cleaning",price:115,discount:10,stock:50,image:"ariel.jpg",unit:"1kg",variants:[{unit:"500g",price:65,stock:60},{unit:"1kg",price:115,stock:50}]},
{name:"Rin Detergent Powder",category:"Cleaning",price:58,discount:8,stock:60,image:"rin.jpg",unit:"500g",variants:[{unit:"500g",price:58,stock:60},{unit:"1kg",price:110,stock:40}]},
{name:"Tide Detergent Powder",category:"Cleaning",price:55,discount:8,stock:60,image:"tide.jpg",unit:"500g",variants:[{unit:"500g",price:55,stock:60},{unit:"1kg",price:105,stock:40}]},
{name:"Comfort Fabric Softener",category:"Cleaning",price:80,discount:5,stock:50,image:"comfort.jpg",unit:"220ml",variants:[{unit:"220ml",price:80,stock:50},{unit:"840ml",price:270,stock:30}]},
{name:"Dettol Handwash",category:"Cleaning",price:70,discount:8,stock:60,image:"handwash.jpg",unit:"200ml",variants:[{unit:"200ml",price:70,stock:60},{unit:"500ml",price:145,stock:40}]},
{name:"Lifebuoy Handwash",category:"Cleaning",price:65,discount:5,stock:60,image:"handwash.jpg",unit:"200ml",variants:[{unit:"200ml",price:65,stock:60},{unit:"500ml",price:130,stock:40}]},
{name:"Godrej Aer Room Freshener",category:"Cleaning",price:90,discount:8,stock:50,image:"freshener.jpg",unit:"300ml",variants:[{unit:"300ml",price:90,stock:50}]},
{name:"Mortein Mosquito Spray",category:"Cleaning",price:175,discount:8,stock:40,image:"mortein.jpg",unit:"425ml",variants:[{unit:"425ml",price:175,stock:40}]},
{name:"Good Knight Mosquito Coil",category:"Cleaning",price:45,discount:5,stock:60,image:"goodknight.jpg",unit:"10pc",variants:[{unit:"10pc",price:45,stock:60}]},
// DRY FRUITS
{name:"Happilo Cashews",category:"Dry Fruits",price:195,discount:10,stock:40,image:"cashew.jpg",unit:"200g",variants:[{unit:"100g",price:110,stock:50},{unit:"200g",price:195,stock:40}]},
{name:"Happilo Almonds",category:"Dry Fruits",price:175,discount:10,stock:40,image:"almond.jpg",unit:"200g",variants:[{unit:"100g",price:100,stock:50},{unit:"200g",price:175,stock:40}]},
{name:"Everest Raisins",category:"Dry Fruits",price:90,discount:8,stock:50,image:"raisin.jpg",unit:"200g",variants:[{unit:"100g",price:50,stock:60},{unit:"200g",price:90,stock:50}]},
{name:"Miltop Walnuts",category:"Dry Fruits",price:180,discount:10,stock:30,image:"walnut.jpg",unit:"200g",variants:[{unit:"100g",price:100,stock:40},{unit:"200g",price:180,stock:30}]},
{name:"Tulsi Pistachios",category:"Dry Fruits",price:220,discount:10,stock:30,image:"pista.jpg",unit:"200g",variants:[{unit:"100g",price:120,stock:40},{unit:"200g",price:220,stock:30}]},
{name:"Dates Mejdool",category:"Dry Fruits",price:150,discount:5,stock:40,image:"dates.jpg",unit:"250g",variants:[{unit:"250g",price:150,stock:40},{unit:"500g",price:280,stock:20}]},
];

async function run() {
    const client = new MongoClient(process.env.MONGO_URI, { tls: true, tlsInsecure: true, serverSelectionTimeoutMS: 15000 });
    await client.connect();
    const db = client.db("mini-mrt");

    // Remove old test products (keep existing real ones)
    const removeNames = [
        "Dettol Original Soap","Lux Soft Touch Soap","Lifebuoy Total Soap",
        "Dove Cream Beauty Soap","Pears Pure & Gentle Soap","Santoor Sandalwood Soap",
        "Savlon Moisturizing Soap","Cinthol Fresh Soap","Fortune Oil","Fortune Saffola Oil 1L",
        "Aashirvaad Atta 5kg","Amul Butter 500g","Amul Milk 1L","Amul Curd 400g",
        "Coca Cola 750ml","Frooti 200ml","Maaza 600ml","Nescafe Coffee 50g",
        "Colgate Toothpaste 200g","Dettol Soap 125g","Dove Face Wash 100ml",
        "Fair & Lovely Cream 50g","Denver Deo 165ml","Parachute Hair Oil 200ml",
        "Vaseline Lotion 200ml","Lifebuoy Handwash 250ml","Colin Glass Cleaner 500ml",
        "Harpic Toilet Cleaner 500ml","Floor Cleaner 1L","Jo Soap 150g","Lays Classic 26g",
        "Kurkure 45g","Cadbury Chocolate","Kissan Ketchup 500g","Amul Butter 500g"
    ];

    const del = await db.collection("products").deleteMany({ name: { $in: removeNames } });
    console.log("Removed old:", del.deletedCount);

    // Add all new products
    const withDate = products.map(p => ({ ...p, createdAt: new Date() }));
    const result = await db.collection("products").insertMany(withDate);
    console.log("Added:", result.insertedCount, "products");

    const total = await db.collection("products").countDocuments();
    console.log("Total in DB:", total);

    await client.close();
    process.exit(0);
}

run().catch(e => { console.log("ERROR:", e.message); process.exit(1); });
