import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";
import multer from "multer";

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

router.route("/updateVideo/:videoId").patch(
    upload.single("thumbnail"),
    verifyJWT,
    updateVideo
);

router.route("/deleteVideo/:videoId").delete(
    verifyJWT,
    deleteVideo
);

router.route("/togglePublishStatus/:videoId").patch(
    verifyJWT,
    togglePublishStatus
);
export default router;