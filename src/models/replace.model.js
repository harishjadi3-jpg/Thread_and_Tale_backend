import mongoose, { Schema } from "mongoose";

const ReplaceSchema = new Schema(
    {
        oldProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        newProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        paymentType: {
            type: String,
            enum: ["Cash on Delivary", "UPI", "NetBanking"],
            required: true
        },
        orderStatus: {
            type: String,
            enum: [
                "Pending",
                "Packed",
                "Shipped",
                "Delivered",
                "Cancelled"
            ],
            default: "Pending"
        },
        paymentStatus: {
            type: Boolean,
            default: false
        },
        orderCount:{
            type:Number,
            default:1
        },
        totalAmount: {
            type: Number,
            default: 0
        },
        delivaryTime:{
            type:Date,
            default:null
        },
        delivaryAddress:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Address",
            default:null
        },
        isReplaced:{
            type:Boolean,
            default:false
        }
    },
    {
        timestamps: true
    }

)

const ReplaceModel = mongoose.model("Replace", ReplaceSchema)

export default ReplaceModel