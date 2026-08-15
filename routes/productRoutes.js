const express = require('express'); // import express
const router = express.Router();
const ProductController = require('../controllers/productController'); // import productController

// GET /api/products
router.get('/', ProductController.get_all_products); // forward the request

module.exports = router;