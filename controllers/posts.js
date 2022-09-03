const Posts = require("../models/posts");

const formidable = require("formidable");

const fs = require("fs");
const res = require("express/lib/response");
const req = require("express/lib/request");
const _ = require("lodash");

exports.postById = (req, res, next, id) => {
  Posts.findById(id)

    .populate("comments", "text created")

    .populate("comments.postedBy", "_id name")

    .populate("postedBy", "_id name")

    .exec((err, post) => {

      if (err || !post) return res.status(400).json({ error: "something went wrong" });

      req.post = post;

      next();
    });
};

exports.like = (req, res) => {

  Posts.findByIdAndUpdate(

    req.body.postId,

    { $push: { likes: req.body.userId } },

    { new: true }

  ).exec((err, result) => {

    if (err) {

      return res.status(400).json({

        error: err

      })

    } else {

      res.json(result);

    }

  })

}

exports.unlike = (req, res) => {

  Posts.findByIdAndUpdate(

    req.body.postId,

    { $pull: { likes: req.body.userId } },

    { new: true }

  ).exec((err, result) => {

    if (err) {

      return res.status(400).json({

        error: err

      })

    } else {

      res.json(result);

    }

  })

}

exports.comment = (req, res) => {
  let comment = req.body.comment

  comment.postedBy = req.body.userId

  Posts.findByIdAndUpdate(

    req.body.postId,

    { $push: { comments: comment } },

    { new: true }

  )
    .populate('comments.postedBy', '_id name')

    .populate('postedBy', '_id name')

    .exec((err, result) => {

      if (err) {

        return res.status(400).json({

          error: err

        })

      } else {

        res.json(result);

      }

    })
}

exports.uncomment = (req, res) => {
  let comment = req.body.comment

  Posts.findByIdAndUpdate(

    req.body.postId,

    { $pull: { comments: { _id: comment._id } } },

    { new: true }

  )
    .populate('comments.postedBy', '_id name')

    .populate('postedBy', '_id name')

    .exec((err, result) => {


      if (err) {

        return res.status(400).json({

          error: err

        })

      } else {

        res.json(result);

      }

    })
}

exports.getPosts = (req, res) => {
  Posts.find()

    .select("_id title body photo likes comments")

    .populate("postedBy", "_id name username designation profile_image")

    .populate("comments", "text created")

    .populate("comments.postedBy", "_id name")

    .then((posts) => {
      res.json({ posts });
    })

    .catch((err) => res.json(err));
};

exports.getPost = (req, res) => {
  return res.json(req.post);
};

exports.createPost = (req, res) => {
  let form = new formidable.IncomingForm();

  form.keepExtensions = true;

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(400).json({ error: err });

    let post = new Posts(fields);

    req.profile.hashed_password = undefined;

    req.profile.salt = undefined;

    post.postedBy = req.profile;

    if (files.photo) {
      post.photo.data = fs.readFileSync(files.photo.filepath);

      post.photo.contentType = files.photo.mimetype;
    }
    post.save((err, result) => {
      if (err) return res.status(400).json({ error: err });

      res.json({
        message: "Post Successfully",
      });
    });
  });
};

exports.updatePost = (req, res, next) => {
  let form = new formidable.IncomingForm();

  form.keepExtensions = true;

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(400).json({ error: err });

    let post = req.post;

    post = _.extend(post, fields);

    if (files.photo) {
      post.photo.data = fs.readFileSync(files.photo.filepath);

      post.photo.contentType = files.photo.mimetype;
    }

    post.save((err) => {
      if (err) return res.status(400).json({ error: err });

      res.json({ message: "Post Updated Successfully" });
    });
  });
};

exports.postsByUser = (req, res) => {
  Posts.find({ postedBy: req.profile._id })

    .select("_id title body photo likes comments")

    .populate("postedBy", "_id name")

    .populate("comments", "text created")

    .populate("comments.postedBy", "_id name")

    .sort("_created")

    .exec((err, posts) => {
      if (err) return res.status(400).json({ error: err });

      res.json(posts);
    });
};

exports.isPoster = (req, res, next) => {
  let postedById = req.post.postedBy._id
    .toString()
    .replace(/ObjectId\("(.*)"\)/, "$1");

  let isPoster = req.post && req.auth && postedById == req.auth._id;

  if (!isPoster) {
    return res.status(403).json({ error: "User is not Authorized" });
  }

  next();
};

exports.postImage = (req, res, next) => {
  if (req.post.photo.data) {
    res.set("Content-Type", req.post.photo.contentType);

    return res.send(req.post.photo.data);
  }

  next();
};

exports.deletePost = (req, res) => {
  let post = req.post;

  post.remove((err) => {
    if (err) return res.status(400).json({ error: err });

    res.json({ message: "Post deleted Successfully" });
  });
};
