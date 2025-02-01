// to fetch which user is hitting the logout and extracting it's id and modify the request and forward it to the controller using next
// using access token
// token can be sent through header---->>header---Bearer TokenNo

import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

export const verifyJWT = asyncHandler(async (req, _, next) => {
    const accessToken =
        req.cookies.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    if (!accessToken) {
        throw new ApiError(401, "AccessToken is not there");
    }

    try {
        const decodedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        if (!decodedToken) {
            throw new ApiError(401, "Not a jwt token");
        }

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError(401, "UnAuthorized");
        }

        req.user = user; //creating a new parameter as user in the req

        next();   //this next will transefer this req to the controller
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});
