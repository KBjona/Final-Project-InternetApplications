const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

// Looks for one user with this exact username (username = email).
function findByUsername(username) {
    return getDb().collection('users').findOne({ username });
}

// Saves a brand new user document into the "users" collection.
function createUser(userData) {
    console.log("Added user to collection");
    return getDb().collection('users').insertOne(userData);
}

module.exports = { findByUsername, createUser };