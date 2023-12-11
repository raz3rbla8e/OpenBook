const express = require('express');
const router = express.Router();
const Artwork = require('./artModel');
const User = require('./userModel');
const mongoose = require('mongoose');


router.post("/:id/follow", async (req, res) => {

    if (req.session.user) {
        try {
            let artistid = req.params.id;
            let userid = req.session.user._id;

            let artist = await User.findById(artistid);
            let user = await User.findById(userid);

            if (user.following.includes(artist._id)) {
                res.redirect(`/user/${artistid}`);
                return;
            }



            user.following.push(artist._id.toString());
            await user.save();

            artist.followedBy.push(user._id.toString());
            await artist.save();

            res.redirect(`/user/${artistid}`);
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


router.post("/:id/unfollow", async (req, res) => {
    if (req.session.user) {
        try {
            let artistid = req.params.id;
            let userid = req.session.user._id;

            let artist = await User.findById(artistid);
            let user = await User.findById(userid);

            if (!user.following.includes(artistid)) {
                res.redirect(`/user/${artistid}`);
                return;
            }


            user.following = user.following.filter(id => id.toString() !== artistid.toString());
            await user.save();


            artist.followedBy = artist.followedBy.filter(id => id.toString() !== userid.toString());
            await artist.save();

            res.redirect('back');
        } catch (error) {
            console.error('Error unfollowing artist:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect("/account/login");
    }
});


router.get("/:id", async (req, res) => {
    if (!req.session.user) {
        res.redirect("/account/login");
        return;
    }
    let userid = req.params.id;

    if (userid === req.session.user._id.toString()) {
        res.redirect("/account/dashboard");
        return;
    }

    let user = await User.findById(userid);

    if (!user) {
        res.status(404).send('Not Found');
        return;
    }

    let artworkids = user.artworks;

    let listofart = []
    for (let artid of artworkids) {
        let art = await Artwork.findById(artid);
        listofart.push(art);
    }

    let reviews = [];

    let theirReviews = await Artwork.find({ 'reviews.user':user._id });

    for(let review of theirReviews)
    {
        reviews.push({
            artwork: review.Title,
            artworkid: review._id.toString(),
            text: review.reviews.find(rev => rev.user === user._id.toString()).text
        })
    }


    let following = false;
    if (user.followedBy.map(id => id.toString()).includes(req.session.user._id.toString())) {
        following = true;
    }



    res.render("user", { user: user, session: req.session, artlist: listofart, following: following, reviews: reviews });

});

module.exports = router;
