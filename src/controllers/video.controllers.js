import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import { uploadOnCloudinary } from "../utils/clodinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video

    // only the logged in user can upload video

    const { title, description } = req.body;
    if (!req.body) {
        throw new ApiError(400, "Everything is empty");
    }
    if ([title, description].some((fields) => fields?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user._id);
    const videoPath = req.files?.video?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;
    if (!videoPath) {
        throw new ApiError(400, "Video file is missing");
    }

    let video;
    try {
        video = await uploadOnCloudinary(videoPath);
        console.log("Video uploaded");
    } catch (error) {
        console.log("Couldn't upload video ", error);
        throw new ApiError(400, "Failed to upload video");
    }
    let thumbnail;
    try {
        thumbnail = await uploadOnCloudinary(thumbnailPath);
    } catch (error) {
        throw new ApiError(400, "Thumbnail not uploaded");
    }

    try {
        const videoInstance = await Video.create({
            videoFile: video.url,
            thumbnail,
            title,
            description,
            duration: video?.duration / 60,
            isPublished: true,
            owner: user._id,
        });

        const uploadedVideo = await Video.findById(videoInstance._id).select(
            "-isPublished "
        );

        if (!uploadedVideo) {
            throw new ApiError(
                500,
                "Somerthing went wrong while uploading the video"
            );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    uploadedVideo,
                    "Video uploaded successfully"
                )
            );
    } catch (error) {
        console.log("Video upload failed");
        await deleteFromCloudinary(video.publicId);
        await deleteFromCloudinary(thumbnail.publicId);
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(400, "Can't fetch video");
    }

    const video = await Video.findById(videoId).select("-isPublished");
    if (!video) {
        throw new ApiError(400, "Can't find video");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video Fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    if (!req.body);
    {
        throw new ApiError(400, "Everthing is empty");
    }
    const { title, description } = req.body;
    const thumbnailPath = req.files?.thumbnail?.[0].path;
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Some fields are empty");
    }

    let thumbnail;
    try {
        thumbnail = await uploadOnCloudinary(thumbnailPath);
    } catch (error) {
        throw new ApiError(400, "couldn't upload thumbnail");
    }

    try {
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title: title,
                    description: description,
                    thumbnail: thumbnail,
                },
            },
            {
                new: true,
            }
        ).select("-isPublished");
        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedVideo, "Video updated successfully")
            );
    } catch (error) {
        console.log("Something went wrong ", error);
        await deleteFromCloudinary(thumbnail.publicId);
        throw new ApiError(500, "Error in updating details");
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video doesn't exist");
    }

    try {
        await Video.findByIdAndDelete(video._id);
        console.log("Video deleted successfully");
        return res.status(200).json(new ApiResponse(200, {}, "Video Deleted"));
    } catch (error) {
        throw new ApiError(500, "Couldn't delete video ");
    }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    await video.toggleVideoPublishStatus();
    await video.save({ validateBeforeSave: true });
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
