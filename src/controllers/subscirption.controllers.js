import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/users.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // TODO: toggle subscription
    const { subscriberId } = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel");
    }

    if (channelId.toString() === subscriberId.toString()) {
        throw new ApiError(
            400,
            "You can't subscribe or unsubscribe your own channel"
        );
    }

    try {
        const existingSubscriber = await Subscription.findOne({
            channel: channelId,
            subscriber: subscriberId,
        });
        if (existingSubscriber) {
            await Subscription.findByIdAndDelete(existingSubscriber._id);
            return res
                .status(200)
                .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
        }
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, newSubscription, "Subscribed successfully")
            );
    } catch (error) {
        throw new ApiError(500, "something went wrong");
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const channel = await Subscription.find({
        channel: channelId,
    });
    if (!channel) {
        throw new ApiError(400, "Channel not found");
    }

    return res.status(200).json(new ApiResponse(200, channel, "channel found"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    const subscribers = await Subscription.find({ subscriber: subscriberId });
    if (!subscribers) {
        throw new ApiError(400, "No subscribers");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Found subscribers"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
