const mongoose = require('mongoose');


const artworkSchema = new mongoose.Schema({
    Title: String,
    Artist: String,
    Year: String,
    Category: String,
    Medium: String,
    Description: String,
    Poster: String,
});


const Artwork = mongoose.model('Artwork', artworkSchema);
module.exports = Artwork;
