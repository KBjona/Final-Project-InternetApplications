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
            lname: user.lname
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
                    .updateOne({ mail },{ $set: { googleId: googleId } });
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
            lname: lname
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
        const fbRes = await fetch(
            `https://graph.facebook.com/me?fields=id,first_name,last_name,email&access_token=${accessToken}`
        );
        const profile = await fbRes.json();

        if (profile.error) {
            return res.status(400).json({ message: "Invalid Facebook token." });
        }

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
                await User.linkFacebookAccount(mail, facebookId);
            } else {
                // First time logging in with Facebook
                await User.createUser({
                    fname,
                    lname,
                    mail,
                    facebookId,
                    createdAt: new Date()
                });
            }
        }

        console.log("User logged in using Facebook");

        req.session.user = {
            mail: mail,
            fname: fname,
            lname: lname
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

exports.updateProfile = async (req,res) => {
    if (!req.session || !req.session.user)
        return res.status(401).json({message: "not logged in"});
    if (!req.session?.user?.mail) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const {fname, lname, bday, password, longitude, latitude} = req.body;
    const mail = req.session.user.mail;

    try{
        const updateData = {};
        if (fname) updateData.fname = fname;
        if (lname) updateData.lname = lname;
        if (bday) updateData.bday = bday;
        if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
        if (longitude !== undefined && longitude !== null && longitude !== '') {
            updateData.longitude = Number(longitude);
        }
        if (latitude !== undefined && latitude !== null && latitude !== '') {
            updateData.latitude = Number(latitude);
        }

        await User.updateUserProfile(mail, updateData);

        if (fname) req.session.user.fname = fname;
        if (lname) req.session.user.lname = lname;

        res.status(200).json({ message: "account updates successfully!"});
    }
    catch (err){
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Database update failed"});
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
};