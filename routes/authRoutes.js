const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register); //redirects register requets to authcontroller.register func

router.post('/login', authController.login); //redirects register requets to authcontroller.login func

module.exports = router; // exports the router