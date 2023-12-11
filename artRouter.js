const express = require('express');
const router = express.Router();
const Artwork = require('./artModel');
const User = require('./userModel');
const mongoose = require('mongoose');


router.get("/:id", async function (req, res) {
    if (req.session.user) {
        try {

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                res.status(404).send('Not Found');
                return;
            }

            let artwork = await Artwork.findById(req.params.id);

            if (!artwork) {
                res.status(404).send('Not Found');
                return;
            }

            let username = artwork.Artist;
            let user = await User.findOne({ username: username });

            if (user) {
                res.render("art", { artwork: artwork, session: req.session, user: user });
            } else {
                res.status(404).send('User not found');
            }
        } catch (error) {
            console.error('Error fetching artwork:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect("/account/login");
    }
});

router.post("/:id/like", async (req, res) => {

    if (req.session.user) {
        try {

            let artworkid = req.params.id;
            let userid = req.session.user._id;

            let user = await User.findById(userid);

            if (user.userlikes.includes(artworkid)) {
                res.redirect(`/art/${artworkid}`);
                return;
            }

            user.userlikes.push(artworkid);
            await user.save();

            let artwork = await Artwork.findById(artworkid);
            artwork.artlikes.push(userid.toString());
            await artwork.save();

            res.redirect(`/art/${artworkid}`);
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

router.post("/:id/unlike", async (req, res) => {

    if (req.session.user) {
        try {
            let artworkid = req.params.id;
            let userid = req.session.user._id;

            let user = await User.findById(userid);

            if (!(user.userlikes.includes(artworkid))) {
                res.redirect(`/art/${artworkid}`);
                return;
            }

            user.userlikes = user.userlikes.filter(id => id !== artworkid);
            await user.save();

            let artwork = await Artwork.findById(artworkid);
            artwork.artlikes = artwork.artlikes.filter(id => id !== userid.toString());
            await artwork.save();

            res.redirect('back');

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




router.post('/:id/review', async (req, res) => {
    if(!(req.session.user))
    {
        res.redirect("/account/login");
        return;
    }
    try {
        let artworkId = req.params.id;
        let userId = req.session.user._id;
        let reviewText = req.body.review;

        let user = await User.findById(userId);
        // Fetch the artwork
        let artwork = await Artwork.findById(artworkId);

        // Create the review
        let review = {
            user: userId.toString(),
            username: req.session.user.username,
            text: reviewText,
        };

        artwork.reviews.push(review);
        await artwork.save();

        res.redirect(`/art/${artworkId}`);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/:id/deletereview', async (req, res) => {
    if(!(req.session.user))
    {
        res.redirect("/account/login");
        return;
    }
    try {
        let artworkId = req.params.id;
        let userId = req.session.user._id;
        let reviewTextToDelete = req.body.reviewText; // Assuming you pass the review text in the request body

        // Find the artwork
        let artwork = await Artwork.findById(artworkId);

        // Check if the artwork exists
        if (!artwork) {
            res.status(404).send('Artwork not found');
            return;
        }

        // Find the index of the review in the artwork's reviews array
        let reviewIndex = artwork.reviews.findIndex(
            review => review.user === userId.toString() && review.text === reviewTextToDelete
        );

        // Check if the review exists
        if (reviewIndex === -1) {
            res.status(404).send('Review not found');
            return;
        }

        // Remove the review from the artwork's reviews array
        artwork.reviews.splice(reviewIndex, 1);

        // Save the updated artwork
        await artwork.save();

        res.redirect("back");
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
