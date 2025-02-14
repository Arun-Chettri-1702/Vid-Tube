import router from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
} from "../controllers/comment.controllers.js";

const commentRouter = router();

commentRouter.route("/:videoId").post(verifyJWT, addComment);
commentRouter.route("/:videoId").patch(verifyJWT, updateComment);
commentRouter.route("/:videoId").post(verifyJWT, deleteComment);
commentRouter.route("/:videoId").get(getVideoComments);

export default commentRouter;
