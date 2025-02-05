import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,       // one to whom the user is subscribing
            ref: "User",
        },
        channel: {
            type: Schema.Types.ObjectId,   // all the channel associated with that user
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
