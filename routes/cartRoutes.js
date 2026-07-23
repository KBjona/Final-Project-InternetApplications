const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');

router.post('/items',CartController.load_items); // sends a post request to load the items

router.post('/delete',CartController.delete_items); // sends a post request to delete the items

module.exports = router; // exports the router
