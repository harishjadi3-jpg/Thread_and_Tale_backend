import mongoose, { Schema } from "mongoose";

const VarientSchema = new Schema(
    {
        size: {
            type: String,
            
            required:true
        },
        color: {
            type: String,
            
            required:true
        },
        gender: {
            type: String,
            
            required:true
        },
        price: {
            type: Number,
            required: true
        },
        availabilityCount: {
            type: Number,
            required: true
        },
        sellingCount:{
            type:Number,
            default:0
        },
        reviews:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Review"
    }]
    },
    {
        _id:false
    }
)

const ProductSchema = new Schema(
    {
        category: {
            type: String,
            
            required:true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required:true
        },
        images: [
            {
                type: String,
                required: true
            }
        ],
        details: [VarientSchema],
        deliveryTime: {
            type: Number,
            required: true
        },
        brand: {
            type: String,
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        returnOption:{
            type:Boolean, 
            default:false
        }
    },
    {
        timestamps: true
    }
)

const ProductModel = mongoose.model("Product", ProductSchema)

export default ProductModel