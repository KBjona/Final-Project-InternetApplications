const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

// Looks for the cart with this exact mail 
function findCartBymail(mail) {
    return getDb().collection('carts').findOne({ mail });
}



module.exports = { findCartBymail };