const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const verifyToken = require('../utils/verifyToken');

const removeElement = require('../helpers/removeElementFromArray');

// POST ROUTES //
router.post('/post', verifyToken, [
    body('body', 'Text body is required').trim().isLength({ min: 1 }),
    body('body').escape()
], (req, res, next) =>{
    const errors = validationResult(req);

    if (!errors.isEmpty()){
        return res.status(403).json({ errors: errors.array() })
    }

    userData = req.authorizedData;

    let post = new Post({
        body: req.body.body,
        author: userData.username
    })

    post.save(function(err){
        if (err){ return res.status(500).json({ err })};
        return res.status(200).json({ success: 'Succesfully created the post' })
    })
})

router.get('/posts', verifyToken, (req, res) =>{
    Post.find({}).sort('-date')
        .exec(function(err, posts){
            if (err){ return res.status(403).json({ error: 'No posts found'})}
            res.json(posts);
        })
})

router.delete('/post/:postId', verifyToken, (req, res) =>{
    Post.findOneAndDelete({'_id': req.params.postId}, function deletePost(err){
        if (err){ return res.status(403).json({ error: 'Error deleting post' })};
        return res.status(200).json({ success: 'Succesfully deleted the post' })
    })
})

router.put('/post/:postId', verifyToken, [
    body('body', 'Text body is required').trim().escape().isLength({ min: 1 })
] ,(req, res) =>{
    Post.findById(req.params.postId, (err, post) =>{
        if (err){ return res.status(403).json({ err })};
        let tempPost = new Post({
            ...post,
            body: req.body.body,
            _id: req.params.postId
        })

        Post.findOneAndUpdate({'_id': req.params.postId}, tempPost, { useFindAndModify: false }, (err) =>{
            if (err){ return res.status(403).json({ error: 'Error updating post' })};
            return res.status(200).json({ success: 'Succesfully updated the post' })
        })
    })
})

// COMMENT ROUTES //
router.post('/post/:postId/comment', verifyToken, [
    body('body', 'Comment body is required').trim().escape().isLength({ min: 1 })
], (req, res)=>{
    Post.findById(req.params.postId, (err, post) =>{
        if (err){ return res.status(403).json({ err })};
        if (post){
            let tempComment = new Comment({
                body: req.body.body,
                author: req.authorizedData.username
            })

            tempComment.save(function(err, savedComment){
                if (err){ return res.status(403).json({ error: 'Error adding comment' })};
                let tempcomments = post.comments;
                tempcomments.push(savedComment._id);
                let tempPost = new Post({
                    ...post,
                    comments: tempcomments,
                    _id: req.params.postId
                })

                Post.findOneAndUpdate({'_id': req.params.postId}, tempPost, { useFindAndModify: false }, (err) =>{
                    if (err){ return res.status(403).json({ error: 'Error adding comment' })};
                    return res.status(200).json({ sucess: 'Added the comment'})
                })
            })
        }else{
            return res.status(403).json({ error: 'Post not found!' })
        }
    })
})

router.delete('/post/:postId/comment/:commentId', verifyToken,
    (req, res) =>{
        Comment.findOneAndDelete({'_id': req.params.commentId}, function deleteComment(err){
            Post.findById(req.params.postId, (err, post) =>{
                let commentsToBeDeleted = post.comments;
                let commentsDeleted = removeElement(commentsToBeDeleted, req.params.commentId);
                let tempPost = new Post({
                    ...post,
                    comments: commentsDeleted,
                    _id: req.params.postId
                })
                Post.findOneAndUpdate({'_id': req.params.postId}, tempPost, { useFindAndModify: false }, (err) =>{
                    if (err){ return res.status(403).json({ error: 'Error deleting comment', err })};
                    return res.status(200).json({ success: 'Succesfully deleted the comment' })
                })
            })
        })
})

// LIKE ROUTES //
router.post('/post/:postId/like', verifyToken, (req, res) =>{
    Post.findById(req.params.postId, (err, post) =>{
        post.likes++;
        let tempPost = new Post({
            ...post,
            likes: post.likes++,
            _id: req.params.postId
        })
        Post.findOneAndUpdate({'_id': req.params.postId}, tempPost, { useFindAndModify: false }, (err) =>{
            if (err){ return res.status(403).json({ error: 'Error liking post' })};
            return res.status(200).json({ success: 'Succesfully liked the post' })
        })
    })
})

router.post('/post/:postId/unlike', verifyToken, (req, res) =>{
    Post.findById(req.params.postId, (err, post) =>{
        post.likes--;
        let tempPost = new Post({
            ...post,
            likes: post.likes--,
            _id: req.params.postId
        })
        Post.findOneAndUpdate({'_id': req.params.postId}, tempPost, { useFindAndModify: false }, (err) =>{
            if (err){ return res.status(403).json({ error: 'Error unliking post' })};
            return res.status(200).json({ success: 'Succesfully unliked the post' })
        })
    })
})

module.exports = router;
