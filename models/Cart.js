const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

// Looks for the cart with this exact mail 
function findCartByMail(user_mail) {
    return getDb().collection('carts').findOne({ mail: user_mail });
}

function DeleteItemsByMail(user_mail){
    return getDb().collection('carts').updateOne({mail: user_mail},{ $set: { items: [] }});
}

module.exports = { findCartByMail, DeleteItemsByMail };

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