import mongoose, { Schema } from "mongoose";
import { User } from "./user.models";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // NOTE:- One who is suscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // NOTE:- One to whom subscriber is subscribing
        ref: "User"
    }
}, {timestamps: true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);