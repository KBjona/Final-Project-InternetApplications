const Cart = require('../models/Cart');
const User = require('../models/User');

exports.load_items = async (req, res) => {
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    let mail = req.session.user.mail;
    let searchQuery = req.query.search;

    try {
        if(searchQuery){
            const items = await Cart.searchCartItems(mail, searchQuery);
            return res.status(200).json({message: 'Empty Cart', items});
        }


        const cart = await Cart.findCartByMail(mail); // finding thhe cart to load
        if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) { // in case the cart is empty or doesnt exist
            return res.status(200).json({ message: 'Empty Cart', items: [] });
        }
        res.status(200).json({ message: 'Cart with items', items: cart.items }); // cart worked successfully
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.delete_items = async (req, res) => {
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    let mail = req.session.user.mail;
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

exports.get_sccn = async (req, res) => {
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    let mail = req.session.user.mail;

    try {
        const user = await User.findByMail(mail);
        if (!user) { // if no user was found
            return res.status(417).json({ message: 'No user with this mail'});
        }
        if (!user.sccn) { // if the user has no saved cc
            return res.status(201).json({ message: 'No stored credit card'});
        }
        res.status(200).json({ message: 'Cart with items', sccn: user.sccn });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.update_sccn = async (req, res) => {
    let { new_sccn } = req.body; // get the mail and items from the request's body

    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    let mail = req.session.user.mail;

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