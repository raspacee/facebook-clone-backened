const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {type: String, max: 50, required: true},
    username: {type: String, max: 60, required: true},
    hashedPassword: {type: String, max: 60, required: true},
    friends: [{type: Schema.Types.ObjectId}],
    profilePicture: String
});

// Virtual for book's URL
UserSchema
.virtual('url')
.get(function () {
  return '/users/' + this._id;
});

//Export model
module.exports = mongoose.model('user', UserSchema);
