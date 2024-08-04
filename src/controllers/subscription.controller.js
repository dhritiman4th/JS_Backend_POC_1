import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    const requestedChannel = await User.findById(channelId);
    if (!requestedChannel) {
        throw new ApiError(400, "Channel is required");
    }
    const channel = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(String(channelId))
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers",
                    pipeline: [
                        {
                            $match: {
                                subscriber: req.user._id
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "subscriber",
                                foreignField: "_id",
                                as: "details"
                            }
                        },
                        {
                            $project: {
                                details: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    subscribers: 1
                }
            }
        ]
    );

    console.log("Channel = ", channel);
    const subscribers = channel[0]["subscribers"]
    if (subscribers?.length > 0) {
        console.log("Subscription id to be deleted = ", subscribers[0]._id);
        const subscriptionDeleteResponse = await Subscription.findByIdAndDelete(subscribers[0]._id);
        console.log(subscriptionDeleteResponse);
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Successfully unsubscribed"));
    } else {
        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: requestedChannel._id
        });

        if (!subscription) {
            throw new ApiError(500, "Something went wrong while subscribing to the channel");
        }

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Successfully subscribed"));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const channel = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(String(channelId))
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "subscriber",
                                foreignField: "_id",
                                as: "details"
                            }
                        },
                        {
                            $addFields: {
                                details: {
                                    $first: "$details"
                                }
                            } 
                        },
                        {
                            $project: {
                                details: 1
                            }
                        }
                    ]
                }
            }
        ]
    );

    console.log(channel);
    return res
    .status(200)
    .json( new ApiResponse(200, channel[0].subscribers, !channel[0].subscribers.length ? "No subscriber found" : "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const subscribedChannels = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(String(subscriberId))
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedChannels",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "channel",
                                foreignField: "_id",
                                as: "details"
                            }
                        },
                        {
                            $project: {
                                details: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    subscribedChannels: 1
                }
            }
        ]
    );

    return res
    .status(200)
    .json( new ApiResponse(
        200, 
        subscribedChannels, 
        !subscribedChannels?.length ? "No channels found which subscriber subscribed to" : "Channels fetched successfully")
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}