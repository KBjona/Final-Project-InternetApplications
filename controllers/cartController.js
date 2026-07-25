const Cart = require('../models/Cart');
const User = require('../models/User');

exports.load_items = async (req, res) => {
    let { mail } = req.body;// get the email from the request's body
    if (!mail) {//if there is no email
        return res.status(400).json({ message: 'Email cannot be empty' });
    }

    try {
        const cart = await Cart.findCartByMail(mail); // finding thhe cart to load
        if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) { // in case the cart is empty
            return res.status(200).json({ message: 'Empty Cart', items: [] });
        }
        res.status(200).json({ message: 'Cart with items', items: cart.items }); // cart worked successfully
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.delete_items = async (req, res) => {
    let { mail } = req.body;// get the email from the request's body
    if (!mail) { //if there is no email
        return res.status(400).json({ message: 'Email cannot be empty' });
    }
    try {
        const result = Cart.DeleteItemsByMail(mail);
        if (result.matchedCount === 0) { //no user was found with that mail
            return res.status(200).json({ message: 'No user found with that email address'});
        } else if (result.modifiedCount === 0) {//the items field was already empty
            return res.status(200).json({ message: 'User found, but the the items array was already empty'});
        }
        res.status(200).json({ message: 'Cart emptied successfully'});
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.update_items_quantities = async (req, res) => {
    let { mail, items } = req.body; // get the email and items from the request's body
    if (!mail) { //if there is no email
        return res.status(400).json({ message: 'Email cannot be empty' });
    }
    if (!items && items != []) { //if there is null/ nonexistent items ([] is okay)
        return res.status(400).json({ message: 'items have to exist' });
    }
    try {
        const result = Cart.UpdateItemsByMail(mail,items);
        if (result.matchedCount === 0) { //no user was found with that mail
            return res.status(400).json({ message: 'No user found with that email address'});
        } else if (result.modifiedCount === 0) {//the items field we found was already like after the update
            return res.status(200).json({ message: 'User found, but the items field was already the same as we entered'});
        }
        res.status(200).json({ message: 'Cart changed successfully'});
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.get_sccn = async (req, res) => {
    let { mail } = req.body;// get the email from the request's body
    if (!mail) { //if there is no email
        return res.status(400).json({ message: 'Email cannot be empty' });
    }

    try {
        const user = await User.findByMail(mail);
        if (!user) { // if no user was found
            return res.status(400).json({ message: 'No user with this mail'});
        }
        if (!user.sccn) { // if the user has no saved cc
            return res.status(400).json({ message: 'No stored credit card'});
        }
        res.status(200).json({ message: 'Cart with items', sccn: user.sccn });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.update_sccn = async (req, res) => {
    let { mail, new_sccn } = req.body; // get the mail and items from the request's body
    if (!mail) { //if there is no mail
        return res.status(400).json({ message: 'Email cannot be empty' });
    }
    if (!new_sccn || new_sccn == '') { //if there isn't a vaild cc
        return res.status(400).json({ message: 'items have to exist' });
    }
    try {
        const result = User.UpdateCCByMail(mail,new_sccn);
        if (result.matchedCount === 0) { // didn't find user with that email
            return res.status(400).json({ message: 'No user found with that email address'});
        } else if (result.modifiedCount === 0) {//the sccn field we found was already like after the update
            return res.status(200).json({ message: 'User found, but the sccn field was already the same as we entered'});
        }
        res.status(200).json({ message: 'SCCN changed successfully'});
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}