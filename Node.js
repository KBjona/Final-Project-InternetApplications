require('dotenv').config(); // Load variables from .env file

const express = require('express');
const path = require('path');
const { connectDB } = require('./models/db');

const app = express();

// Middlewares & View Engine Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB Atlas FIRST, then open Express server
const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB Atlas:", err);
    });