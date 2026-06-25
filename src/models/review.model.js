import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        content: {
            type: String,
            trim: true
        },

        stars: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },

        likeCount: {
            type: Number,
            default: 0
        },

        disLikeCount: {
            type: Number,
            default: 0
        },

        images: [
            {
                type: String
            }
        ]
    },
    {
        timestamps: true
    }
);

const ReviewModel =
    mongoose.model(
        "Review",
        ReviewSchema
    );

export default ReviewModel;