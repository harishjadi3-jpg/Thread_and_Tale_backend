import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
    {
        addressLine: {
            type: String,
            required: true
        },

        village: {
            type: String,
            required: true
        },

        mandal: {
            type: String,
            required: true
        },

        dist: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        },

        pinCode: {
            type: String,
            required: true
        },

        phoneNumber: {
            type: String,
            required: true
        },

        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        },

        isDefault: {
            type: Boolean,
            default: false
        }

    },
    {
        timestamps: true
    }
);

const AddressModel =
mongoose.model(
    "Address",
    AddressSchema
);

export default AddressModel;