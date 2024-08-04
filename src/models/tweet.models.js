import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            require: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

export const Tweet = mongoose.Model("Tweet", tweetSchema);