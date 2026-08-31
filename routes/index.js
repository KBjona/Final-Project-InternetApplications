const express = require('express');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();
const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 200,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});

router.use(limiter);
console.log("got here");
router.use('/auth', require('./authRoutes')); // routes auth requests to authRoutes files

router.use('/cart', require('./cartRoutes')); // routes cart requests to cartRoutes file

router.use('/product', require('./productRoutes')); // routes product requests to productRoutes file

module.exports = router; //exports the route