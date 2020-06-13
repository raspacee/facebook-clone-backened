const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const FriendSchema = new Schema({
    isFriend: {type: Boolean, default: false},
    adder: {type: Schema.Types.ObjectId, required: true},
    accepter: {type: Schema.Types.ObjectId, required: true}
});

//Export model
module.exports = mongoose.model('friend', FriendSchema);
