const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verifyToken = require('../utils/verifyToken');
const User = require('../models/user');
const Friend = require('../models/friend');
const async = require('async');
const removeElement = require('../helpers/removeElementFromArray');
const { storage } = require('../app.js');
const imageFilter = require('../helpers/imageFilter');

// LOGIN AND SIGNUP ROUTES //
router.post('/signup', [
    body('email').trim(),
    body('username').trim().isLength({ min: 2 }),
    body('password').trim().isLength({ min: 5 }),
    body('confirmPassword').trim(),

    body('email').escape(),
    body('username').escape(),
    body('password').escape(),
    body('confirmPassword').escape(),

    check('email').isEmail()
], (req, res, next) =>{

    const errors = validationResult(req);

    const userCredentials = {
        email: req.body.email,
        username: req.body.username
    }

    if(req.body.password !== req.body.confirmPassword){
        return res.status(400).json({
            error: 'Passwords do not match'
        })
    }

    if(!errors.isEmpty()){
        return res.status(400).json({
            user: userCredentials,
            errors: errors.array()
        })
    }else{
        bcrypt.hash(req.body.password, 10, (err, hashedPassword)=>{
            if(err){
                return res.json({ msg: 'Error hashing password', err })
            }else{
                let user = new User({
                    email: req.body.email,
                    username: req.body.username,
                    hashedPassword
                })

                user.save(async function(err){
                    if (err){
                        return res.json({
                            message: 'Error creating your account',
                            err
                        });
                    }
                    return res.status(200).json({ success: 'Created your account. Please login to get the token now.'})
                })
            }
        })
    }
})

router.post('/login', [
    body('email', 'Email is required').trim().isLength({ min: 1 }),
    body('password', 'Password is required').trim().isLength({ min: 1 }),
    body('email').escape(),
    body('password').escape(),
], (req, res, next)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array()
        })
    }

    User.findOne({ email: req.body.email })
        .exec(function(err, user){
            if (err){
                return res.json({ err })
            }else if(user){
                bcrypt.compare(req.body.password, user.hashedPassword, async (err, isMatch) =>{
                    if (err){ return res.json({ err })}
                    if (isMatch){
                        const token = await jwt.sign({
                            username: user.username,
                            uid: user._id}, 'cat', { expiresIn: '7d' });
                        return res.status(200).json({ token })
                    }else{
                        return res.json({ error: 'Wrong email or password'})
                    }
                })
            }else{
                return res.json({ error: 'Wrong email or password' })
            }
        })
})

// PROFILE PICTURE ROUTES //
router.post('/picture', (req, res) =>{
    let upload = multer({ storage: storage, fileFilter: imageFilter }).single('profile_picture');

    upload(req, res, function(err){
        if (req.fileValidationError){
            return res.status(403).json({ error: 'Invalid file' })
        }else if (!req.file){
            return res.json({ error: 'Select an image to upload' })
        }else if (err instanceof multer.MulterError){
            return res.status(403).json({ err })
        }else if (err){
            return res.statsu(403).json({ err })
        }

        res.send(`You have uploaded this image: <hr/><img src="${req.file.path}" width="500"><hr />`)
    })
})

// FRIEND ROUTES //
router.post('/:accepterId/friend', verifyToken, async (req, res) =>{
    let friendRequest = new Friend({
            adder: req.authorizedData.uid,
            accepter: req.params.accepterId
        })
        friendRequest.save(async function(err, friend){
            if (err){ return res.status(403).json({ err })};
            if (friend){
                const adder = await User.findById(req.authorizedData.uid);
                const accepter = await User.findById(req.params.accepterId);

                let adderFriends = adder.friends;
                let accepterFriends = accepter.friends;
                adderFriends.push(friend._id);
                accepterFriends.push(friend._id);

                let tempAdder = new User({
                    ...adder,
                    friends: adderFriends,
                    _id: req.authorizedData.uid
                })

                let tempAccepter = new User({
                    ...accepter,
                    friends: accepterFriends,
                    _id: req.params.accepterId
                })

                User.findOneAndUpdate({'_id': req.authorizedData.uid}, tempAdder, { useFindAndModify: false }, (err) =>{
                    if (err){ return res.status.json({ err })};
                    User.findOneAndUpdate({'_id': req.params.accepterId}, tempAccepter, { useFindAndModify: false }, (err) =>{
                        if (err){ return res.status.json({ err })}
                        return res.status(200).json({ success: 'Successfully sent the friend request' });
                    })
                })
            }else{
                return res.status.json({ error: 'Error sending friend request' })
            }
        })
})

router.post('/:friendId/accept', verifyToken, (req, res) =>{
    Friend.findById(req.params.friendId, (err, friend) =>{
        if (err){ return res.status(403).json({ err })};
        if (friend){
            if (friend.accepter === req.authorizedData.uid){
                let tempFriend = new Friend({
                    ...friend,
                    isFriend: true,
                    _id: req.params.friendId
                })

                Post.findOneAndUpdate({'_id': req.params.friendId}, tempFriend, { useFindAndModify: false }, (err) =>{
                    if (err){ return res.status(403).json({ err })};
                    return res.status(200).json({ sucess: 'Accepted the friend request'})
                })
            }else{
                return res.status(403).json({ error: 'You are not authorized to accept this request' })
            }
        }else{
            return res.status(403).json({ error: 'Cannot find the friend request' })
        }
    })
})

router.delete('/:friendId/friend', verifyToken, (req, res) =>{
    let uid = req.authorizedData.uid;

    Friend.findById(req.params.id, async (err, friend) =>{
        if (friend.adder === uid || friend.accepter === uid){
            let adder = await User.findById(friend.adder);
            let accepter = await User.findById(friend.accepter);

            let adderFriends = adder.friends;
            let accepterFriends = accepter.friends;

            adderFriendsDeleted = removeElement(adderFriends, req.params.friendId);
            accepterFriendsDeleted = removeElement(accepterFriends, req.params.friendId);

            let tempAdder = new User({
                ...adder,
                friends: adderFriendsDeleted,
                _id: adder._id
            })

            let tempAccepter = new User({
                ...accepter,
                friends: accepterFriendsDeleted,
                _id: accepter._id
            })

            User.findOneAndUpdate({'_id': adder._id}, tempAdder, { useFindAndModify: false }, (err) =>{
                if (err){ return res.status(403).json({ err })};
                User.findOneAndUpdate({'_id': accepter._id}, tempAccepter, { useFindAndModify: false }, (err) =>{
                    if (err){ return res.status(403).json({ err })};
                    Friend.findOneAndDelete({ _id: req.params.friendId }, function (err) {
                        if(err){ return res.status(403).json({ err })};
                        return res.status(200).json({ sucess: 'Unfriended the person successfully' });
                    });
                })
            })
        }else{
            return res.status(403).json({ error: 'You are not authorized to unfriend' })
        }
    })
})

module.exports = router;
