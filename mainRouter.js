const express = require('express');
const router = express.Router();
const Artwork = require('./artModel');
const User = require('./userModel');



router.get("/home", async function (req, res) {

    if (req.session.user) {
        try {
            // Fetch 5 random artworks from the database
            const randomArtworks = await Artwork.aggregate([
                { $sample: { size: 5 } }
            ]);

            res.render("home", { artworks: randomArtworks });
        } catch (error) {
            console.error('Error fetching random artworks:', error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.redirect("/account/login");
    }

});

module.exports = router;