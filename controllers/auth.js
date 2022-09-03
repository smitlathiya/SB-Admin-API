const User = require("../models/user");

const jwt = require("jsonwebtoken");

const _ = require("lodash")

const expressjwt = require("express-jwt");

const { sendEmail } = require("../helper");

require("dotenv").config();


//User Registration
exports.signup = async (req, res) => {
  const userExists = await User.findOne({ email: req.body.email });

  const usernameTaken = await User.findOne({ username: req.body.username });

  const userPass = req.body.password;

  if (userExists) {
    return res.status(403).json({
      error: "Email is already used!",
    });
  }

  if (usernameTaken) {
    return res.status(403).json({
      error: "Username is already taken!",
    });
  }

  if (userPass.length < 6) {
    return res.status(403).json({
      error: "Password must be more then 6 character ",
    });
  }

  const user = await new User(req.body);

  await user.save();

  res.status(200).json({ message: "User Registerd" });
};

// User Login
exports.signin = (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        error: "User not exists",
      });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and Password Does not matched",
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    res.cookie("t", token, { expire: new Date() + 9999 });

    const { _id, name, email } = user;

    return res.json({ token, user: { _id, email, name } });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("t");

  return res.json({ message: "Logout Successfully" });
};

exports.requireSignin = expressjwt({
  secret: process.env.JWT_SECRET,

  userProperty: "auth",
});

exports.forgotPassword = (req, res) => {

  if (!req.body) return res.status(400).json({ message: "No request body" });

  if (!req.body.email) return res.status(400).json({ message: "No Email in request body" });

  const { email } = req.body;


  // find the user based on email
  User.findOne({ email }, (err, user) => {

    if (err || !user) return res.status("401").json({ error: "User with that email does not exist!" });

    // generate a token with user id and secret
    const token = jwt.sign(

      { _id: user._id, iss: "NODEAPI" },

      process.env.JWT_SECRET

    );

    // email data
    const emailData = {
      from: "noreply@node-react.com",
      to: email,
      subject: "Password Reset Instructions",
      text: `Please use the following link to reset your password: ${process.env.CLIENT_URL}/reset-password?uid=${token}`,
      html: `<p>Please use the following link to reset your password:</p> <a href='${process.env.CLIENT_URL}/reset-password?uid=${token}'>${process.env.CLIENT_URL}/reset-password?uid=${token}</a>`
    };

    return user.updateOne({ resetPasswordLink: token }, (err, success) => {

      if (err) {

        return res.json({ message: err });

      } else {

        sendEmail(emailData);

        return res.status(200).json({ message: `Email has been sent to ${email}. Follow the instructions to reset your password.` });

      }

    });

  });

};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  User.findOne({ resetPasswordLink }, (err, user) => {
    // if err or no user
    if (err || !user) {
      return res.status("401").json({
        error: "Invalid Link!"
      });
    }

    const updatedFields = {
      password: newPassword,
      resetPasswordLink: ""
    };

    user = _.extend(user, updatedFields);
    user.updated = Date.now();

    user.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      res.json({
        message: `Great! Now you can login with your new password.`
      });
    });
  });
};

exports.socialLogin = (req, res) => {
  // try signup by finding user with req.email
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err || !user) {
      // create a new user and login
      let data = {
        name: {
          first_name: req.body.name.first_name,
          last_name: req.body.name.last_name,
        },
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        designation: "",
        date_of_birth: "",
        address: {
          city: "",
          state: "",
          country: "",
        },
        phoneNo: "",
        website: "",
        profile_image: {
          code: null,
          contentType: null,
        }
      }
      user = new User(data);
      req.profile = user;
      user.save();
      // generate a token with user id and secret
      const token = jwt.sign(
        { _id: user._id, iss: "NODEAPI" },
        process.env.JWT_SECRET
      );
      res.cookie("t", token, { expire: new Date() + 9999 });
      // return response with user and token to frontend client
      const { _id, name, email } = user;
      return res.json({ token, user: { _id, name, email } });
    } else {
      // update existing user with new social info and login
      req.profile = user;
      user = _.extend(user, req.body);
      user.updated = Date.now();
      user.save();
      // generate a token with user id and secret
      const token = jwt.sign(
        { _id: user._id, iss: "NODEAPI" },
        process.env.JWT_SECRET
      );
      res.cookie("t", token, { expire: new Date() + 9999 });
      // return response with user and token to frontend client
      const { _id, name, email } = user;
      return res.json({ token, user: { _id, name, email } });
    }
  });
};