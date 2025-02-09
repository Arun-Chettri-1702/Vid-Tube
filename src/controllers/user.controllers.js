import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
    path: "./.env",
});

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(400, "User not found in database");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        // saving the user after attaching a refresh token to that user instance
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating access and refresh token");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body; // images in req.files injected through multer

    //validation

    if (!req.body) {
        throw new ApiError(400, "Everything is empty");
    }

    if (
        // if even for one this is true then this block runs
        [fullName, email, username, password].some(
            (eachField) => eachField?.trim() == ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (existedUser) {
        throw new ApiError(
            409,
            "User with this email or username already exists"
        );
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // console.warn(req.files)
    // const avatar = await uploadOnCloudinary(avatarLocalPath);
    // let coverImage = "";
    // if (coverImageLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("Uploaded avatar Image ", avatar);
    } catch (error) {
        cosole.log("Error uploading avatar Image ", error);
        throw new ApiError(400, "Failed to upload cover Image");
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        console.log("Uploaded cover Image ", coverImage);
    } catch (error) {
        cosole.log("Error uploading cover Image ", error);
        throw new ApiError(400, "Failed to upload cover Image");
    }

    try {
        const userInstance = await User.create({
            username: username.toLowerCase(),
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
        });

        const createdUser = await User.findById(userInstance._id).select(
            "-password -refreshToken" // removing these two fields
        );

        if (!createdUser) {
            throw new ApiError(
                500,
                "Something went wrong while registering the user"
            );
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    createdUser,
                    "User registered successfully"
                )
            );
    } catch (error) {
        console.log("User creation failed ");
        if (avatar) {
            await deleteFromCloudinary(avatar.publicId);
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.publicId);
        }

        throw new ApiError(
            500,
            "Something went wrong while deleting the users and images were deleted"
        );
    }
});

const loginUser = asyncHandler(async (req, res) => {
    //get data from body
    const { email, username, password } = req.body;

    //validation

    if ([email, username, password].some((Field) => Field?.trim() === "")) {
        throw new ApiError(400, "Some fields are left empty");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "Couldn't find the user");
    }

    // validate password

    const passwordValidator = user.isPasswordCorrect(password);
    if (!passwordValidator) {
        throw new ApiError(401, "Invalid credentials!");
    }

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!loggedInUser) {
        throw new ApiError(400, "User is not logged In");
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        N,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // TODO : need to comeback here after middleware  --> I'm not able to know who is logged in req.body or anyother can't show who is logged in
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .josn(new ApiResponse(200, {}, "User logged out successfully"));
});

// to generate new set of access and refresh token after access token has timed out
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        const { refreshToken: newRefreshToken, accessToken } =
            await generateAccessTokenAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Accessed Token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(
            500,
            "something went wrong while refreshing access token"
        );
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    //finding which user is logged in
    const user = await User.findById(req?.user._id).select(
        "-password -refreshToken"
    ); // req.user._id is found through the verfiyJWT middleware using accessToken

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    try {
        const isPasswordValid = await user.isPasswordCorrect(oldPassword);
        if (!isPasswordValid) {
            throw new ApiError(401, "Incorrect old Password is entered");
        }
        user.password = newPassword; // this newPassword is automatically encrypted as we have used a pre hook on save and if my password is modified then it is automatically encrypted and saved
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password successfully changed "));
    } catch (error) {
        throw new ApiError(401, "Error creating new Password ");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "No logged in user");
    }

    try {
        return res
            .status(200)
            .json(new ApiResponse(200, { user }, "Current User"));
    } catch (error) {
        throw new ApiError(401, "Error fetching current User");
    }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { username, fullName, email } = req.body;

    if (!fullName || !email || !username) {
        throw new ApiError(401, "username, fullname and email are required");
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    fullName,
                    username,
                    email: email,
                },
            },
            {
                new: true, //give me the modified data
            }
        ).select("-password -refreshToken");

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Account Details successfully updated"
                )
            );
    } catch (error) {}
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const userAvatarLocalPath = req.files?.avatar?.[0].path;

    if (!userAvatarLocalPath) {
        throw new ApiError(404, "Avatar not uploaded");
    }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(userAvatarLocalPath);
    } catch (error) {
        throw new ApiError(401, "Couldn't upload avatar");
    }

    if (!avatar.url) {
        throw new ApiError(401, "something went wrong");
    }

    const user = await res
        .findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: avatar.url,
                },
            },
            {
                new: true,
            }
        )
        .select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar successfully updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const usercoverImageLocalPath = req.files?.coverImage?.[0].path;

    if (!usercoverImageLocalPath) {
        throw new ApiError(404, "cover image not uploaded");
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(usercoverImageLocalPath);
    } catch (error) {
        throw new ApiError(401, "Couldn't upload cover Image");
    }

    if (!coverImage.url) {
        throw new ApiError(401, "something went wrong");
    }

    const user = await res
        .findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    coverImage: coverImage.url,
                },
            },
            {
                new: true,
            }
        )
        .select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "cover Image successfully updated"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    //if we collect all the channels on my database to get subscribers
    const { username } = req.params; //gets username from url i.e channel who's info i'm searching
    if (!username) {
        //if username is  not in the url then their data should not be accessed
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        //pipeline 1
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        //pipeline 2
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        //pipeline 3
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        //pipeline 4  --> presenting the info
        {
            $addFields: {
                SubscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },

                //check if the user who is sending the request is subscribed to that channel which was in req.params and deconstructed ot username
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },

        //pipeline 5
        {
            // project only the necessary data
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                SubscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "Channel profile fetched successfully"
            )
        );
});
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "Video",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",

                // for a video I'm checking the owner who is a User and getting his info
                pipeline: [
                    {
                        $lookup: {
                            from: "User",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerOfVideo",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
        {},
    ]);

    if (!user) {
        throw new ApiError(400, "Watch history not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0]?.watchHistory,
                "Watch history successfully fetched"
            )
        );
});

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};
