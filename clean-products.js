require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Images that actually exist in /images folder
const existingImages = [
    "aashirvaad_aata.jpg","butter.jpg","chocolate.jpg","coffee.jpg","coke.jpg",
    "colgate.jpg","colgate1.jpg","colin.jpg","curd.jpg","dantkanti.jpg",
    "denver_deo.jpg","dettol.jpg","facewash.jpg","fair_lovely.jpg","floorcleaner.jpg",
    "frooti.jpg","hairoil.jpg","handwash.jpg","harpic.jpg","jo_soap.jpg",
    "kisaan.jpg","krackjack.jpg","kurkure.jpg","lays.jpg","limca.jpg",
    "lotion.jpg","maaza.jpg","milk.jpg","monaco.jpg","moongdal.jpg",
    "mountaindew.jpg","mr_white_surf.jpg","namkeen.jpg","oil.jpg","parle1kg.jpg",
    "pepsi.jpg","perfume.jpg","phenyl.jpg","ponds_lotion.jpg","popcorn.jpg",
    "realjuice.jpg","rice.jpg","salt.jpg","shampoo.jpg","soap.jpg","Soya.jpg",
    "sprite.jpg","suger.jpg","surf.jpg","taaza.jpg","tea.jpg","thumsup.jpg",
    "Tide.jpg","toothpaste.jpg","turdal.jpg","wheat.jpg","wildstone.jpg",
    "appyfizz.jpg","doburredp.jpg","gooddaycashew.jpd"
];

// Also map old filenames to new clean names
const imageMap = {
    "doburredp.jpg":   "daburredp.jpg",  // fix typo
    "gooddaycashew.jpd":"goodday.jpg",   // fix extension
    "suger.jpg":       "sugar.jpg",
    "turdal.jpg":      "toor.jpg",
    "moongdal.jpg":    "moong.jpg",
    "wheat.jpg":       "atta.jpg",
    "Soya.jpg":        "soya.jpg",
    "Tide.jpg":        "tide.jpg",
    "mr_white_surf.jpg":"surfexcel.jpg",
    "ponds_lotion.jpg":"lotion2.jpg",
    "jo_soap.jpg":     "josoap.jpg",
    "floorcleaner.jpg":"lizol.jpg",
    "surf.jpg":        "ariel.jpg",
    "toothpaste.jpg":  "oralb.jpg",
    "soap.jpg":        "santoor.jpg",
    "shampoo.jpg":     "clinicplus.jpg",
    "fair_lovely.jpg": "fairlovely.jpg",
    "taaza.jpg":       "amultaaza.jpg"
};

async function run() {
    const client = new MongoClient(process.env.MONGO_URI, {
        tls: true, tlsInsecure: true, serverSelectionTimeoutMS: 15000
    });
    await client.connect();
    const db = client.db("mini-mrt");

    // Get all products
    const all = await db.collection("products").find().toArray();
    console.log("Total before:", all.length);

    // Products to keep — image exists OR category is Cosmetics
    const toKeep = [];
    const toDelete = [];

    all.forEach(p => {
        const imgExists = existingImages.includes(p.image) || existingImages.includes(p.image.toLowerCase());
        if (imgExists || p.category === "Cosmetics") {
            // Fix image name if needed
            if (imageMap[p.image]) {
                toKeep.push({ id: p._id, newImg: imageMap[p.image], name: p.name });
            }
            // Keep
        } else {
            toDelete.push(p._id);
            console.log("DELETE:", p.name, "| img:", p.image);
        }
    });

    // Delete products without images (except Cosmetics)
    if (toDelete.length) {
        const del = await db.collection("products").deleteMany({ _id: { $in: toDelete } });
        console.log("Deleted:", del.deletedCount);
    }

    const total = await db.collection("products").countDocuments();
    console.log("Remaining:", total);
    await client.close();
    process.exit(0);
}
run().catch(e => { console.log("ERROR:", e.message); process.exit(1); });
