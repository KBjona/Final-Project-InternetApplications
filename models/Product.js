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

module.exports = {UpdateStoreParameters, GetStoreParameters, GetStoreOwner, findAllProducts, searchProductsGrouped};
