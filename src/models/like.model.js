import mongoose, { Schema } from "mongoose";

const LikeSchema = new Schema(
    {
        reviewId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
)

const LikeModel = mongoose.model("Like", LikeSchema)

export default LikeModel