const express = require('express');
const { rateLimit } = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 50, // 50 requests per IP per window
  store: new MongoStore({
    uri: process.env.MONGO_URI,
    expireTimeMs: 3 * 60 * 1000,
    errorHandler: console.error,
  }),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

router.use(limiter);
console.log("got here");
router.use('/auth', require('./authRoutes')); // routes auth requests to authRoutes files

router.use('/cart', require('./cartRoutes')); // routes cart requests to cartRoutes file

router.use('/product', require('./productRoutes')); // routes product requests to productRoutes file

module.exports = router; //exports the route