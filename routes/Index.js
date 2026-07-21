const express = require('express'); 
const router = express.Router();

router.use('/auth', require('./authRoutes')); // routes auth requests to authRoutes files

module.exports = router; //exports the route