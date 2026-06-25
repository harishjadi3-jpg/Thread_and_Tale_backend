import mongoose, { Schema } from "mongoose";

const OrderSchema = new Schema(
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
        paymentType: {
            type: String,
            enum: ["COD", "ONLINE"],
            required: true
        },
        orderStatus: {
            type: String,
            enum: [
                "placed successfully",
                "Packed",
                "Shipped",
                "Delivered",
                "Cancelled"
            ],
            default: "placed successfully"
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
        },
        returnReason:{
            type:String,
            default:null
        },
        returnRequestTime:{
            type:Date,
            default:null
        }

    },
    {
        timestamps: true
    }

)

const OrderModel = mongoose.model("Order", OrderSchema)

export default OrderModel