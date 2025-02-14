import router from "router";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
} from "../controllers/like.controllers.js";

const likeRouter = router();

likeRouter.route("/comment/:commentId").patch(verifyJWT, toggleCommentLike);
likeRouter.route("/video/:videoId").patch(verifyJWT, toggleVideoLike);
likeRouter.route("/tweet/:tweetId").patch(verifyJWT, toggleTweetLike);
likeRouter.route("/likedVideos").get(verifyJWT, getLikedVideos);

export default likeRouter;
