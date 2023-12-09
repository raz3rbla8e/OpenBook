const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String, default: 'qwerty' },
    type: { type: String, default: 'patron' },
    artworks: [],
    following: [],
    followedBy: [],
    loggedIn: { type: Boolean, default: false },
    userlikes: []
});



const User = mongoose.model('User', userSchema);
module.exports = User;