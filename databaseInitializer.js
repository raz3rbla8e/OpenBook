const Artwork = require("./artModel");
const mongoose = require("mongoose");
const User = require("./userModel");
const fs = require("fs");
const path = require("path");

// Read the gallery.json file and parse its contents
let filepath = path.join(__dirname, 'gallery.json');
const artworks = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

const users = [];

// Connect to the MongoDB database
mongoose.connect('mongodb://127.0.0.1/openGallery');

let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// Once the database connection is open
db.once('open', async function () {
    // Drop the existing database
    await mongoose.connection.dropDatabase();
    console.log("Dropped database. Starting re-creation.");

    try {
        // Iterate through each artwork in the gallery
        for (const art of artworks) {
            // Create a new Artwork document and save it to the database
            const artwork = new Artwork(art);
            await artwork.save();

            // Check if the artist already exists in the users array
            let existingUser = users.find((user) => user.username === art.Artist);
            if (!existingUser) {
                // If the artist is not in the users array, add them
                users.push({
                    username: art.Artist,
                    type: 'artist',
                    artworks: [artwork._id]
                });
            } else {
                // If the artist already exists, add the artwork to their artworks array
                existingUser.artworks.push(artwork._id);
            }
        }

        console.log("All artworks saved.");

        // Create User documents from the users array and save them to the database
        let validUsers = users.map(user => new User(user));
        await User.insertMany(validUsers);
        console.log("All Users Saved");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});
