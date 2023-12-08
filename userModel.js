const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String, default: 'qwerty' },
    type: { type: String, default: 'patron' },
    artworks: [],
    loggedIn: { type: Boolean, default: false }
});



const User = mongoose.model('User', userSchema);
module.exports = User;