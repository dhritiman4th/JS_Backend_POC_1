import {Router} from "express";
import {
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    updateUserAvatar, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(
    loginUser
);

// SECURED ROUTES
router.route("/logout").post(
    verifyJWT,
    logoutUser
);

router.route("/refresh-token").post(
    refreshAccessToken
);

router.route("/change-password").post(
    verifyJWT,
    changeCurrentPassword
);

router.route("/current-user").get(
    verifyJWT,
    getCurrentUser
);

router.route("/update-account-details").patch(
    verifyJWT,
    updateAccountDetails
);

router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
);

router.route("/update-cover").patch(
    verifyJWT,
    upload.single("coverImage"),
    updatedCoverImage
);

router.route("/channel-profile/:username").get(
    verifyJWT,
    getUserChannelProfile
);

route.route("/watch-history").get(
    verifyJWT, 
    getWatchHistory
);
export default router;