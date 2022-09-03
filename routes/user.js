const express = require('express')

const { userById,
    allUser,
    getUser,
    updateUser,
    deleteUser,
    userPhoto,
    searchUser,
    searchQuery,
    addFollowing,
    addFollower,
    removeFollowing,
    removeFollower,
    changePassword } = require('../controllers/user')

const { requireSignin } = require('../controllers/auth')

const router = express.Router()

router.put('/user/follow', requireSignin, addFollowing, addFollower)

router.put('/user/unfollow', requireSignin, removeFollowing, removeFollower)

router.get('/users', allUser);

router.put('/change-password', requireSignin, changePassword)

router.get('/user/:userId', requireSignin, getUser);

router.get('/user/photo/:userId', userPhoto);

router.put('/user/:userId', requireSignin, updateUser);

router.get('/users/search/:searchQuery', searchUser);

router.delete('/user/:userId', requireSignin, deleteUser);

router.param("userId", userById)

router.param('searchQuery', searchQuery);

module.exports = router;