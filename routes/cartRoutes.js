const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');

router.post('/items',CartController.load_items); // sends a post request to load the items

router.post('/delete',CartController.delete_items); // sends a post request to delete the items

router.post('/update',CartController.update_items_quantities); // sends a post request to update the items

//router.post('/inc',CartController.add_item_to_cart); // sends a post request to add an item to the cart

module.exports = router; // exports the router
