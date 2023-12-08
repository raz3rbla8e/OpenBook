const express = require('express');
const mongoose = require('mongoose');
const User = require('./userModel');
const Artwork = require('./artModel');
const bodyParser = require('body-parser');
const accountRouter = require('./accountRouter');


const app = express();
const PORT = 3000;


app.set('view engine', 'pug');
app.use(express.json());
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect('mongodb://127.0.0.1/openGallery');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
})

app.use('/account', accountRouter);

app.get('/', async (req, res) => {
    res.render("login");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});









