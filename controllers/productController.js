const { session } = require('passport');
const Product = require('../models/Product');
const { Binary } = require('mongodb');


exports.create_store = async (req, res) => {
    let { parameters, image_base64, video_base64 } = req.body
    if (!parameters) {//if there are no parameters
        return res.status(400).json({ message: 'parameters cannot be empty' });
    }
    else if (!image_base64 || image_base64 == null || typeof (image_base64) != 'string') { // if there is no image
        return res.status(400).json({ message: 'image has to exist' });
    }
    else if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }

    parameters["product-price"] = Number(parameters["product-price"]); //converting these fields into numbers from strings
    parameters["product-stock"] = Number(parameters["product-stock"]);
    parameters["product-discount"] = Number(parameters["product-discount"]);


    const owner = req.session.user.mail; // creating the owner as the user logged in

    const image_base64_data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64;
    const image_bin = new Binary(Buffer.from(image_base64_data, 'base64')); // converting the image to binary

    let video_bin = null;
    if (video_base64 && video_base64 != null && typeof (video_base64) == 'string') {
        const video_base64_data = video_base64.includes(',') ? video_base64.split(',')[1] : video_base64;
        video_bin = new Binary(Buffer.from(video_base64_data, 'base64')); //creating the video in binary
    }

    try {
        const store_result = await Product.CreateStoreParameters(owner, parameters, image_bin, video_bin);
        if (!(store_result.insertedId)) { //store without id
            return res.status(400).json({ message: 'This store has no id' });
        }
    } catch (err) { // server error
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong on the server' });
    }
    res.status(200).json({ message: 'Store created successfully' });
}


exports.edit_store_parameters = async (req, res) => {
    let { _id, parameters, image_base64, video_base64 } = req.body;// get the id and params from the request's body
    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }
    else if (!parameters) {//if there are no parameters
        return res.status(400).json({ message: 'parameters cannot be empty' });
    }

    parameters["product-price"] = Number(parameters["product-price"]); //converting these fields into numbers from strings
    parameters["product-stock"] = Number(parameters["product-stock"]);
    parameters["product-discount"] = Number(parameters["product-discount"]);

    try {
        const params_result = await Product.UpdateStoreParameters(_id, parameters);
        if (params_result.matchedCount === 0) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address to change parameters' });
        }
    } catch (err) { // server error
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong on the server' });
    }
    if (image_base64 && image_base64 != null && typeof (image_base64) == 'string') {
        const image_base64_data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64;
        const image_bin = new Binary(Buffer.from(image_base64_data, 'base64'));
        try {
            const img_result = await Product.UpdateStoreImage(_id, image_bin);
            if (img_result.matchedCount === 0) { //no product was found with this id
                return res.status(400).json({ message: 'No product found with that id address to change image' });
            }
        } catch (err) { // server error
            console.error(err);
            return res.status(500).json({ message: 'Something went wrong on the server' });
        }
    }
    if (video_base64 && video_base64 != null && typeof (video_base64) == 'string') {
        const video_base64_data = video_base64.includes(',') ? video_base64.split(',')[1] : video_base64;
        const video_bin = new Binary(Buffer.from(video_base64_data, 'base64'));
        try {
            const vid_result = await Product.UpdateStoreVideo(_id, video_bin);
            if (vid_result.matchedCount === 0) { //no product was found with this id
                return res.status(400).json({ message: 'No product found with that id address to change video' });
            }
        } catch (err) { // server error
            console.error(err);
            return res.status(500).json({ message: 'Something went wrong on the server' });
        }
    }
    res.status(200).json({ message: 'Store edited successfully' });
}

exports.load_store_parameters = async (req, res) => {
    let { _id } = req.body;// get the id from the request's body
    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }

    try {
        const result = await Product.GetStoreParameters(_id);
        if (!result) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address' });
        }
        let calc_rating = result.num_ratings ? Number((result.sum_ratings / result.num_ratings).toFixed(2)) : null;
        res.status(200).json({ message: 'Store parameters loaded successfully', parameters: result.parameters, rating: calc_rating });
    } catch (err) { // server error
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.delete_store = async (req, res) => {
    let { _id } = req.body;// get the id from the request's body
    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }

    try {
        const result = await Product.DeleteStore(_id);
        if (!result) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address' });
        }
        return res.status(200).json({ message: 'Store deleted successfully'});
    } catch (err) { // server error
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.show_store = async (req, res) => {
    let { _id } = req.body;// get the id from the request's body
    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }

    try {
        const result = await Product.GetStoreParameters(_id, 1, 1, 1); // get the parameters, image, video, and owner of the store
        if (!result) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address' });
        }
        let calc_rating = result.num_ratings ? Number((result.sum_ratings / result.num_ratings).toFixed(2)) : null;
        res.status(200).json({ message: 'Store parameters loaded successfully', parameters: result.parameters, productImage: result.productImage, productVideo: result.productVideo, rating: calc_rating, owner: result.owner });

    } catch (err) { // server error
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.add_review = async (req, res) => {
    let { _id, rating } = req.body;// get the id and params from the request's body

    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }
    else if (!rating) {//if there are no parameters
        return res.status(400).json({ message: 'rating cannot be null' });
    }

    try {
        const result = await Product.AddReview(_id, rating);
        if (result.matchedCount === 0) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address to add review' });
        }
        else if (result.modifiedCount === 0) { //the review was not added
            return res.status(400).json({ message: 'Failed to add review' });
        }
    } catch (err) { // server error
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong on the server' });
    }
    res.status(200).json({ message: 'Store review added successfully' });
}


exports.validate_owner = async (req, res) => {
    console.log("entered validate owner in productController")
    let { _id } = req.body;// get the id from the request's body
    if (!_id) {//if there is no product id
        return res.status(400).json({ message: 'product id cannot be empty' });
    }
    else if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }

    try {
        const result = await Product.GetStoreOwner(_id);
        if (!result) { //no product was found with this id
            return res.status(400).json({ message: 'No product found with that id address' });
        }
        if (result.owner !== req.session.user.mail) { //the owner of the store is not the same as the user that is logged in
            return res.status(400).json({ message: 'You are not the owner of this store', is_owner: false });
        }

        res.status(200).json({ message: 'Owner validated successfully', is_owner: true });
    } catch (err) { // server error
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.get_all_products = async (req, res) => {
    try {
        const products = await Product.findAllProducts(); // send req to get all products
        res.status(200).json(products);
    } catch (err) {
        return res.status(500).json({ message: 'Something went wrong on the server' }); //if failed send error status
    }
};

exports.search_products = async (req, res) => {
    try {
        const { q = '', maxPrice, minDiscount, minStars } = req.query;

        const filters = {
            query: q,
            maxPrice: maxPrice ? Number(maxPrice) : null,
            minDiscount: minDiscount ? Number(minDiscount) : null,
            minStars: minStars ? Number(minStars) : null,
        };

        const groupedResults = await Product.searchProductsGrouped(filters);
        res.status(200).json(groupedResults);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'error searching products' });
    }
};
