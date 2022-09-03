const express = require("express");

const { signup, signin, signout, forgotPassword, resetPassword, socialLogin } = require("../controllers/auth");

const { userById } = require("../controllers/user");

const router = express.Router();

router.post("/signup", signup);

router.post("/signin", signin);

router.get("/signout", signout);

router.param("userId", userById);

router.put("/forgot-password", forgotPassword);

router.put("/reset-password", resetPassword);

router.post("/social-login", socialLogin);

module.exports = router;
