const User = require("../models/user");
const Post = require("../models/posts");
const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const crypto = require('crypto');
const user = require("../models/user");

exports.userById = (req, res, next, id) => {
  User.findById(id)
    .populate("following", "_id email name username phone_no following followers")
    .populate("followers", "_id email name username phone_no following followers")
    .exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "User Not Fount",
        });
      }

      req.profile = user;

      next();
    });
};

exports.searchQuery = (req, res, next, sqr) => {
  const query = sqr.toLowerCase();

  req.sqr = query;
  next();
}

exports.hasAuthorization = (req, res, next) => {
  const authorizad =
    req.profile && req.auth && req.profile._id === req.auth._id;

  if (!authorizad) {
    return res.status(403).json({ error: "user is not Authorised" });
  }
};

exports.allUser = (req, res) => {
  User.find((err, users) => {
    if (err) {
      return res.status(400).json({ error: err });
    }
    res.json({ users });
  }).select("name email updated created profile_image");
};

exports.getUser = (req, res) => {
  req.profile.hashed_password = undefined;

  req.profile.salt = undefined;

  return res.json(req.profile);
};

exports.updateUser = (req, res, next) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err)
      return res.status(400).json({ error: "Photo could not be uploaded" });

    let user = req.profile;

    const data = {
      name: {
        first_name: fields.first_name,
        last_name: fields.last_name,
      },
      email: fields.email,
      designation: fields.designation,
      date_of_birth: fields.date_of_birth,
      address: {
        city: fields.city,
        state: fields.state,
        country: fields.country,
      },
      phone_no: fields.phone_no,
      website: fields.website,
    };

    user = _.extend(user, data);

    user.updated = Date.now();

    if (files.profile_image) {
      user.profile_image.data = fs.readFileSync(files.profile_image.filepath);

      user.profile_image.contentType = files.profile_image.mimetype;
    }

    const emailExist = await User.findOne({ email: user.email });

    //user validation
    if (emailExist) {
      if (emailExist.email != req.headers.email) {
        return res.status(403).json({ error: "Email is already used!" });
      }
    }

    user.save((err, result) => {
      if (err) return res.status(400).json({ error: err });

      res.json(result);
    });
  });
};

exports.changePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body
  User.findById(req.auth._id, (err, user) => {

    if (err || !user) return res.status(401).json({ error: "User not exists" });

    let encryptPss = crypto.createHmac('sha1', user.salt)
      .update(currentPassword)
      .digest('hex');

    if (encryptPss != user.hashed_password) {
      return res.status(401).json({ error: 'Current Password does not matche' })
    }
    if (newPassword.length < 6) {
      return res.status(401).json({ error: 'Password Length must be 6 character or more' })
    }
    let newEncrPwd = crypto.createHmac('sha1', user.salt)
      .update(newPassword)
      .digest('hex')
    user.hashed_password = newEncrPwd
    user.save();
    return res.json({ message: 'Password updated successfully' })
  });
}

exports.userPhoto = (req, res, next) => {
  if (req.profile.profile_image.data) {
    res.set("Content-Type", req.profile.profile_image.contentType);

    return res.send(req.profile.profile_image.data);
  }
  next();
};

exports.searchUser = (req, res, next) => {

  const searchKey = req.sqr;

  User.find({ "username": new RegExp(searchKey, "i") })
    .select("name email username profile_image")
    .limit(5)
    .exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "User Not Fount",
        });
      }
      res.json(user)
    })

}

exports.deleteUser = (req, res, next) => {
  let user = req.profile;

  //firs of all the post will be deleted

  Post.find({ postedBy: req.profile._id }).remove((err) => {
    if (err) return res.status(400).json({ error: err });

    // then after the user will be deleted

    user.remove((err) => {
      if (err) return res.status(400).json({ error: err });
    });

    res.json({ message: "Data Deleted Successfully" });
  });
};

exports.addFollowing = (req, res, next) => {

  User.findByIdAndUpdate(req.body.userId,
    { $push: { following: req.body.followId } },
    (err, result) => {

      if (err) {

        return res.status(400).json({ error: err })

      }

      next();

    })
}

exports.addFollower = (req, res) => {

  User.findByIdAndUpdate(req.body.followId,

    { $push: { followers: req.body.userId } },

    { new: true })

    .populate('following', '_id name')

    .populate('followers', '_id name')

    .exec((err, result) => {

      if (err) {

        return res.status(400).json({ error: err })

      }

      result.hashed_password = undefined

      result.salt = undefined

      res.json(result)

    })
}

exports.removeFollowing = (req, res, next) => {

  User.findByIdAndUpdate(req.body.userId,
    { $pull: { following: req.body.unfollowId } },
    (err, result) => {

      if (err) {

        return res.status(400).json({ error: err })

      }

      next();

    })
}

exports.removeFollower = (req, res) => {

  User.findByIdAndUpdate(req.body.unfollowId,

    { $pull: { followers: req.body.userId } },

    { new: true })

    .populate('following', '_id name')

    .populate('followers', '_id name')

    .exec((err, result) => {

      if (err) {

        return res.status(400).json({ error: err })

      }

      result.hashed_password = undefined

      result.salt = undefined

      res.json(result)

    })
}