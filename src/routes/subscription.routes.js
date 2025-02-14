import router from "router";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} from "../controllers/subscription.controllers.js";
import { getUserChannelProfile } from "../controllers/user.controllers.js";

const subscriptionRouter = router();

subscriptionRouter
    .route("/subscribe/:channelId")
    .patch(verifyJWT, toggleSubscription);
subscriptionRouter
    .route("/subscribers/:channelId")
    .get(getUserChannelSubscribers);
subscriptionRouter
    .route("/subscribed/:channelId")
    .get(verifyJWT, toggleSubscription);
subscriptionRouter
    .route("/subscribed/:subscriberId")
    .get(verifyJWT, getSubscribedChannels);

export default subscriptionRouter;
