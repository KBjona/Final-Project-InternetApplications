const { ObjectId } = require('mongodb');
const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

function CreateStoreParameters(store_owner,params,img, vid){
    return getDb().collection('products').insertOne({
        owner: store_owner,
        parameters: params,
        productImage: img,
        productVideo: vid || null
    });
}

function UpdateStoreParameters(id,params){
    return getDb().collection('products').updateOne({_id: new ObjectId(id)},{ $set: { parameters: params }}); //updates the store parameters
}

function UpdateStoreImage(id,img){
    return getDb().collection('products').updateOne({_id: new ObjectId(id)},{ $set: { productImage: img }}); //updates the store image
}

function UpdateStoreVideo(id,vid){
    return getDb().collection('products').updateOne({_id: new ObjectId(id)},{ $set: { productVideo: vid }}); //updates the store video
}

function GetStoreParameters(id,img=0,vid=0,rating=0){
    return getDb().collection('products').findOne({_id: new ObjectId(id)},{parameters: 1, productImage: img, productVideo: vid, sum_rating: rating, num_ratings: rating, _id: 0}); //gets the store parameters
}

function GetStoreOwner(id){
    return getDb().collection('products').findOne({_id: new ObjectId(id)},{owner: 1, _id: 0}); //gets the store owner
}

function findAllProducts() {
    return getDb().collection('products').find({},{parameters: 1,productImage: 1, _id: 0}).toArray(); // returns all the products
}

function AddReview(id, rating) {
    return getDb().collection('products').updateOne({_id: new ObjectId(id)}, {$inc: { sum_rating: rating, num_ratings: 1 }}, {upsert: true}); // adds a review to the product
}

module.exports = {CreateStoreParameters, UpdateStoreParameters, UpdateStoreImage, UpdateStoreVideo, GetStoreParameters, GetStoreOwner, findAllProducts, AddReview};
