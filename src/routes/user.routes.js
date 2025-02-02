import { Router } from "express";
import {
    registerUser,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

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

//secured routes

router.route("/logout").post(verifyJWT, logoutUser); //the request on this route first goes to my auth middleware to access the accessToken and attach the user instance to the req and forward it to logout user.

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/currentUser").get(verifyJWT, getCurrentUser);
router.route("/updateDetails").post(verifyJWT, updateAccountDetails);

router
    .route("/updateUserAvatar")
    .post(
        verifyJWT,
        upload.fields({ name: "avatar", maxCount: 1 }),
        updateUserAvatar
    );

router
    .route("/updateUserCoverImage")
    .post(
        verifyJWT,
        upload.fields({ name: "coverImage", maxCount: 1 }),
        updateUserCoverImage
    );

export default router;