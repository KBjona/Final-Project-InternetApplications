const bcrypt = require('bcrypt'); //for password hashing
const User = require('../models/User');
const { OAuth2Client } = require("google-auth-library"); // import google auth library

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // get client id from .env
// Runs when Register.js sends a POST request to /api/auth/register
exports.register = async (req, res) => {
    const { fname, lname, bday, mail, password } = req.body;

    // check for empty fields
    if (!fname || !lname || !bday || !mail || !password) {
        return res.status(400).json({ message: 'Please fill out all fields' });
    }

    try {
        // check nobody already registered with this email
        const existingUser = await User.findByMail(mail);
        if (existingUser) {
            return res.status(409).json({ message: 'That email is already registered' });
        }

        // hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // save the new user in MongoDB

        await User.createUser({
            fname,
            lname,
            bday,
            mail,
            passwordHash,
            createdAt: new Date() //store registration date!
        });        // tell the browser it worked
        res.status(201).json({ message: 'Account created!' });

    } catch (err) { // database error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the database' });
    }
};

exports.login = async (req, res) => {
    const { mail, password } = req.body;
    try {
        const user = await User.findByMail(mail);

        if (user && !user.passwordHash) { // check if user exisits but dosen't have a stores password
            return res.status(400).json({ message: 'This account was created using Google. Please sign in with Google and set up your password in the menu.' });
        }

        // bcrypt.compare checks the typed password against the hashed one we saved
        const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Wrong email or password' });
        }

        req.session.user = {
            mail: user.mail,
            fname: user.fname,
            lname: user.lname,
            facebookPages: user.facebookPages || []
        };

        console.log("User successfully logged in")
        res.json({ message: 'Logged in!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
};

exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            message: "Google token is missing."
        });
    }

    try {

        // Verify that the token really came from Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        // Extract user information
        const payload = ticket.getPayload();

        const googleId = payload.sub;
        const mail = payload.email;
        const fname = payload.given_name || "";
        const lname = payload.family_name || "";

        // Try finding the user by Google ID first
        let user = await User.findByGoogleId(googleId);

        // If not found, check whether this email already exists
        if (!user) {
            user = await User.findByMail(mail);

            if (user) {
                // Existing account -> link it to Google
                await require("../models/db")
                    .getDb()
                    .collection("users")
                    .updateOne({ mail }, { $set: { googleId: googleId } });
            } else {
                // First time logging in with Google
                await User.createUser({
                    fname,
                    lname,
                    mail,
                    googleId,
                    createdAt: new Date()
                });
            }
        }
        console.log("User logged in using Google");

        req.session.user = {
            mail: mail,
            fname: fname,
            lname: lname,
            facebookPages: user.facebookPages || []
        };

        res.json({
            message: "Logged in successfully!"
        });

    } catch (err) {

        console.error(err);

        res.status(401).json({
            message: "Invalid Google login."
        });

    }

};

exports.facebookLogin = async (req, res) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({
            message: "Facebook token is missing."
        });
    }

    try {
        // Fetch user information from Facebook Graph API
        const fbRes = await fetch(`https://graph.facebook.com/me?fields=id,first_name,last_name,email&access_token=${accessToken}`);
        const profile = await fbRes.json();

        if (profile.error) {
            return res.status(400).json({ message: "Invalid Facebook token." });
        }
        const pages_result = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
        const pages_data = await pages_result.json();
        const pages = pages_data.data || [];

        const facebookId = profile.id;
        const mail = profile.email || null;
        const fname = profile.first_name || "";
        const lname = profile.last_name || "";

        // Try finding the user by Facebook ID first
        let user = await User.findByFacebookId(facebookId);

        // If not found, check whether this email already exists
        if (!user) {
            if (mail) {
                user = await User.findByMail(mail);
            }

            if (user) {
                // Existing account -> link it to Facebook
                await User.linkFacebookAccount(mail, facebookId, pages);
            } else {
                // First time logging in with Facebook
                await User.createUser({
                    fname,
                    lname,
                    mail,
                    facebookId,
                    facebookPages: pages,
                    createdAt: new Date()
                });
            }
        }

        req.session.user = {
            mail: mail,
            fname: fname,
            lname: lname,
            facebookPages: pages
        };

        res.json({
            message: "Logged in successfully!"
        });

    } catch (err) {
        console.error(err);
        res.status(401).json({
            message: "Invalid Facebook login."
        });
    }
};

exports.getCurrentUser = async (req, res) => {
    if (!req.session?.user?.mail) {
        return res.status(401).json({ loggedIn: false, message: "Not logged in" });
    }

    try {
        const user = await User.findByMail(req.session.user.mail);
        if (!user) {
            return res.status(401).json({ loggedIn: false, message: "User not found" });
        }

        delete user.passwordHash;
        delete user.sccn
        delete user.facebookPages

        return res.json({ loggedIn: true, user });
    }
     catch (err) {
        console.error("getCurrentUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.logout = (req, res) => { //LOGOUT function
    req.session.destroy((err) => { // try to destroy session
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid'); // if successed in destroying the session clear the cookie
        res.json({ message: "Logged out successfully!" });
    });
};

exports.updateProfile = async (req, res) => {
    if (!req.session || !req.session.user)
        return res.status(401).json({message: "not logged in"});
    if (!req.session?.user?.mail) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const {fname, lname, bday, password, longitude, latitude} = req.body;
    const mail = req.session.user.mail;

    try {
        const updateData = {};
        if (fname) updateData.fname = fname;
        if (lname) updateData.lname = lname;
        if (bday) updateData.bday = bday;
        if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
        if (longitude !== undefined && longitude !== null && longitude !== '') {
            const long = Number(longitude);
            if(!Number.isFinite(long)){
                return res.status(400).json({ message: 'Invalid longitude' });
            }
            updateData.longitude = long;
        }
        if (latitude !== undefined && latitude !== null && latitude !== '') {
            const lat = Number(latitude);
            if(!Number.isFinite(lat)){
                return res.status(400).json({ message: 'Invalid latitude' });
            }
            updateData.latitude = lat;
        }

        await User.updateUserProfile(mail, updateData);

        if (fname) req.session.user.fname = fname;
        if (lname) req.session.user.lname = lname;

        res.status(200).json({ message: "account updates successfully!" });
    }
    catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Database update failed" });
    }
}

exports.follow = async (req, res) => {
    let { owner } = req.body; // get the owner from the request's body
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    if (!owner) { //if there is no one to follow
        return res.status(400).json({ message: 'The one to follow has to exist' });
    }
    let mail = req.session.user.mail;
    try {
        const result = await User.Follow(mail, owner);
        if (result.matchedCount === 0) {//no user was found
            return res.status(400).json({ message: 'No user found with that email address' });
        } else if (result.modifiedCount === 0) {//if the following array didin't change
            return res.status(200).json({ message: 'User found, but the field stayed the same' });
        }
        res.status(200).json({ message: 'User changed successfully' });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.unfollow = async (req, res) => {
    let { owner } = req.body; // get the owner from the request's body
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    if (!owner) { //if there is no one to follow
        return res.status(400).json({ message: 'The one to follow has to exist' });
    }
    let mail = req.session.user.mail;
    try {
        const result = await User.Unfollow(mail, owner);
        if (result.matchedCount === 0) { //no user was found
            return res.status(400).json({ message: 'No user found with that email address' });
        } else if (result.modifiedCount === 0) {//if the following array didin't change
            return res.status(200).json({ message: 'User found, but the field stayed the same' });
        }
        res.status(200).json({ message: 'User changed successfully' });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.check_follow = async (req, res) => {
    let { owner } = req.body; // get the owner from the request's body
    if (!(req.session?.user?.mail)) { //if there is no user connected
        return res.status(400).json({ message: 'Log in please' });
    }
    if (!owner) { //if there is no one to follow
        return res.status(400).json({ message: 'The one to check for a follow has to exist' });
    }
    let mail = req.session.user.mail;
    try {
        const result = await User.CheckFollow(mail, owner);
        if (result > 0) { //if the user follows the owner
            return res.status(200).json({ message: 'User follows him', follow: 1 });
        } else {//if the user doesnt follow the owner
            return res.status(200).json({ message: 'User doesnt follow him', follow: 0 });
        }
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.getUserLocation = async (req, res) => {
    let { owner } = req.body; // get the owner from the request's body
    if (!owner) { //if there is no one to follow
        return res.status(400).json({ message: 'The one to check for a follow has to exist' });
    }
    try {
        const result = await User.findByMail(owner);
        if(!result){
            return res.status(404).json({ message: 'Couldnt find the owner' });
        }
        if( typeof result.latitude != 'number' || !Number.isFinite(result.latitude) || typeof result.longitude != 'number' || !Number.isFinite(result.longitude) ){
            return res.status(400).json({ message: 'The user latitude or longtitude arent defined' });
        }
        return res.status(200).json({ message: 'Got the location', latitude: result.latitude, longitude: result.longitude });
    } catch (err) { // server error
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
}

exports.create_facebook_ad = async (req, res) => {
    if (!req.session?.user?.facebookPages || req.session.user.facebookPages.length === 0) { // if the facebook pages in the info doesn't exist
        return res.status(400).json({ message: 'No facebook pages was found' });
    }
    const page_id = req.session.user.facebookPages[0].id; // getting the id and token from the session
    const page_token = req.session.user.facebookPages[0].access_token;

    const {message, image_base64} = req.body;

    try {
        let facebook_url;
        let facebook_form_data = new FormData(); // creating a form data to send in the request
        facebook_form_data.append("access_token", page_token);

        if (image_base64) {
            facebook_url = `https://graph.facebook.com/v21.0/${page_id}/photos`; // making the url a url for a text and image post
            facebook_form_data.append("caption", message || '');
            
            const base64_data = image_base64.replace(/^data:image\/\w+;base64,/, ""); //creating a  blob to add to the data of the request
            const buffer = Buffer.from(base64_data, 'base64');
            const blob = new Blob([buffer])
            facebook_form_data.append("source", blob);
        }
        else {
            facebook_url = `https://graph.facebook.com/v21.0/${page_id}/feed`; // making the url a url for text only post
            facebook_form_data.append("message", message || '');
        }

        const response = await fetch(facebook_url, { //sends a post request to facebook to create the page
            method: 'POST',
            body: facebook_form_data
        });

        const data = await response.json(); // getting the data of the response
        
        if (response.ok) { // if it posted successfully
            return res.status(200).json({ success: true, postId: data.id || data.post_id });
        } else { // if it didnt posted successfully
            return res.status(400).json({ success: false, error: data.error.message });
        }
    }catch (err) { // facebook's error
        console.error(err);
        res.status(500).json({ message: "Couldn't create the facebook post successfully" });
    }
}

exports.delete_account = async (req, res) => {
  if (!req.session?.user?.mail) { // check if user is logged in
    return res.status(401).json({ message: 'You must be logged in.' });
  }

  const userMail = req.session.user.mail; // gets mail

  try {
    const result = await User.deleteUserByMail(userMail); // tried to delete

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User account not found.' }); // if can't delete
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Account deleted, but session cleanup failed.' }); // show session error
      }
      res.clearCookie('connect.sid'); // disconnect cookies
      return res.status(200).json({ message: 'Account deleted successfully.' });
    });

  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
