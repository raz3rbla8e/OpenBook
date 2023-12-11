const express = require('express');
const router = express.Router();
const Artwork = require('./artModel');
const User = require('./userModel');
const mongoose = require('mongoose');

let globalSearchCriteria = {}

// Route for displaying notifications
router.get("/notif", async (req, res) => {
    // Redirect to login page if user is not logged in
    if (!(req.session.user)) {
        res.redirect("/account/login");
        return;
    }

    // get user from database
    const user = await User.findById(req.session.user._id);

    // Update session with user's notifications
    req.session.user.notifications = user.notifications;

    // Render the notifications page with session data
    res.render("notif", { session: req.session });
});

// Route for joining a workshop
router.post('/work/:id/join', async (req, res) => {
    try {
        const workshopId = req.params.id;

        if(mongoose.Types.ObjectId.isValid(workshopId) === false) {
            return res.redirect("/")
        }

        // Check if the user is logged in
        if (!req.session.user) {
            return res.redirect('/account/login');
        }

        // Find the workshop
        const workshop = await User.findOne({ 'workshops._id': workshopId });
        if (!workshop) {
            return res.redirect('/account/dashboard');
        }

        // Check if the user is the host or already a participant
        if (
            workshop.host === req.session.user.username ||
            (workshop.participants && workshop.participants.includes(req.session.user.username))
        ) {
            return res.redirect('/account/dashboard'); // User is already a participant or the host
        }

        // Add the user to the participants array
        workshop.workshops.id(workshopId).participants.push(req.session.user.username);
        await workshop.save();

        res.status(200).send('Successfully joined workshop');
    } catch (error) { 
        console.error('Error joining workshop:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for leaving a workshop
router.delete('/work/:id/leave', async (req, res) => {
    try {
        const workshopId = req.params.id;

        if(mongoose.Types.ObjectId.isValid(workshopId) === false) {
            return res.redirect("/")
        }
        // Find the user with the workshop
        const user = await User.findOne({ 'workshops._id': workshopId });

        if (!user) {
            // Workshop or user not found
            res.redirect('/account/dashboard');
            return;
        }

        // Find the workshop in the user's workshops array
        const workshopIndex = user.workshops.findIndex(w => w._id.toString() === workshopId);

        if (workshopIndex === -1) {
            // Workshop not found
            res.redirect('/account/dashboard');
            return;
        }

        // Remove the user from the participants array
        const userIndex = user.workshops[workshopIndex].participants.indexOf(req.session.user.username);
        if (userIndex !== -1) {
            user.workshops[workshopIndex].participants.splice(userIndex, 1);
        }

        // Save the updated user object to the database
        await user.save();

        res.status(200).send('Successfully left workshop');
    } catch (error) {
        console.error('Error leaving workshop:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for displaying workshop details
router.get('/work/:id', async (req, res) => {
    try {
        const workshopId = req.params.id;
        if(mongoose.Types.ObjectId.isValid(workshopId) === false) {
            return res.redirect("/")
        }
        // Validate if workshopId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(workshopId)) {
            res.redirect('/account/dashboard');
            return;
        }

        // Find the user with the workshop
        const user = await User.findOne({ 'workshops._id': workshopId });

        if (!user) {
            // Workshop or user not found
            res.redirect('/account/login');
            return;
        }

        // Find the workshop in the user's workshops array
        const workshop = user.workshops.find(w => w._id.equals(mongoose.Types.ObjectId.createFromHexString(workshopId)));

        if (!workshop) {
            res.redirect("/account/dashboard");
            return;
        }

        // Render the workshop details page
        res.render('work', { workshop, session: req.session });
    } catch (error) {
        console.error('Error fetching workshop details:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for adding a new workshop
router.get("/addWork", async function (req, res) {
    if (req.session.user) {
        res.render("addWork", { session: req.session });
    } else {
        res.redirect("/account/login");
    }
});

router.post('/addWork', async (req, res) => {
    if(!(req.session.user)) {
        res.redirect("/account/login");
        return;
    }
    try {
        //get the user
        let curruser = await User.findById(req.session.user._id);

        if (!curruser) {
            // Handle the case where the user is not logged in
            res.redirect('/account/login');
            return;
        }

        let { title, location, date } = req.body;

        // Create a new workshop object
        let newWorkshop = {
            title,
            host: curruser.username,
            location,
            date,
            hostid: curruser._id.toString(),
        };

        // Add the workshop to the user's workshops array
        curruser.workshops.push(newWorkshop);

        // Save the updated user object to the database
        await curruser.save();

        let addedWorkshop = curruser.workshops.find(workshop => workshop.title === title);

        // Create a notification for the workshop
        let typeofid = "work".toString();

        if (curruser.followedBy) {
            let followers = curruser.followedBy;
            let notif = {
                idofnot: addedWorkshop._id,
                artist: curruser.username, 
                for: typeofid,
            };

            for (let followid of followers) {
                let follower = await User.findById(followid);
                if (follower) {
                    follower.notifications.push(notif);
                    await follower.save();
                }
            }
        }

        // Redirect the user to their dashboard or any other relevant page
        res.redirect(`/account/dashboard`);
    } catch (error) {
        console.error('Error adding workshop:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for displaying home page
router.get("/home", async function (req, res) {
    if (req.session.user) {
        try {


            //paginatoin stuff
            let allart = await Artwork.find();

            let pageSize = 5;
            let totalPages = Math.ceil(allart.length / pageSize);
            let currentPage = parseInt(req.query.page) || 1;
            let startIndex = (currentPage - 1) * pageSize;
            let endIndex = startIndex + pageSize;

            // Send only the artworks for the current page
            let artworksForPage = allart.slice(startIndex, endIndex);

            // Render the home page with the artworks for the current page
            res.render('home', { artworks: artworksForPage, totalPages, currentPage, session: req.session });
        } catch (error) {
            console.error('Error fetching random artworks:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect("/account/login");
    }
});

// Route for adding a new artwork
router.get("/addArt", async function (req, res) {
    if(req.session.user) {
        res.render("addArt", { session: req.session });
    } else {
        res.redirect("/account/login");
    }
});

router.post('/addArt', async (req, res) => {
    if(!(req.session.user)) {
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

        let existingArtwork = await Artwork.findOne({ Title: title });
        if (existingArtwork) {
            return res.render("addArt", { error: true, errortype: 'Artwork with this title already exists' , session: req.session});
        }

        let artist = req.session.user.username;

        // Create a new Artwork model
        let artwork = new Artwork({
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
        let artistUser = await User.findOne({ username: artist });

        if (artistUser) {
            artistUser.artworks.push(artwork._id);
            await artistUser.save();
        }


        //add the notif to all followers
        let typeofid = "art".toString();

        if(artistUser.followedBy) {
            let followers = artistUser.followedBy;

            let notif = {
                idofnot: artwork._id,
                artist: artist,
                for:typeofid,
            };

            for(let followid of followers) {
                let follower = await User.findById(followid);
                if(follower) {
                    follower.notifications.push(notif);
                    await follower.save();
                }
            }
        }

        // Redirect to the artwork page
        res.redirect(`/art/${artwork._id}`);
    } catch (error) {
        console.error('Error adding artwork:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for searching artworks
router.get('/search', async (req, res) => {
    if(!(req.session.user)) {
        res.redirect("/account/login");
        return;
    }
    try {
        let page = parseInt(req.query.page) || 1;
        let perPage = 10;
        let skip = (page - 1) * perPage;

        let searchResults = await Artwork.find(globalSearchCriteria).skip(skip).limit(perPage);

        let totalArtworks = await Artwork.countDocuments(globalSearchCriteria);
        let totalPages = Math.ceil(totalArtworks / perPage);

        res.render('search', { searchResults, totalPages, currentPage: page, session: req.session });
    } catch (error) {
        console.error('Error rendering search page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for handling search form submission
router.post('/search', async (req, res) => {
    if(!(req.session.user)) {
        res.redirect("/account/login");
        return;
    }
    try {
        let searchInput = req.body.searchInput.toLowerCase();

        globalSearchCriteria = {
            $or: [
                { Title: { $regex: searchInput, $options: 'i' } },
                { Artist: { $regex: searchInput, $options: 'i' } },
                { Category: { $regex: searchInput, $options: 'i' } },
                { Medium: { $regex: searchInput, $options: 'i' } }
            ]
        };

        res.redirect("/main/search");
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;