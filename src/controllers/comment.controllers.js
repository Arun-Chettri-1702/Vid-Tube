import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    if (!req.body) {
        throw new ApiError(400, "Comment empty");
    }
    const { comment } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video Does not exist");
    }
    const { ownerId } = video.owner;

    try {
        const commentInstance = await Comment.create({
            video: videoId,
            owner: ownerId,
            content: comment,
        });

        const commentUploaded = await Comment.findById(
            commentInstance._id
        ).select("-owner");

        res.status(200).json(
            new ApiResponse(200, commentUploaded, "Comment done successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Something went wrong ");
    }
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { comment } = req.body;

    try {
        const updatedComment = await Comment.findByIdAndUpdate(
            comment._id,
            {
                $set: {
                    content: comment,
                },
            },
            {
                new: true,
            }
        ).select("-owner");

        return res
            .status(200)
            .json(new ApiResponse(200, updateComment, "Updated comment"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(400, "Comment does not exist");
    }

    try {
        await Comment.findByIdAndDelete(comment._id);

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment successfully deleted"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

export { getVideoComments, addComment, updateComment, deleteComment };
