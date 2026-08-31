require('dotenv').config(); // Load variables from .env file
const express = require('express');
const session = require('express-session');
const path = require('path');
const { connectDB } = require('./models/db');
const apiRoutes = require('./routes');


const app = express();

app.use(express.json({limit: '15mb'}));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
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
app.use('/scripts/d3',express.static(path.join(__dirname, 'node_modules', 'd3', 'dist'))); // giving the browser the d3 library

app.get('/menu', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // Redirect to register/login page if no cookie/session
  }
  res.sendFile(path.join(__dirname, 'views', 'mainMenu', 'mainMenu.html'));
});

app.get('/cart', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // Redirect to register/login page if no cookie/session
  }
    res.sendFile(path.join(__dirname, 'views', 'Payment', 'payment.html'));
});

app.get('/product/edit/:id', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // Redirect to register/login page if no cookie/session
  }
  const productId = req.params.id;
    res.sendFile(path.join(__dirname, 'views', 'product', 'product_edit.html'));
});

app.get('/product/create', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // Redirect to register/login page if no cookie/session
  }
  const productId = req.params.id;
    res.sendFile(path.join(__dirname, 'views', 'product', 'product_edit.html'));
});

app.get('/product/:id', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // Redirect to register/login page if no cookie/session
  }
  const productId = req.params.id;
    res.sendFile(path.join(__dirname, 'views', 'product', 'product_store.html'));
});

app.use("/api", apiRoutes); // redirect api calls to the routes folder (index.js)

// Connect to MongoDB Atlas then open Express server
const PORT = process.env.PORT;

app.get('/', (req, res) => {
    if (req.session.user)
        return res.redirect('/menu'); // Redirect to main menu if already registered
    res.sendFile(path.join(__dirname, 'public', 'Register', 'Register.html'));
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

