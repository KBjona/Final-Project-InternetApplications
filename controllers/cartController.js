const Cart = require('../models/Cart');

exports.load_items = async (req,res) => {
    let { mail } = req.body;
    if( !mail ){
        return res.status(400).json({ message: 'Email cannot be empty' });
    }

    try{
        const cart = await Cart.findCartBymail(mail);
        if(!cart || !Array.isArray(cart.items) || cart.items.length === 0){
            return res.status(200).json({ message: 'Empty Cart'});
        }
        res.status(200).json({ message: cart.items });
    } catch (err) { // database error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the database' });
    }
}