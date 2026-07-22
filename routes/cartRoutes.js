const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');

router.post('/items',CartController.load_items);

module.exports = router; // exports the router
