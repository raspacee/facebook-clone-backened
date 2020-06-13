const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    body: {type: String, max: 300, required: true},
    author: {type: String, required: true},
    createdOn: {type: Date, default: Date.now()}
});

CommentSchema
.virtual('createdOnFormatted')
.get(function(){
    return moment().from(this.createdOn)
})

//Export model
module.exports = mongoose.model('comment', CommentSchema);
