const express = require('express');
const router = express.Router();
const User = require('./userModel');
const Artwork = require('./artModel');


router.get("/login", async (req, res) => {
    res.render("login");
});

router.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    try {
        const user = await User.findOne({ username, password });

        if (!user) {
            return res.render('login', { error: true, errortype: 'Invalid username or password' });
        }

        if (user.loggedIn === true) {
            return res.render('login', { error: true, errortype: 'User already logged in' });
        }

        user.loggedIn = true;
        await user.save();

        req.session.user = {
            _id: user._id,
            username: user.username,
            type: user.type,
            loggedIn: true,
            artworks: user.artworks,

        };

        res.redirect('/main/home');

    } catch (error) {
        res.render("login", { invaliderror: true });
    }
});


router.get("/register", async (req, res) => {
    res.render("register");
});

router.post('/register', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    let existingUser = await User.findOne({ username });

    if (existingUser) {
        return res.render('register', { error: true, errortype: 'Username already exists' });
    }

    let user = new User({ username, password })

    try {
        user.loggedIn = true;
        await user.save();

        req.session.user = {
            _id: user._id,
            username: user.username,
            type: user.type,
            loggedIn: true,
            artworks: user.artworks,
        }
        res.redirect('/main/home');
    } catch (error) {
        // Handle any errors that occur during user creation
        res.render('register', { error: true, errortype: 'Error creating user' });
    }
});

router.get("/dashboard", async (req, res) => {
    if (req.session.user) {
        try {
            // Fetch the user object from the database
            const user = await User.findById(req.session.user._id);

            if (user) {
                // Get artist object IDs from the user object
                const artistIds = user.following;
                const userhasliked = user.userlikes;
                req.session.user.likes = [];
                for (let artid of userhasliked) {
                    let artstuff = await Artwork.findById(artid);
                    if (artstuff) {
                        req.session.user.likes.push(artstuff);
                    }
                }

                const userfollowedby = user.followedBy;
                req.session.user.followedby = [];
                for (let userid of userfollowedby) {
                    let userstuff = await User.findById(userid);
                    if (userstuff) {
                        req.session.user.followedby.push(userstuff);
                    }
                }

                const theartworks = user.artworks;
                const artworksobj = await Artwork.find({ _id: { $in: theartworks } });

                // Find all the artists from the IDs
                const artists = await User.find({ _id: { $in: artistIds } });

                req.session.user.following = artists;

                req.session.user.reviews = [];

                const userReviews = await Artwork.find({ 'reviews.user': req.session.user._id });

                for(let review of userReviews){
                    req.session.user.reviews.push(
                        {
                            artwork: review.Title,
                            artworkid: review._id.toString(),
                            text: review.reviews.find(rev => rev.user === req.session.user._id.toString()).text
                        }
                    )
                }

                res.render("dashboard", { session: req.session, artworks: artworksobj });
            } else {
                // Handle the case where the user object is not found
                console.error('User not found in the database');
                res.redirect("/account/login");
            }
        } catch (error) {
            console.error('Error fetching user and following artists:', error);
            res.redirect("/account/login");
        }
    } else {
        res.redirect("/account/login");
    }
});


router.get("/logout", async (req, res) => {
    try {
        if (req.session.user && req.session.user.loggedIn) {
            const user = await User.findById(req.session.user._id);

            if (user) {
                user.loggedIn = false;
                await user.save();
            }

            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                } else {
                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.redirect('/');
    }
});

router.get("/switch", async (req, res) => {
    if (req.session.user) {
        try {
            let userid = req.session.user._id;

            const user = await User.findById(userid);

            usertype = user.type;

            res.render("switch", { usertype: usertype, session: req.session })
        } catch (error) {
            console.error('Error fetching artists:', error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.redirect("/account/login");
    }

});

router.post("/switch", async (req, res) => {
    
    try {
        if (req.session.user) {
            if (req.session.user.type === "patron") {
                if (req.session.user.artworks.length > 0) {
                    const user = await User.findById(req.session.user._id);

                    if (user) {
                        user.type = "artist";
                        await user.save();
                        req.session.user.type = "artist";
                        res.redirect("/account/dashboard");
                    }
                    else {
                        res.status(404).send('User not found');
                    }
                }
                else {
                    let title = req.body.title
                    let year = req.body.year
                    let category = req.body.category
                    let medium = req.body.medium
                    let description = req.body.description
                    let poster = req.body.poster

                    if (!title || !year || !category || !medium || !description || !poster) {
                        res.render("switch", { error: true, errortype: 'Please fill in all fields', session: req.session })
                    }

                            // Check if the title already exists in the database
                    const existingArtwork = await Artwork.findOne({ Title: title });
                    if (existingArtwork) {
                        return res.render("switch", { error: true, errortype: 'Artwork with this title already exists', session: req.session });
                    }

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

                    const user = await User.findById(req.session.user._id);

                    if (user) {
                        user.type = "artist";
                        user.artworks.push(artwork._id);
                        await user.save();
                        req.session.user.type = "artist";
                        req.session.user.artworks.push(artwork._id);
                        res.redirect("/account/dashboard");
                    }
                    else {
                        res.status(404).send('User not found');
                    }
                }

            } else if (req.session.user.type === "artist") {

                const user = await User.findById(req.session.user._id);

                if (user) {
                    user.type = "patron";
                    await user.save();
                    req.session.user.type = "patron";
                    res.redirect("/account/dashboard");
                } else {
                    res.status(404).send('User not found');
                }
            }
        } else {
            res.redirect("/account/login");
        }
    } catch (error) {
        console.error('Error switching account:', error);
        res.status(500).send('Internal Server Error');
    }
});




module.exports = router;
