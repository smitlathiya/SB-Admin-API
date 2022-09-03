const mongoose = require('mongoose')
const { v1 } = require('uuid')
const crypto = require('crypto')
const { ObjectId } = mongoose.Schema

const userSchema = new mongoose.Schema({
    name: {
        first_name: {
            type: String,
            trim: true,
            required: true
        },
        last_name: {
            type: String,
            trim: true,
        }
    },
    profile_image: {
        data: Buffer,
        contentType: String
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    username: {
        type: String,
        trim: true,
        unique: 'Username Already Taken',
        required: true
    },
    phone_no: {
        type: String
    },
    website: {
        type: String
    },
    designation: {
        type: String
    },
    date_of_birth: {
        type: String
    },
    address: {
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true
        }
    },
    hashed_password: {
        type: String,
        required: true
    },
    salt: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    following: [{ type: ObjectId, ref: 'User' }],
    followers: [{ type: ObjectId, ref: 'User' }],
    resetPasswordLink: {
        data: String,
        default: ""
    }
})

userSchema.virtual('password')
    .set(function (password) {
        this._password = password

        this.salt = v1()
        //encrypt Password()
        this.hashed_password = this.encryptPassword(password)
    })
    .get(function () {
        return this._password
    })

userSchema.methods = {
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password
    },

    encryptPassword: function (password) {
        if (!password) return "";
        try {
            return crypto.createHmac('sha1', this.salt)
                .update(password)
                .digest('hex');

        } catch (error) {
            return ""
        }
    }
}

module.exports = mongoose.model("User", userSchema)