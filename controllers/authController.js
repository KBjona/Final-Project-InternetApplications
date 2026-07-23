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
        res.status(500).json({ message: 'Something went wrong on the server' });
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
                    .updateOne(
                        { mail },
                        {
                            $set: {
                                googleId: googleId
                            }
                        }
                );

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