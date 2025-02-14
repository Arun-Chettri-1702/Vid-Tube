import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video
    const { LikedBy } = req.user._id;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Not a valid video id");
    }

    try {
        const alreadyLiked = await Like.find({
            video: videoId,
            likedBy: LikedBy,
        });
        if (alreadyLiked) {
            await Like.findByIdAndDelete(alreadyLiked._id);
            return res.status(200).json(200, {}, "UnLiked");
        }
        const newLike = await Like.create({
            video: videoId,
            likedBy: LikedBy,
        }).select("-comment -tweet");

        return res.status(200).json(200, newLike);
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    const { LikedBy } = req.user._id;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Not a valid comment id");
    }

    try {
        const alreadyLiked = await Like.find({
            comment: commentId,
            likedBy: LikedBy,
        });
        if (alreadyLiked) {
            await Like.findByIdAndDelete(alreadyLiked._id);
            return res.status(200).json(200, {}, "UnLiked");
        }
        const newLike = await Like.create({
            comment: commentId,
            likedBy: LikedBy,
        }).select("-video -tweet");

        return res.status(200).json(200, newLike);
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    const { LikedBy } = req.user._id;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Not a valid video id");
    }

    try {
        const alreadyLiked = await Like.find({
            tweet: tweetId,
            likedBy: LikedBy,
        });
        if (alreadyLiked) {
            await Like.findByIdAndDelete(alreadyLiked._id);
            return res.status(200).json(200, {}, "UnLiked");
        }
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: LikedBy,
        }).select("-comment -video");

        return res.status(200).json(200, newLike);
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const { LikedBy } = req.user._id;
    if (!isValidObjectId(LikedBy)) {
        throw new ApiError(400, "Not a valid user Id");
    }

    const videos = await Like.find({ likedBy: LikedBy });

    if (!videos) {
        throw new ApiError(400, "No liked videos");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Fetched all liked videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
