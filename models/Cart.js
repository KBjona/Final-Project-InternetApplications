const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

// Looks for the cart with this exact mail 
function findCartByMail(user_mail) {
  return getDb().collection('carts').findOne({ mail: user_mail });
}

function DeleteItemsByMail(user_mail) {
  return getDb().collection('carts').deleteOne({mail: user_mail}); // delete items for a given mail
}

function UpdateItemsByMail(user_mail, new_items) {
  return getDb().collection('carts').updateOne({ mail: user_mail }, { $set: { items: new_items } }, { upsert: true }); //
}

async function IncrementCartItem(user_mail, p_id, p_name, p_cost) {
  const result = await getDb().collection('carts').updateOne({ mail: user_mail, "items._id": p_id }, { $inc: {"items.$.quantity": 1} });
  if(result.matchedCount === 0){
    return await getDb().collection('carts').updateOne({ mail: user_mail }, { $push: { items: {
      _id: p_id,
      name: p_name,
      price: p_cost,
      quantity: 1
    } } }, { upsert: true });
  }
  return result
}

async function searchCartItems(user_mail, filters = {}) {
const { query, maxPrice, maxQuantity, maxLength } = filters;

  const itemMatch = {};

  if (query) {
    itemMatch['items.name'] = { $regex: query, $options: 'i' }; // serach name
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    itemMatch['items.price'] = { $lte: Number(maxPrice) }; // search price
  }

  if (maxQuantity !== undefined && maxQuantity !== '') {
    itemMatch['items.quantity'] = { $lte: Number(maxQuantity) }; // serach quanitiy
  }

  if (maxLength !== undefined && maxLength !== '') {
    itemMatch['$expr'] = { $lte: [{ $strLenCP: '$items.name' }, Number(maxLength)] }; // compare str len to max len to see if it fits
  }

  const pipeline = [
    { $match: { mail: user_mail } },
    { $unwind: '$items' }
  ];

  if (Object.keys(itemMatch).length > 0) {
    pipeline.push({ $match: itemMatch });
  }

  pipeline.push({
    $group: { _id: '$_id', items: { $push: '$items' } }
  });

  const result = await getDb().collection('carts').aggregate(pipeline).toArray();

  return result.length > 0 ? result[0].items : [];
}



module.exports = { findCartByMail, DeleteItemsByMail, UpdateItemsByMail, IncrementCartItem, searchCartItems };

