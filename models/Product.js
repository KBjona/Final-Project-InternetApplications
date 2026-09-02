const { ObjectId } = require('mongodb');
const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

function CreateStoreParameters(store_owner,params,img, vid){
    return getDb().collection('products').insertOne({
        owner: store_owner,
        parameters: params,
        productImage: img,
        productVideo: vid || null,
        sum_ratings: 5,
        num_ratings: 1
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
    return getDb().collection('products').find({},{parameters: 1,productImage: 1, _id: 1}).toArray(); // returns all the products
}

function AddReview(id, rating) {
    return getDb().collection('products').updateOne({_id: new ObjectId(id)}, {$inc: { sum_ratings: rating, num_ratings: 1 }}, {upsert: true}); // adds a review to the product
}


async function searchProductsGrouped({ 
  query = '', 
  maxPrice = 1000, 
  minDiscount = 0, 
  minStars = 0, 
  weatherCondition = null, 
  seasons = [], 
  mineOnly = false,
  followersOnly = false,
  userMail = '',
  following = [] } = {}) { // get all the requirements/info

  const cleanQuery = query ? String(query).trim() : ''; // cleaning the query
  const matchConditions = []; // creating iflters

  if (mineOnly && userMail) { // owenr filter 
    matchConditions.push({ owner: userMail });
  } else if (followersOnly) {
    const followingList = Array.isArray(following) 
      ? following 
      : (typeof following === 'string' && following ? following.split(',') : []); // check to see if its in your following array if so add
      
    matchConditions.push({ owner: { $in: followingList } }); // show only if in the following
  }

  // text Search (only apply if query is not empty)
  if (cleanQuery) {
    matchConditions.push({
      $or: [
        { name: { $regex: cleanQuery, $options: 'i' } },
        { 'parameters.product-name': { $regex: cleanQuery, $options: 'i' } }, // check if in the name
        { 'parameters.product-description': { $regex: cleanQuery, $options: 'i' } }, // check if in the description
        { 'ownerDetails.fname' : { $regex: cleanQuery , $options: 'i'}} // check if searching for owenr instead of product
      ]
    });
  }

  //max Price Filter
  if (maxPrice) {
    matchConditions.push({
      $expr: {
        $lte: [{ $toDouble: { $ifNull: ['$parameters.product-price', 0] } }, Number(maxPrice)] // lte - lower than or equal, filters by that
      }
    });
  }

  //min Discount Filter 
  if (Number(minDiscount) > 0) {
    matchConditions.push({
      $expr: {
        $gte: [{ $toDouble: { $ifNull: ['$parameters.product-discount', 0] } }, Number(minDiscount)] // gte - greater than or equal, filters by that
      }
    });
  }
 // minimum starts filter
if (Number(minStars) > 0) {
   matchConditions.push({
     $expr:
      { $gte: [{ $cond: [{ $gt: [{ $toDouble: { $ifNull: ['$num_ratings', 0] } }, 0] }, { $divide: [{ $toDouble: { $ifNull: ['$sum_ratings', 0] } }, { $toDouble: { $ifNull:    ['$num_ratings', 0] } }] }, 0] }, Number(minStars)] }  // calculates the product avergae rating using sumratings/numbratings then filters by that
     });
   }

  if (seasons.length > 0) { // check if filtering for seasons
    matchConditions.push({
      $or: seasons.map(season => ({ // if yes check wheatehr it is in the product
        'parameters.product-weather': { $regex: season, $options: 'i' }
      }))
    });
  }

  const pipeline = [{ // build the db pipeline to search and organize products.
      $lookup: { // get/search owner user info
        from: 'users',
        localField: 'owner',
        foreignField: 'mail',
        as: 'ownerDetails'
      }
    },
    {
      $unwind: { // conver the owner info user obj
        path: '$ownerDetails',
        preserveNullAndEmptyArrays: true
      }
    }];

  if (matchConditions.length > 0) { // apply the filters to all products
    pipeline.push({ $match: { $and: matchConditions } });
  }

  pipeline.push({
    $group: { // group products in accordance to their owenr for easier viewing.
      _id: '$owner', // use the owners email as the group id
      items: { $push: '$$ROOT' }
    }
  });

  return await getDb().collection('products').aggregate(pipeline).toArray(); // finish running through the piepline and return the grouped products
}

async function CompletePurchase(items_purchased){ 
  const items_promises = items_purchased.map((item) => { 
    return getDb().collection('products').findOneAndUpdate(
      {_id: new ObjectId(item._id),  "parameters.product-stock" : {$gte: item.quantity} }, // filters the items by quanitity 
      { $inc : { "parameters.product-stock": -(item.quantity) }}, // what to increment
      { returnDocument: "after", projection: {_id: 1}} // what to reutrn
    )
  });

  const result = await Promise.allSettled(items_promises);
  return result;
}

module.exports = {UpdateStoreParameters, UpdateStoreImage, UpdateStoreVideo, DeleteStore, GetStoreParameters, GetStoreOwner, findAllProducts, CreateStoreParameters, searchProductsGrouped, AddReview, CompletePurchase};
