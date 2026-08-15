const Product = require('../models/Product');

exports.edit_store_parameters = async (req, res) => {
    let { _id, parameters } = req.body;// get the id and params from the request's body
    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }
    else if(!parameters){
        return res.status(400).json({ message: 'parameters cannot be empty' });
    }

    try {
        const result = await Product.UpdateStoreParameters(_id,parameters);
        if (result.matchedCount === 0) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address'});
        } else if (result.modifiedCount === 0) {//the parameters field didn't need to change
            return res.status(200).json({ message: 'product found, but the field was the same'});
        }
        res.status(200).json({ message: 'Store edited successfully'});
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.load_store_parameters = async (req, res) => {
    let { _id } = req.body;// get the id from the request's body
    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }

    try {
        const result = await Product.GetStoreParameters(_id);
        if (!result) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address'});
        }
        res.status(200).json({ message: 'Store parameters loaded successfully', parameters: result.parameters });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.validate_owner = async (req, res) => {
    console.log("entered validate owner in productController")
    let { _id } = req.body;// get the id from the request's body
    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }
    console.log("bypassed first if")

    try {
        const result = await Product.GetStoreOwner(_id);
        console.log("got 'getstoreowner(id)' successfuly")
        if (!result) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address'});
        }
        if (result.owner !== req.session.user.mail) { //the owner of the store is not the same as the user that is logged in
            return res.status(400).json({ message: 'You are not the owner of this store', is_owner: false });
        }
        
        res.status(200).json({ message: 'Owner validated successfully' ,is_owner: true });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.get_all_products = async (req, res) => {
    try {
        const products = await Product.findAllProducts(); // send req to get all products
        res.status(200).json(products);
    } catch (err) {
        console.error("Product Controller Error:", err);
        res.status(500).json({ message: 'Something went wrong on the server' }); //if failed send error status
    }
};