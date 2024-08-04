import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels 
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/change-subscription/:channelId").patch(
    verifyJWT,
    toggleSubscription
);

router.route("/getChannelSubscribers/:channelId").get(
    verifyJWT,
    getUserChannelSubscribers
);

router.route("/getSubscribedChannels/:subscriberId").get(
    verifyJWT,
    getSubscribedChannels
);

export default router;