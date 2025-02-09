import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/users.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const { tweetContent } = req.body;
    if (!req.body) {
        throw new ApiError(400, "No Tweet sent");
    }

    const validUserId = mongoose.isValidObjectId(req.user._id);
    if (!validUserId) {
        throw new ApiError(400, "UserID is not valid");
    }

    try {
        const tweetInstance = await Tweet.create({
            owner: req.user._id,
            content: tweetContent,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, tweetInstance, "Tweet successfully done")
            );
    } catch (error) {
        console.log("Something went wrong ", error);
        throw new ApiError(500, "Couldn't tweet");
    }
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params;

    const tweets = await Tweet.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $project: {
                _id: 0,
                content: 1,
            },
        },
    ]);

    if (!tweets?.length) {
        throw new ApiError(400, "Tweets not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Found all user tweets"));
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    if (!req.body) {
        throw new ApiError(400, "Empty fields");
    }
    const { tweetContent } = req.body;

    try {
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    tweetContent,
                },
            },
            {
                new: true,
            }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(400, updateTweet, "Tweet successfully updated")
            );
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    try {
        await Tweet.findByIdAndDelete(tweetId);
        console.log("Tweet Deleted Successfully");
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
