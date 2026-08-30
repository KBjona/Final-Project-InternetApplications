const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); 

router.post('/register', authController.register); //redirects register requets to authcontroller.register func

router.post('/login', authController.login); //redirects login requets to authcontroller.login func
router.post("/google", authController.googleLogin); // redirectes google login requests to google login func 
router.post("/facebook", authController.facebookLogin); // redirects facebook login requests to facebooklogin func
router.post("/create-ad", authController.create_facebook_ad); // redirects facebook login requests to facebooklogin func
router.post("/location", authController.getUserLocation); // redirects loaction requests to get user location func

router.post("/update-profile", authController.updateProfile); // redirects you to the update profile func
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.delete('/delete-account', authController.delete_account); // go to delete function

router.post("/follow", authController.follow); // redirectes follow requests to follow func 
router.post("/unfollow", authController.unfollow); // redirects unfollow requests to unfollow func
router.post("/check-follow", authController.check_follow); // redirects check follow requests to check_follow func

module.exports = router; // exports the router  