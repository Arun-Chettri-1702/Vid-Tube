import { Router } from "express";
import {
    registerUser,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    loginUser,
    refreshAccessToken,
    getWatchHistory,
    getUserChannelProfile,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

//UnSecured routes

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

//secured routes

router.route("/logout").post(verifyJWT, logoutUser); //the request on this route first goes to my auth middleware to access the accessToken and attach the user instance to the req and forward it to logout user.

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-details").patch(verifyJWT, updateAccountDetails);

router
    .route("/updateUserAvatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
    .route("/updateUserCoverImage")
    .patch(verifyJWT, upload.fields("coverImage"), updateUserCoverImage);

// :username used since in function getUserChannelProfile req.params is destructured into username
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
