const Cart = require('../models/Cart');

exports.load_items = async (req, res) => {
    let {mail} = req.body;
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    let _mail = req.session.user.mail;

    try {
        const cart = await Cart.findCartByMail(mail);
        if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
            return res.status(200).json({ message: 'Empty Cart', items: [] });
        }
        res.status(200).json({ message: 'Cart with items', items: cart.items });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.delete_items = async (req, res) => {
    let {mail} = req.body;
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    let _mail = req.session.user.mail;
    try {
        const result = await Cart.DeleteItemsByMail(mail);
        if (result.matchedCount === 0) { //user had no cart
            return res.status(200).json({ message: 'No user found with that email address' });
        } else if (result.modifiedCount === 0) {//the items field didn't exist or was already deleted
            return res.status(200).json({ message: 'User found, but the field did not exist or was already removed' });
        }
        res.status(200).json({ message: 'Cart emptied successfully' });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.update_items_quantities = async (req, res) => {
    let { items } = req.body; // get the email and items from the request's body
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    if (!items && items != []) { //if there is no email or null/ nonexistent items ([] is okay)
        return res.status(400).json({ message: 'items has to exist' });
    }
    let mail = req.session.user.mail;
    try {
        items = items.filter(item => item.quantity > 0);
        const result = await Cart.UpdateItemsByMail(mail, items);
        if (result.matchedCount === 0) { //user had no cart
            return res.status(400).json({ message: 'No user found with that email address' });
        } else if (result.modifiedCount === 0) {//the items field didn't exist or was already deleted
            return res.status(200).json({ message: 'User found, but the field did not exist or was already removed' });
        }
        res.status(200).json({ message: 'Cart changed successfully' });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.add_item_to_cart = async (req, res) => {
    let { _id, name, price } = req.body; // get the email and items from the request's body
    if (!_id || !name || !price) { //if there is no email or no name or no price
        return res.status(400).json({ message: 'Email/name/price cannot be empty' });
    }
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    let mail = req.session.user.mail;

    try {
        const result = await Cart.IncrementCartItem(mail, _id, name,price);
        res.status(200).json({ message: 'Cart changed successfully' });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}