const express = require('express');
const router = express.Router();
const User = require('./userModel');
const Artwork = require('./artModel');

//login page
router.get("/login", async (req, res) => {
    res.render("login");
});

router.post('/login', async (req, res) => {
    //get info from the body
    let username = req.body.username;
    let password = req.body.password;

    try {
        //does basic validation 
        let user = await User.findOne({ username, password });
        if (!user) {
            return res.status(400).render('login', { error: true, errortype: 'Invalid username or password' });
        }

        if (user.loggedIn === true) {
            return res.status(400).render('login', { error: true, errortype: 'User already logged in' });
        }

        //set the user to logged in in the datbase
        user.loggedIn = true;
        await user.save();
        //create a session for the user with important information
        req.session.user = {
            _id: user._id,
            username: user.username,
            type: user.type,
            loggedIn: true,
            artworks: user.artworks,
        };

        //redirect to the home page
        res.status(200).redirect('/main/home');

        } catch (error) {
            res.status(500).render("login", { invaliderror: true });
        }
        });

        //renders the register page
        router.get("/register", async (req, res) => {
            res.status(200).render("register");
        });

        router.post('/register', async (req, res) => {
            //gets information from the body
            let username = req.body.username;
            let password = req.body.password;

            //checks if the existing user exists with the same username
            let existingUser = await User.findOne({ username });

            if (existingUser) {
                return res.status(400).render('register', { error: true, errortype: 'Username already exists' });
            }

            //creates a new user
            let user = new User({ username, password })

            try {
                //loggs the user in as well as creates a session,
                user.loggedIn = true;
                await user.save();

                req.session.user = {
                    _id: user._id,
                    username: user.username,
                    type: user.type,
                    loggedIn: true,
                    artworks: user.artworks,
                }

                //redirects home
                res.status(200).redirect('/main/home');
            } catch (error) {
                // Handle any errors that occur during user creation
                res.status(500).render('register', { error: true, errortype: 'Error creating user' });
            }
        });

        router.get("/dashboard", async (req, res) => {
            //from now on, every request will first check if the user is logged in, adn will direct the to login page if they are not
            if (req.session.user) {
                try {
                    // get the user object from the database
                    let user = await User.findById(req.session.user._id);

                    if (user) {
                        // Get artist object IDs from the user object to update the users likes
                        let artistIds = user.following;
                        let userhasliked = user.userlikes;
                        req.session.user.likes = [];
                        for (let artid of userhasliked) {
                            let artstuff = await Artwork.findById(artid);
                            if (artstuff) {
                                req.session.user.likes.push(artstuff);
                            }
                        }

                        //gets all the users that follow the current user
                        let userfollowedby = user.followedBy;
                        req.session.user.followedby = [];
                        for (let userid of userfollowedby) {
                            let userstuff = await User.findById(userid);
                            if (userstuff) {
                                req.session.user.followedby.push(userstuff);
                            }
                        }

                        let theartworks = user.artworks;
                        let artworksobj = await Artwork.find({ _id: { $in: theartworks } });

                        // Find all the artists from the IDs
                        let artists = await User.find({ _id: { $in: artistIds } });

                        //gets the artists that the user follows
                        req.session.user.following = artists;

                        //sets up all the reviews that the user has posted
                        req.session.user.reviews = [];
                        let userReviews = await Artwork.find({ 'reviews.user': req.session.user._id });
                        for(let review of userReviews){
                            req.session.user.reviews.push(
                                {
                                    artwork: review.Title,
                                    artworkid: review._id.toString(),
                                    text: review.reviews.find(rev => rev.user === req.session.user._id.toString()).text
                                }
                            )
                        }

                        //gets all the workshop sthe user as created
                        req.session.user.workshops = user.workshops

                        //sets up all the workshops the user is enrolled in
                        let participatingWorkshops = await User.find({ 'workshops.participants': req.session.user.username });
                        req.session.user.participatingWorkshops = [];

                        participatingWorkshops.forEach(user => {
                        user.workshops.forEach(workshop => {
                            req.session.user.participatingWorkshops.push({
                            _id: workshop._id,
                            title: workshop.title,
                            });
                        });
                        });

                        //renders the dashboard pug with all the information eeded
                        res.status(200).render("dashboard", { session: req.session, artworks: artworksobj });
                    } else {
                        // Handle the case where the user object is not found
                        console.error('User not found in the database');
                        res.status(404).redirect("/account/login");
                    }
                } catch (error) {
                    console.error('Error fetching user and following artists:', error);
                    res.status(500).redirect("/account/login");
                }
            } else {
                res.status(401).redirect("/account/login");
            }
        });


        router.get("/logout", async (req, res) => {
            try {
                //makes sure the user is logged in
                if (req.session.user && req.session.user.loggedIn) {
                    //gets the user obj
                    let user = await User.findById(req.session.user._id);

                    if (user) {
                        //logges out the user and saves it
                        user.loggedIn = false;
                        await user.save();
                    }


                    //destroys the session for the user
                    req.session.destroy((err) => {
                        if (err) {
                            console.error('Error destroying session:', err);
                        } else {
                            res.status(200).redirect('/');
                        }
                    });
                } else {
                    res.status(401).redirect('/');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                res.status(500).redirect('/');
            }
        });

        router.get("/switch", async (req, res) => {
            //checks to see if the user logs in
            if (req.session.user) {
                try {

                    //gets the user
                    let userid = req.session.user._id;
                    let user = await User.findById(userid);
                    let usertype = user.type;
                    //renders the switch page
                    res.status(200).render("switch", { usertype: usertype, session: req.session })
                } catch (error) {
                    console.error('Error fetching artists:', error);
                    res.status(500).send('Internal Server Error');
                }
            }
            else {
                res.status(401).redirect("/account/login");
            }

        });

        router.post("/switch", async (req, res) => {
            
            try {
                if (req.session.user) {

                    //if the user is a patron, do the switch to an artist
                    if (req.session.user.type === "patron") {
                        //if the user has already created an artwork, just switch the type
                        if (req.session.user.artworks.length > 0) {
                            let user = await User.findById(req.session.user._id);

                            if (user) {
                                user.type = "artist";
                                await user.save();
                                req.session.user.type = "artist";
                                res.status(200).redirect("/account/dashboard");
                            }
                            else {
                                res.status(404).send('User not found');
                            }
                        }
                        //if the user has not created an artwork, create one and then switch the type
                        else {
                            let title = req.body.title
                            let year = req.body.year
                            let category = req.body.category
                            let medium = req.body.medium
                            let description = req.body.description
                            let poster = req.body.poster

                            if (!title || !year || !category || !medium || !description || !poster) {
                                res.status(400).render("switch", { error: true, errortype: 'Please fill in all fields', session: req.session })
                            }

                            // Check if the title already exists in the database
                            let existingArtwork = await Artwork.findOne({ Title: title });
                            if (existingArtwork) {
                                return res.status(400).render("switch", { error: true, errortype: 'Artwork with this title already exists', session: req.session });
                            }


                            //creates the artwork and saves to the database
                            let artist = req.session.user.username;
                            
                            let artwork = new Artwork({
                                Title: title,
                                Artist: artist,
                                Year: year,
                                Category: category,
                                Medium: medium,
                                Description: description,
                                Poster: poster
                            });
                            await artwork.save();


                            //updates the user with the information
                            let user = await User.findById(req.session.user._id);

                            if (user) {
                                user.type = "artist";
                                user.artworks.push(artwork._id);
                                await user.save();
                                req.session.user.type = "artist";
                                req.session.user.artworks.push(artwork._id);
                                res.status(200).redirect("/account/dashboard");
                            }
                            else {
                                res.status(404).send('User not found');
                            }
                        }
                    //if the user is an artist, just simply switches them to a patron
                    } else if (req.session.user.type === "artist") {

                        let user = await User.findById(req.session.user._id);

                        if (user) {
                            user.type = "patron";
                            await user.save();
                            req.session.user.type = "patron";
                            res.status(200).redirect("/account/dashboard");
                        } else {
                            res.status(404).send('User not found');
                        }
                    }
                } else {
                    res.status(401).redirect("/account/login");
                }
            } catch (error) {
                console.error('Error switching account:', error);
                res.status(500).send('Internal Server Error');
            }
        });




        module.exports = router;
