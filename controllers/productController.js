const Product = require('../models/Product'); // import the product model

exports.get_all_products = async (req, res) => {
    try {
        const products = await Product.findAllProducts(); // send req to get all products
        res.status(200).json(products);
    } catch (err) {
        console.error("Product Controller Error:", err);
        res.status(500).json({ message: 'Something went wrong on the server' }); //if failed send error status
    }
};