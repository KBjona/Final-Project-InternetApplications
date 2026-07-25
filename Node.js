require('dotenv').config(); // Load variables from .env file

const express = require('express');
const session = require('express-session');
const path = require('path');
const { connectDB } = require('./models/db');
const apiRoutes = require('./routes');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // Prevents client-side JS from stealing the cookie
        secure: false,
        sameSite: 'strict', // to prevent cross site request forgery
        maxAge: 1000 * 60 * 15 // 15 minutes in milliseconds
    }
}));

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));



app.use("/api", apiRoutes); // redirect api calls to the routes folder (index.js)

// Connect to MongoDB Atlas then open Express server
const PORT = process.env.PORT;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Register', 'Register.html'));
});
app.get('/cart', (req, res) => { // just for testing
    res.sendFile(path.join(__dirname, 'views', 'Payment', 'payment.html'));
});

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB Atlas:", err);
    });

