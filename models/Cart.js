const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

// Looks for the cart with this exact mail 
function findCartByMail(user_mail) {
  return getDb().collection('carts').findOne({ mail: user_mail });
}

function DeleteItemsByMail(user_mail) {
  return getDb().collection('carts').deleteOne({mail: user_mail});
}

function UpdateItemsByMail(user_mail, new_items) {
  return getDb().collection('carts').updateOne({ mail: user_mail }, { $set: { items: new_items } }, { upsert: true });
}

async function IncrementCartItem(user_mail, p_id, p_name, p_cost) {
  const result = await getDb().collection('carts').updateOne({ mail: user_mail, "items._id": p_id }, { $inc: {"items.$.quantity": 1} });
  if(result.matchedCount === 0){
    return await getDb().collection('carts').updateOne({ mail: user_mail }, { $push: { items: {
      _id: p_id,
      name: p_name,
      cost: p_cost,
      quantity: 1
    } } }, { upsert: true });
  }
  return result
}

async function searchCartItems(user_mail, query) {
  const result = await getDb().collection('carts').aggregate([
    { $match: { mail: user_mail } },
    { $unwind: '$items' },
    { $match: { 'items.name': { $regex: query, $options: 'i' } } },
    { $group: { _id: '$_id', items: { $push: '$items' } } }
  ]).toArray();
  console.log("arraydbsearchwhatever");
  return result.length > 0 ? result[0].items : [];
}



module.exports = { findCartByMail, DeleteItemsByMail, UpdateItemsByMail, IncrementCartItem, searchCartItems };

