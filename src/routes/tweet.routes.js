import router from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
} from "../controllers/tweet.controllers.js";

const tweetRouter = router();
tweetRouter.route("/create").post(verifyJWT, createTweet);
tweetRouter.route("/update/:tweetId").patch(verifyJWT, updateTweet);
tweetRouter.route("/delete/:tweetId").patch(verifyJWT, deleteTweet);
tweetRouter.route("/get/:userId").get(getUserTweets);

export default tweetRouter;
