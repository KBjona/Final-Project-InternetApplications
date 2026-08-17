const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

router.post('/update',ProductController.edit_store_parameters); // sends a post request to edit the store

router.post('/load',ProductController.load_store_parameters); // sends a post request to load the store parameters

router.post('/validate',ProductController.validate_owner); // sends a post request to validate the owner of the store

router.get('/getAll', ProductController.get_all_products);

module.exports = router; // exports the router
