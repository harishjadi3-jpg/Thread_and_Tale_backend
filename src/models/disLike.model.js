import mongoose, { Schema } from "mongoose";

const DisLikeSchema = new Schema(
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

const DisLikeModel = mongoose.model("DisLike", DisLikeSchema)

export default DisLikeModel