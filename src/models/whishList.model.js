import mongoose, { Schema } from "mongoose";

const WhishListSchema = new Schema(
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
    }
  },
  {
    timestamps: true
  }
);

const WhishListModel = mongoose.model("WhishList", WhishListSchema)

export default WhishListModel