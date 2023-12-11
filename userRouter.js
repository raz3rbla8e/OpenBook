// Importing required modules
const express = require('express');
const router = express.Router();
const Artwork = require('./artModel');
const User = require('./userModel');
const mongoose = require('mongoose');

// Route for following an artist
router.post("/:id/follow", async (req, res) => {
    // Checking if user is logged in
    if (req.session.user) {
        try {
            let artistid = req.params.id;
            // Validating artist id
            if(mongoose.Types.ObjectId.isValid(artistid) === false) {
                return res.status(400).send("Invalid artist id");
            }
            let userid = req.session.user._id;

            // Finding artist and user by their ids
            let artist = await User.findById(artistid);
            let user = await User.findById(userid);

            // Checking if user is already following the artist
            if (user.following.includes(artist._id)) {
                return res.status(409).send("User is already following the artist");
            }

            // Adding artist id to user's following list
            user.following.push(artist._id.toString());
            await user.save();

            // Adding user id to artist's followedBy list
            artist.followedBy.push(user._id.toString());
            await artist.save();

            res.status(200).redirect(`/user/${artistid}`);
        }
        catch (error) {
            console.error('Error fetching artwork:', error);
            res.status(500).send('Internal Server Error');
        }

    }
    else {
        res.status(401).redirect("/account/login");
    }
});

// Route for unfollowing an artist
router.post("/:id/unfollow", async (req, res) => {
    // Checking if user is logged in
    if (req.session.user) {
        try {
            let artistid = req.params.id;
            // Validating artist id
            if(mongoose.Types.ObjectId.isValid(artistid) === false) {
                return res.status(400).send("Invalid artist id");
            }
            let userid = req.session.user._id;

            // Finding artist and user by their ids
            let artist = await User.findById(artistid);
            let user = await User.findById(userid);

            // Checking if user is not following the artist
            if (!user.following.includes(artistid)) {
                return res.status(409).send("User is not following the artist");
            }

            // Removing artist id from user's following list
            user.following = user.following.filter(id => id.toString() !== artistid.toString());
            await user.save();

            // Removing user id from artist's followedBy list
            artist.followedBy = artist.followedBy.filter(id => id.toString() !== userid.toString());
            await artist.save();

            res.status(200).redirect('back');
        } catch (error) {
            console.error('Error unfollowing artist:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(401).redirect("/account/login");
    }
});

// Route for getting user profile
router.get("/:id", async (req, res) => {
    // Checking if user is logged in
    if (!req.session.user) {
        return res.status(401).redirect("/account/login");
    }
    let userid = req.params.id;
    // Validating user id
    if(mongoose.Types.ObjectId.isValid(userid) === false) {
        return res.status(400).send("Invalid user id");
    }

    // Redirecting to user's dashboard if accessing own profile
    if (userid === req.session.user._id.toString()) {
        return res.status(302).redirect("/account/dashboard");
    }

    // Finding user by id
    let user = await User.findById(userid);

    // Checking if user exists
    if (!user) {
        return res.status(404).send('Not Found');
    }

    let artworkids = user.artworks;

    let listofart = []
    for (let artid of artworkids) {
        let art = await Artwork.findById(artid);
        listofart.push(art);
    }

    let reviews = [];

    // Finding reviews by the user
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
    // Checking if logged in user is following the user
    if (user.followedBy.map(id => id.toString()).includes(req.session.user._id.toString())) {
        following = true;
    }

    // Rendering user profile page with user details, artwork list, reviews, and following status
    res.render("user", { user: user, session: req.session, artlist: listofart, following: following, reviews: reviews });
});

module.exports = router;
