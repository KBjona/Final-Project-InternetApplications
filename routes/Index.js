const express = require('express'); 
const router = express.Router();

router.use('/auth', require('./authRoutes')); // routes auth requests to authRoutes files

router.use('/cart', require('./cartRoutes')); // routes cart requests to cartRoutes file

router.use('/products', require('./productRoutes')); // routes product requeses to productRoutes

module.exports = router; //exports the route