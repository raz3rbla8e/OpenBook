const Artwork = require("./artModel");
const mongoose = require("mongoose");
const User = require("./userModel");
const fs = require("fs");
const path = require("path");


let filepath = path.join(__dirname, 'gallery.json');
const artworks = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

const users = [];

mongoose.connect('mongodb://127.0.0.1/openGallery');

let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', async function () {
    await mongoose.connection.dropDatabase();
    console.log("Dropped database. Starting re-creation.");

    try {
        for (const art of artworks) {

            const artwork = new Artwork(art);
            await artwork.save();

            let existingUser = users.find((user) => user.username === art.Artist);
            if (!existingUser) {
                // If the artist is not in the users array, add them
                users.push({
                    username: art.Artist,
                    type: 'artist',
                    artworks: [artwork._id]
                });
            }
            else {
                existingUser.artworks.push(artwork._id);
            }

        }

        console.log("All artworks saved.");

        let validUsers = users.map(user => new User(user));

        await User.insertMany(validUsers);
        console.log("All Users Saved");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});






