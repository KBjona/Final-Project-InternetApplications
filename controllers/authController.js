const bcrypt = require('bcrypt'); //for password hashing
const User = require('../models/User');

// Runs when Register.js sends a POST request to /api/auth/register
exports.register = async (req, res) => {
    // req.body is the { username, password } object Register.js sent us
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
            createdAt: new Date() // Nice bonus: store registration date!
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