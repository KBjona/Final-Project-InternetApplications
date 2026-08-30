const { ObjectId } = require('mongodb');
const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

function CreateStoreParameters(store_owner,params,img, vid){
    return getDb().collection('products').insertOne({
        owner: store_owner,
        parameters: params,
        productImage: img,
        productVideo: vid || null,
        numVisitor: 0
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

function DeleteStore(id){
    return getDb().collection('products').deleteOne({_id: new ObjectId(id)}); //updates the store image
}

function GetStoreParameters(id,img=0,vid=0,own=0){
    return getDb().collection('products').findOne({_id: new ObjectId(id)},{parameters: 1, productImage: img, productVideo: vid, sum_ratings: 1, num_ratings: 1, owner: own, _id: 0}); //gets the store parameters
}

function GetStoreOwner(id){
    return getDb().collection('products').findOne({_id: new ObjectId(id)},{owner: 1, _id: 0}); //gets the store owner
}

function findAllProducts() {
    return getDb().collection('products').find({},{parameters: 1,productImage: 1, _id: 0}).toArray(); // returns all the products
}

function AddReview(id, rating) {
    return getDb().collection('products').updateOne({_id: new ObjectId(id)}, {$inc: { sum_ratings: rating, num_ratings: 1 }}, {upsert: true}); // adds a review to the product
}

async function searchProductsGrouped({ query = '', maxPrice = 1000, minDiscount = 0, minStars = 0 } = {}) {
  const cleanQuery = query ? String(query).trim() : '';
  const matchConditions = [];

  // 1. Text Search (only apply if query is not empty)
  if (cleanQuery) {
    matchConditions.push({
      $or: [
        { name: { $regex: cleanQuery, $options: 'i' } },
        { 'parameters.product-name': { $regex: cleanQuery, $options: 'i' } },
        { 'parameters.product-description': { $regex: cleanQuery, $options: 'i' } }
      ]
    });
  }

  // 2. Max Price Filter
  if (maxPrice) {
    matchConditions.push({
      $expr: {
        $lte: [{ $toDouble: { $ifNull: ['$parameters.product-price', 0] } }, Number(maxPrice)] // lte - lower than or equal
      }
    });
  }

  // 3. Min Discount Filter (only apply if minDiscount > 0)
  if (Number(minDiscount) > 0) {
    matchConditions.push({
      $expr: {
        $gte: [{ $toDouble: { $ifNull: ['$parameters.product-discount', 0] } }, Number(minDiscount)] // gte - greater than or equal
      }
    });
  }

  if (Number(minStars) > 0) {
    matchConditions.push({
      $expr: {
        $gte: [{ $toDouble: { $ifNull: ['$parameters.product-rating', 0] } }, Number(minStars)] // gte - greate than or equal
      }
    });
  }

  const pipeline = [];

  if (matchConditions.length > 0) {
    pipeline.push({ $match: { $and: matchConditions } });
  }

  pipeline.push({
    $group: {
      _id: '$owner',
      items: { $push: '$$ROOT' }
    }
  });

  return await getDb().collection('products').aggregate(pipeline).toArray();
}

async function CompletePurchase(items_purchased){
  const items_promises = items_purchased.map((item) => {
    return getDb().collection('products').findOneAndUpdate(
      {_id: new ObjectId(item._id),  "parameters.product-stock" : {$gte: item.quantity} },
      { $inc : { "parameters.product-stock": -(item.quantity) }},
      { returnDocument: "after", projection: {_id: 1}}
    )
  });

  const result = await Promise.allSettled(items_promises);
  return result;
}

module.exports = {UpdateStoreParameters, UpdateStoreImage, UpdateStoreVideo, DeleteStore, GetStoreParameters, GetStoreOwner, findAllProducts, CreateStoreParameters, searchProductsGrouped, AddReview, CompletePurchase};