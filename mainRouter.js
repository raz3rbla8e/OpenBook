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
                // let userid = user._id;
                res.render("art", { artwork: artwork, session: req.session, user: user });
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

router.post("/art/:id/like", async (req, res) => {

    if (req.session.user) {
        try {

            let artworkid = req.params.id;
            let userid = req.session.user._id;

            const user = await User.findById(userid);

            if (user.userlikes.includes(artworkid)) {
                res.redirect(`/main/art/${artworkid}`);
                return;
            }

            user.userlikes.push(artworkid);
            await user.save();

            const artwork = await Artwork.findById(artworkid);
            artwork.artlikes.push(artworkid);
            await artwork.save();

            res.redirect(`/main/art/${artworkid}`);
        }
        catch (error) {
            console.error('Error fetching artwork:', error);
            res.status(500).send('Internal Server Error');
        }

    }
    else {
        res.redirect("/account/login");
    }



});


router.post("/user/:id/follow", async (req, res) => {

    if (req.session.user) {
        try {
            let artistid = req.params.id;
            let userid = req.session.user._id;

            const artist = await User.findById(artistid);
            const user = await User.findById(userid);

            if (user.following.includes(artist._id)) {
                res.redirect(`/main/user/${artistid}`);
                return;
            }

            user.following.push(artist._id);
            await user.save();

            artist.followedBy.push(user._id);
            await artist.save();

            res.redirect(`/main/user/${artistid}`);
        }
        catch (error) {
            console.error('Error fetching artwork:', error);
            res.status(500).send('Internal Server Error');
        }

    }
    else {
        res.redirect("/account/login");
    }



});

router.get("/user/:id", async (req, res) => {
    let userid = req.params.id;

    if (userid === req.session.user._id.toString()) {
        res.redirect("/account/dashboard");
        return;
    }

    const user = await User.findById(userid);

    if (!user) {
        res.status(404).send('Not Found');
        return;
    }

    let artworkids = user.artworks;

    let listofart = []
    for (let artid of artworkids) {
        const art = await Artwork.findById(artid);
        listofart.push(art);
    }



    let following = false;
    if (user.followedBy.map(id => id.toString()).includes(req.session.user._id.toString())) {
        following = true;
    }



    res.render("user", { user: user, session: req.session, artlist: listofart, following: following })

});


module.exports = router;