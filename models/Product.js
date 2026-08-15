const { getDb } = require('./db');

// Fetches all product documents from the 'products' collection
function findAllProducts() {
    return getDb().collection('products').find({}).toArray(); // returns all the products
}

module.exports = { findAllProducts };