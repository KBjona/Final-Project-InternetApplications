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

async function searchProductsGrouped(query) {
  const cleanQuery = query ? query.trim() : '';
  
  if (!cleanQuery) return await getDb().collection('products').aggregate([{ $group: { _id: '$owner', items: { $push: '$$ROOT' } } }]).toArray();

    const pipeline = [
    {
      $match: {
        $or: [
          { name: { $regex: cleanQuery, $options: 'i' } },
          { 'parameters.product-name': { $regex: cleanQuery, $options: 'i' } },
          { 'parameters.product-description': { $regex: cleanQuery, $options: 'i'}}]}
    },
    {
      $group: {
        _id: '$owner',
        items: { $push: '$$ROOT' }
      }}];

  return await getDb().collection('products').aggregate(pipeline).toArray();
}

module.exports = {UpdateStoreParameters, GetStoreParameters, GetStoreOwner, findAllProducts, searchProductsGrouped};
