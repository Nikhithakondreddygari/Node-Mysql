const express = require('express');
const ansiColors = require('ansi-colors');
const morgan = require('morgan');
const dotenv = require('dotenv')
dotenv.config();
const mySqlPool = require('./config/db');
const { error } = require('console');

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/', require('./routes/userRoutes'));

const port = process.env.PORT || 3000;

mySqlPool.query("SELECT 1").then(() => {
    console.log(ansiColors.bgCyan.white(`${process.env.DB_NAME} db is connected successfully`));
    // Server
    app.listen(process.env.PORT , () => {
        console.log(ansiColors.bgMagenta.white(`Server is running on port ${port}`));
    });
}).catch((error) => {
    console.log(error);
});