import mongoose, { Schema } from "mongoose";

const CartSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    

        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },

        quantity: {
          type: Number,
          required: true,
          default: 1
        },

        price: {
          type: Number,
          required: true
        },

    paymentType: {
      type: String,
      enum: ["Cash on Delivery", "UPI","NetBanking"],
      
    },

    paymentStatus: {
      type: Boolean,
      default: false
    },
    
    totalAmount: {
      type: Number,
      default:0,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const CartModel = mongoose.model("Cart", CartSchema)

export default CartModel