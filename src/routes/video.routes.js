import router from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
} from "../controllers/video.controllers.js";

const videoRouter = router();

videoRouter.route("/publish").post(
    verifyJWT,
    upload.fields([
        {
            name: "video",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishAVideo
);

videoRouter.route("/:id").get(getVideoById);
videoRouter
    .route("/update/:videoId")
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

videoRouter.route("/delete:/videoId").delete(verifyJWT, deleteVideo);
videoRouter.route("/toggle/:videoId").patch(verifyJWT, togglePublishStatus);
videoRouter.route("/allVideos").get(getAllVideos);

export default videoRouter;
