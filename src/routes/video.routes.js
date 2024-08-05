import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    publishAVideo,
    getVideoById
} from "../controllers/video.controller.js";

const router = Router();

router.route("/publish-video").patch(
    verifyJWT,
    upload.fields([
        {
            name: "videoToPublish",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
);

router.route("/get-video/:videoId").get(
    getVideoById
);
export default router;