const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

// Looks for the cart with this exact mail 
function findCartByMail(user_mail) {
  return getDb().collection('carts').findOne({ mail: user_mail });
}

function DeleteItemsByMail(user_mail) {
  return getDb().collection('carts').updateOne({ mail: user_mail }, { $set: { items: [] } });
}

function UpdateItemsByMail(user_mail, new_items) {
  return getDb().collection('carts').updateOne({ mail: user_mail }, { $set: { items: new_items } }, { upsert: true });
}

async function IncrementCartItem(user_mail, p_id, p_name, p_price) {
  const result = await getDb().collection('carts').updateOne({ mail: user_mail, "items._id": p_id }, { $inc: {"items.$.quantity": 1} });
  if(result.matchedCount === 0){
    return await getDb().collection('carts').updateOne({ mail: user_mail }, { $push: { items: {
      _id: p_id,
      name: p_name,
      price: p_price,
      quantity: 1
    } } }, { upsert: true });
  }
  return result
}


module.exports = { findCartByMail, DeleteItemsByMail, UpdateItemsByMail, IncrementCartItem };

/*

{
  "mail": "Jona10112010@gmail.com",
  "items": [
    {
      "name": "Wireless Mouse",
      "cost": 25.99,
      "quantity": 1
    },
    {
      "name": "Mechanical Keyboard",
      "cost": 89.5,
      "quantity": 2
    },
    {
      "name": "USB-C Cable",
      "cost": 12,
      "quantity": 3
    }
  ]
}

*/