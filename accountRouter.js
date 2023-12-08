const express = require('express');
const router = express.Router();
const User = require('./userModel');


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
        };

        res.redirect('/account/dashboard');
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

    let user = new User({ username, password });
    await user.save();
    res.render("login");
});

router.get("/dashboard", async (req, res) => {
    if (req.session.user) {
        res.render("dashboard", { session: req.session });
    }
    else {
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


module.exports = router;
