const Cart = require('../models/Cart');

exports.load_items = async (req, res) => {
    let { mail } = req.body;
    if (!mail) {
        return res.status(400).json({ message: 'Email cannot be empty' });
    }

    try {
        const cart = await Cart.findCartByMail(mail);
        if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
            return res.status(200).json({ message: 'Empty Cart', items: [] });
        }
        res.status(200).json({ message: 'Cart with items', items: cart.items });
    } catch (err) { // database error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the database' });
    }
}

exports.delete_items = async (req, res) => {
    let { mail } = req.body;
    if (!mail) {
        return res.status(400).json({ message: 'Email cannot be empty' });
    }
    try {
        const result = Cart.DeleteItemsByMail(mail);
        if (result.matchedCount === 0) { //user had no cart
            return res.status(200).json({ message: 'No user found with that email address'});
        } else if (result.modifiedCount === 0) {//the items field didn't exist or was already deleted
            return res.status(200).json({ message: 'User found, but the field did not exist or was already removed'});
        }
        res.status(200).json({ message: 'Cart emptied successfully'});
    } catch (err) { // database error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the database' });
    }
}