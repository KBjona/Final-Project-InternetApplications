const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

router.post('/create', ProductController.create_store); // sends a post request to create a new store

router.post('/update',ProductController.edit_store_parameters); // sends a post request to edit the store

router.post('/load',ProductController.load_store_parameters); // sends a post request to load the store parameters

router.post('/validate',ProductController.validate_owner); // sends a post request to validate the owner of the store

router.get('/search', ProductController.search_products); // routes the search fucntion to the controller search function.

router.post('/add-review',ProductController.add_review); // sends a post request to add a review to the store

router.post('/show',ProductController.show_store); // sends a post request to show the store

router.get('/getAll', ProductController.get_all_products); // sends a get request to get all the stores

module.exports = router; // exports the router
