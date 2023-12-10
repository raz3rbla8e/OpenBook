const express = require('express');
const router = express.Router();
const Artwork = require('./artModel');
const User = require('./userModel');
const mongoose = require('mongoose');



router.get("/home", async function (req, res) {

    if (req.session.user) {
        try {

            
            let allart = await Artwork.find();

            let pageSize = 5;
            let totalPages = Math.ceil(allart.length / pageSize);
            let currentPage = parseInt(req.query.page) || 1;
            let startIndex = (currentPage - 1) * pageSize;
            let endIndex = startIndex + pageSize;

            // Send only the artworks for the current page
            const artworksForPage = allart.slice(startIndex, endIndex);

            // Render the Pug file with the artworks for the current page
            res.render('home', { artworks: artworksForPage, totalPages, currentPage, session: req.session });
        } catch (error) {
            console.error('Error fetching random artworks:', error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.redirect("/account/login");
    }

});

// router.get("/search", async function (req, res) {
//     if(req.session.user)
//     {
//         let searchResults = [];
//         res.render("search", { session: req.session, searchResults: searchResults });
//     }
//     else
//     {
//         res.redirect("/account/login");
//     }
    
//  });
router.get('/search', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    res.render('search', { searchResults: [], totalPages: 1, currentPage: page, session: req.session});
  } catch (error) {
    console.error('Error rendering search page:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/search', async (req, res) => {
  try {
    const searchInput = req.body.searchInput.toLowerCase(); // Convert to lowercase for case-insensitive search
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 10;

    // Example: Search by Title, Artist, Category, and Medium
    const searchResults = await Artwork.find({
      $or: [
        { Title: { $regex: searchInput, $options: 'i' } },
        { Artist: { $regex: searchInput, $options: 'i' } },
        { Category: { $regex: searchInput, $options: 'i' } },
        { Medium: { $regex: searchInput, $options: 'i' } }
      ]
    })
      .skip(skip)
      .limit(10);

    // Calculate total number of pages
    const totalArtworks = await Artwork.countDocuments({
      $or: [
        { Title: { $regex: searchInput, $options: 'i' } },
        { Artist: { $regex: searchInput, $options: 'i' } },
        { Category: { $regex: searchInput, $options: 'i' } },
        { Medium: { $regex: searchInput, $options: 'i' } }
      ]
    });
    const totalPages = Math.ceil(totalArtworks / 10);

    res.render('search', { searchResults, totalPages, currentPage: page , session: req.session });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get("/addArt", async function (req, res) {
    if(req.session.user)
    {
        res.render("addArt", {session : req.session});
    }
    else
    {
        res.redirect("/account/login");
    
    }
});

router.post('/addArt', async (req, res) => {
    if(!(req.session.user))
    {
        res.redirect("/account/login");
        return;
    }
    try {
        // Extract artwork information from the request body
        let { title, year, category, medium, description, poster } = req.body;

        // Check if any required field is missing
        if (!title || !year || !category || !medium || !description || !poster) {
            return res.render("addArtwork", { error: true, errortype: 'Please fill in all fields' });
        }

        const existingArtwork = await Artwork.findOne({ Title: title });
        if (existingArtwork) {
            return res.render("addArt", { error: true, errortype: 'Artwork with this title already exists' , session: req.session});
        }

        let artist = req.session.user.username;

        // Create a new Artwork model
        const artwork = new Artwork({
            Title: title,
            Artist: artist,
            Year: year,
            Category: category,
            Medium: medium,
            Description: description,
            Poster: poster
        });

        // Save the artwork to the database
        await artwork.save();

        // Update the artist's user object with the new artwork ID
        const artistUser = await User.findOne({ username: artist });

        if (artistUser) {
            artistUser.artworks.push(artwork._id);
            await artistUser.save();
        }

        // Redirect to a success page or any other desired route
        res.redirect(`/main/home`);
    } catch (error) {
        console.error('Error adding artwork:', error);
        res.status(500).send('Internal Server Error');
    }
});



router.get("/art/:id", async function (req, res) {
    if (req.session.user) {
        try {

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                res.status(404).send('Not Found');
                return;
            }

            const artwork = await Artwork.findById(req.params.id);

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
            artwork.artlikes.push(userid.toString());
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

router.post("/art/:id/unlike", async (req, res) => {

    if (req.session.user) {
        try {
            let artworkid = req.params.id;
            let userid = req.session.user._id;

            const user = await User.findById(userid);

            if (!(user.userlikes.includes(artworkid))) {
                res.redirect(`/main/art/${artworkid}`);
                return;
            }

            user.userlikes = user.userlikes.filter(id => id !== artworkid);
            await user.save();

            const artwork = await Artwork.findById(artworkid);
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



            user.following.push(artist._id.toString());
            await user.save();

            artist.followedBy.push(user._id.toString());
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

router.post("/user/:id/unfollow", async (req, res) => {
    if (req.session.user) {
        try {
            let artistid = req.params.id;
            let userid = req.session.user._id;

            const artist = await User.findById(artistid);
            const user = await User.findById(userid);

            if (!user.following.includes(artistid)) {
                res.redirect(`/main/user/${artistid}`);
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


router.get("/user/:id", async (req, res) => {
    if (!req.session.user) {
        res.redirect("/account/login");
        return;
    }
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

    let reviews = [];

    const theirReviews = await Artwork.find({ 'reviews.user':user._id });

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




router.post('/art/:id/review', async (req, res) => {
    if(!(req.session.user))
    {
        res.redirect("/account/login");
        return;
    }
    try {
        const artworkId = req.params.id;
        const userId = req.session.user._id;
        const reviewText = req.body.review;

        const user = await User.findById(userId);
        // Fetch the artwork
        const artwork = await Artwork.findById(artworkId);

        // Create the review
        const review = {
            user: userId.toString(),
            username: req.session.user.username,
            text: reviewText,
        };

        artwork.reviews.push(review);
        await artwork.save();

        res.redirect(`/main/art/${artworkId}`);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/art/:id/deletereview', async (req, res) => {
    if(!(req.session.user))
    {
        res.redirect("/account/login");
        return;
    }
    try {
        const artworkId = req.params.id;
        const userId = req.session.user._id;
        const reviewTextToDelete = req.body.reviewText; // Assuming you pass the review text in the request body

        // Find the artwork
        const artwork = await Artwork.findById(artworkId);

        // Check if the artwork exists
        if (!artwork) {
            res.status(404).send('Artwork not found');
            return;
        }

        // Find the index of the review in the artwork's reviews array
        const reviewIndex = artwork.reviews.findIndex(
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






module.exports = router;