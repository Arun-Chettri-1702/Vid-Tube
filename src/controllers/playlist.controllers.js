import mongoose, { isValidObjectId, Query } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { response } from "express";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    //TODO: create playlist

    if ([name, description].some((eachfield) => eachfield.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    try {
        const playlist = await Playlist.create({
            name,
            description,
            owner: req?.user._id,
        });

        const uploadedPlaylist = await Playlist.findById(playlist._id).select(
            "-owner "
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    uploadedPlaylist,
                    "successfully created a playlist"
                )
            );
    } catch (error) {
        throw new ApiError(500, `Something went wrong ${error}`);
    }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: userId,
            },
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner: 2,
            },
        },
    ]);

    if (!playlist) {
        throw new ApiError(400, "User has no playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Successfully fetched user's playlist"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Not a valid playlist id");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Playlist doesn't exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Successfully fetched playlist"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if ([playlistId, videoId].some((eachfield) => eachfield.trim() === "")) {
        throw new ApiError(400, "Could not fetch playlist or video");
    }

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or video ID");
    }

    const existingPlaylist = await Playlist.findById(playlistId);
    if (!existingPlaylist) {
        throw new ApiError(400, "Playlist does not exist");
    }

    try {
        const playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet: {
                    videos: videoId,
                },
            },
            {
                new: true,
            }
        ).select("-owner");

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Added video to playlist"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
    if ([playlistId, videoId].some((eachfield) => eachfield.trim() === "")) {
        throw new ApiError(400, "Could not fetch playlist or video");
    }

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or video ID");
    }

    const existingPlaylist = await Playlist.findById(playlistId);
    if (!existingPlaylist) {
        throw new ApiError(400, "Playlist does not exist");
    }

    try {
        const newPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $unset: {
                    vidoes: videoId,
                },
            },
            {
                new: true,
            }
        ).select("-owner");

        return res
            .status(200)
            .json(
                new ApiResponse(200, newPlaylist, "Removed video to playlist")
            );
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is empty");
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Playlist doesn't exist");
    }
    try {
        await Playlist.findByIdAndDelete(playlist._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Successfully deleted playlist"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
    if (
        [playlistId, name, description].some(
            (eachfield) => eachfield.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist Id is not valid");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Playlist doesn't exist ");
    }

    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlist._id,
            {
                $set: {
                    name,
                    description,
                },
            },
            {
                new: true,
            }
        ).select("-owner");

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedPlaylist,
                    "Playlist successfully updated"
                )
            );
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
