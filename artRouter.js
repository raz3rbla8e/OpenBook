const express = require('express');
const router = express.Router();
const Artwork = require('./artModel');
const User = require('./userModel');
const mongoose = require('mongoose');

// Route to fetch and render artwork details
router.get("/:id", async function (req, res) {
    if (req.session.user) {
        try {
            // Check if the provided ID is valid
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                res.redirect('/main')
                return;
            }

            // Find the artwork by ID
            let artwork = await Artwork.findById(req.params.id);

            // If artwork not found, return 404
            if (!artwork) {
                res.status(404).send('Not Found');
                return;
            }

            // Find the user associated with the artwork
            let username = artwork.Artist;
            let user = await User.findOne({ username: username });

            // If user found, render the artwork details page
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

// Route to handle liking an artwork
router.post("/:id/like", async (req, res) => {
    if (req.session.user) {
        try {
            let artworkid = req.params.id;


            if(mongoose.Types.ObjectId.isValid(artworkid) === false) {
                return res.redirect("/")
            }
            let userid = req.session.user._id;

            // Find the user by ID
            let user = await User.findById(userid);

            // If user has already liked the artwork, redirect back to artwork details page
            if (user.userlikes.includes(artworkid)) {
                res.redirect(`/art/${artworkid}`);
                return;
            }

            // Add the artwork ID to the user's liked artworks
            user.userlikes.push(artworkid);
            await user.save();

            // Find the artwork by ID
            let artwork = await Artwork.findById(artworkid);

            // Add the user ID to the artwork's liked users
            artwork.artlikes.push(userid.toString());
            await artwork.save();

            res.redirect(`/art/${artworkid}`);
        } catch (error) {
            console.error('Error fetching artwork:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect("/account/login");
    }
});

// Route to handle unliking an artwork
router.post("/:id/unlike", async (req, res) => {
    if (req.session.user) {
        try {
            let artworkid = req.params.id;
            
            if(mongoose.Types.ObjectId.isValid(artworkid) === false) {
                return res.redirect("/")
            }

            let userid = req.session.user._id;

            // Find the user by ID
            let user = await User.findById(userid);

            // If user has not liked the artwork, redirect back to artwork details page
            if (!(user.userlikes.includes(artworkid))) {
                res.redirect(`/art/${artworkid}`);
                return;
            }

            // Remove the artwork ID from the user's liked artworks
            user.userlikes = user.userlikes.filter(id => id !== artworkid);
            await user.save();

            // Find the artwork by ID
            let artwork = await Artwork.findById(artworkid);

            // Remove the user ID from the artwork's liked users
            artwork.artlikes = artwork.artlikes.filter(id => id !== userid.toString());
            await artwork.save();

            res.redirect('back');
        } catch (error) {
            console.error('Error fetching artwork:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect("/account/login");
    }
});

// Route to handle creating a review for an artwork
router.post('/:id/review', async (req, res) => {
    if (!(req.session.user)) {
        res.redirect("/account/login");
        return;
    }
    try {
        let artworkId = req.params.id;
        
        if(mongoose.Types.ObjectId.isValid(artworkId) === false) {
            return res.redirect("/")
        }
        let userId = req.session.user._id;
        let reviewText = req.body.review;

        // Find the user by ID
        let user = await User.findById(userId);

        // Find the artwork by ID
        let artwork = await Artwork.findById(artworkId);

        // Create the review object
        let review = {
            user: userId.toString(),
            username: req.session.user.username,
            text: reviewText,
        };

        // Add the review to the artwork's reviews array
        artwork.reviews.push(review);
        await artwork.save();

        res.redirect(`/art/${artworkId}`);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle deleting a review for an artwork
router.post('/:id/deletereview', async (req, res) => {
    if (!(req.session.user)) {
        res.redirect("/account/login");
        return;
    }
    try {
        let artworkId = req.params.id;
        if(mongoose.Types.ObjectId.isValid(artworkId) === false) {
            return res.redirect("/")
        }
        let userId = req.session.user._id;
        let reviewTextToDelete = req.body.reviewText;

        // Find the artwork by ID
        let artwork = await Artwork.findById(artworkId);

        // If artwork not found, return 404
        if (!artwork) {
            res.status(404).send('Artwork not found');
            return;
        }

        // Find the index of the review in the artwork's reviews array
        let reviewIndex = artwork.reviews.findIndex(
            review => review.user === userId.toString() && review.text === reviewTextToDelete
        );

        // If review not found, return 404
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

