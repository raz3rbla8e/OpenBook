// Importing required modules
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./userModel');
const Artwork = require('./artModel');
const bodyParser = require('body-parser');
const accountRouter = require('./accountRouter');
const mainRouter = require('./mainRouter');
const artRouter = require('./artRouter');
const userRouter = require('./userRouter');
const morgan = require('morgan');

// Creating an instance of the express application
const app = express();
const PORT = 3000;

// Setting the view engine to pug
app.set('view engine', 'pug');

// Parsing JSON data
app.use(express.json());

// Serving static files from the 'views' directory
app.use(express.static('views'));

// Parsing URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Logging HTTP requests in the console
app.use(morgan('dev'));

// Connecting to MongoDB
mongoose.connect('mongodb://127.0.0.1/openGallery');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Creating a MongoDB session store
const MongoDBStore = require('connect-mongodb-session')(session);
const openGallery = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/openGallery',
    collection: 'sessiondata'
});

// Configuring session middleware
app.use(session({
    secret: '1234321',
    resave: true,
    saveUninitialized: true,
    store: openGallery
}));

// Mounting routers for different routes
app.use('/account', accountRouter);
app.use("/main", mainRouter);
app.use("/art", artRouter);
app.use("/user", userRouter);

// Handling the / route
app.get('/', async (req, res) => {
    res.render("login");
});

// Handling all other routes that didnt go into any speicifc route
app.use((req, res) => {
    res.render("escape");
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
