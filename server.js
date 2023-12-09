const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./userModel');
const Artwork = require('./artModel');
const bodyParser = require('body-parser');
const accountRouter = require('./accountRouter');
const mainRouter = require('./mainRouter');

const morgan = require('morgan');



const app = express();
const PORT = 3000;


app.set('view engine', 'pug');
app.use(express.json());
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('dev'));



mongoose.connect('mongodb://127.0.0.1/openGallery');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});


const MongoDBStore = require('connect-mongodb-session')(session);
const openGallery = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/openGallery',
    collection: 'sessiondata'
});
app.use(session({
    secret: '1234321',
    resave: true,
    saveUninitialized: true,
    store: openGallery
}));



app.use('/account', accountRouter);
app.use("/main", mainRouter);

app.get('/', async (req, res) => {
    res.render("login");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});









