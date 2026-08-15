const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

function UpdateStoreParameters(id,params){
    return getDb().collection('products').updateOne({_id: id},{ $set: { parameters: params }});
}

function GetStoreParameters(id){
    return getDb().collection('products').findOne({_id: id},{parameters: 1, _id: 0});
}

function GetStoreOwner(id){
    return getDb().collection('products').findOne({_id: id},{owner: 1, _id: 0});
}

module.exports = {UpdateStoreParameters, GetStoreParameters, GetStoreOwner};
