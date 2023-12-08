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


router.get("/art/:id", async function (req, res) {

    if (req.session.user) {
        try {
            const artwork = await Artwork.findById(req.params.id);

            if (!artwork) {
                res.status(404).send('Not Found');
                return;
            }
            let username = artwork.Artist;

            let user = await User.findOne({ username: username });

            if (user) {
                let userid = user._id;
                console.log(userid);
                res.render("art", { artwork: artwork, session: req.session, userid: userid });
            } else {
                res.status(404).send('User not found');
            }
        } catch (error) {
            console.error('Error fetching artwork:', error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.redirect("/account/login");
    }
});

module.exports = router;