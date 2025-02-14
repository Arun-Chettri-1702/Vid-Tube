import router from "router";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
} from "../controllers/playlist.controllers.js";

const playlistRouter = router();

playlistRouter.route("/create").post(verifyJWT, createPlaylist);
playlistRouter.route("/get/:userId").get(getUserPlaylists);
playlistRouter.route("/get/:playlistId").get(getPlaylistById);
playlistRouter
    .route("/add/:playlistId/video/:videoId")
    .patch(verifyJWT, addVideoToPlaylist);
playlistRouter
    .route("/remove/:playlistId/video/:videoId")
    .patch(verifyJWT, removeVideoFromPlaylist);
playlistRouter.route("/delete/:playlistId").delete(verifyJWT, deletePlaylist);
playlistRouter.route("/update/:playlistId").patch(verifyJWT, updatePlaylist);
playlistRouter.route("/create").post(verifyJWT, createPlaylist);

export default playlistRouter;
