import pkg from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";

import dotenv from "dotenv";

const { bcrypt } = pkg;

dotenv.config({
    path: "./.env",
});

// structure followed while making the database
const userSchema = new Schema(
    {
        // mongoDB automatically add a feild called _id
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "password is required"], // message sent to frontend when field is empty
        },
        refreshToken: {
            type: String,
            required: true,
        },
    },
    {
        // creates two fields createdAt and updatedAt automatically
        timestamps: true,
    }
);

// pre hook
userSchema.pre("save", async function (next) {

    //fixed in registration video
    if (!this.isModified("password")) return next(); // if password is not being modified then don't encrypt the password again

    this.password = await bcrypt.hash(this.password, 10);

    next();
});

// adding a method............// compare method is await as it takes time
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    // short lived access token

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.generateRefreshToken = function () {
    // long lived access token

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullName,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

// tells mongoose to go ahead and create a new document in database which will be called as User and structure to be followed is userSchema

// all feature of mongoDB like quering finding element through User variable, it's not an ordinary variable
export const User = mongoose.model("User", userSchema);
