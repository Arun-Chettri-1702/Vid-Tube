import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

const registerUSer = asyncHandler(async (req, res) => {
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
        $or: [{ email }, { userName }],
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
            userName: userName.toLowerCAse(),
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

    const passwordValidator = user.isPasswordCorrect(user.password);
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

export { registerUSer,loginUser };