// models/db.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Bypasses local DNS SRV blocking

const { MongoClient, ServerApiVersion } = require('mongodb');
let dbInstance = null;

async function connectDB() {
    if (dbInstance) return dbInstance;
    
    // Read URI when connectDB is called
    const uri = process.env.MONGO_URI;

   // if the uri isnt defined
    if (!uri) {
      throw new Error("FATAL: MONGO_URI is not defined in your environment variables / .env file!");
    }

    const client = new MongoClient(uri, { //setting the mongo client
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    dbInstance = client.db("nozama"); // Connects to your database
    return dbInstance;
}

function getDb() { 
    if (!dbInstance) { //if we didnt call the connectDB function
        throw new Error("Database not initialized! Call connectDB first.");
    }
    return dbInstance;
}

module.exports = { connectDB, getDb };