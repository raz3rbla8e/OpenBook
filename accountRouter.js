const express = require('express');
const router = express.Router();
const User = require('./userModel');

router.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    let user = await User.findOne({ username, password });

    if (user) {
        res.render("home");
    }
    else {
        let error = true
        res.render("login", { error });
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
    res.render("account");
});

module.exports = router;
