// models/db.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Bypasses local DNS SRV blocking

const { MongoClient, ServerApiVersion } = require('mongodb');
// ... rest of your db.js code ...
let dbInstance = null;

async function connectDB() {
    if (dbInstance) return dbInstance;
    
    // Read URI when connectDB is called
    const uri = process.env.MONGO_URI;

    // Security check: Fail fast inside connectDB
    if (!uri) {
      throw new Error("FATAL: MONGO_URI is not defined in your environment variables / .env file!");
    }

    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    dbInstance = client.db("nozama"); // Connects to your database
    console.log("Successfully connected to MongoDB Atlas!");
    return dbInstance;
}

function getDb() {
    if (!dbInstance) {
        throw new Error("Database not initialized! Call connectDB first.");
    }
    return dbInstance;
}

module.exports = { connectDB, getDb };