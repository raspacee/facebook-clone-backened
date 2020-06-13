const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    body: {type: String, max: 500, required: true},
    author: {type: String, required: true},
    likes: {type: Number, default: 0},
    comments: [{type: Schema.Types.ObjectId}],
    createdOn: {type: Date, default: Date.now()}
});

// Virtual for book's URL
PostSchema
.virtual('url')
.get(function () {
  return '/posts/' + this._id;
});

PostSchema
.virtual('createdOnFormatted')
.get(function(){
    return moment().from(this.createdOn)
})

//Export model
module.exports = mongoose.model('post', PostSchema);
