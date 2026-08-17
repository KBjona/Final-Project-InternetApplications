const { ObjectId } = require('mongodb');
const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

function UpdateStoreParameters(id,params){
    return getDb().collection('products').updateOne({_id: new ObjectId(id)},{ $set: { parameters: params }});
}

function GetStoreParameters(id){
    return getDb().collection('products').findOne({_id: new ObjectId(id)},{parameters: 1, _id: 0});
}

function GetStoreOwner(id){
    return getDb().collection('products').findOne({_id: new ObjectId(id)},{owner: 1, _id: 0});
}

function findAllProducts() {
    return getDb().collection('products').find({}).toArray(); // returns all the products
}

module.exports = {UpdateStoreParameters, GetStoreParameters, GetStoreOwner, findAllProducts};
