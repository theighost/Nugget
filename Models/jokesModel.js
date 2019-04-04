const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jokeModelSchema = new Schema({
    user: String,
    ip: String,
    timestamp: Number,
});

const joke = mongoose.model('jokes', jokeModelSchema);

module.exports = joke;