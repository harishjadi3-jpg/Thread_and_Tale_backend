import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { Schema } from "mongoose";
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
        },
        profileImage: {
            type: String,

        },
        refreshToken: {
            type: String,

        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user"
        },
        verifyOtp: {
            type: String,
            default: null
        },
        verifyOtpExpire:{
            type: Date
        },
        dateOfBirth:{
            type:Date,
        },
        verifyMail: {
            type: Boolean,
            default: false
        },
        cart: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "product"
        }],
        ordersHistory: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "order"
        }],
        address: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "address"
        }],
        whishList:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: "whishlist"
        }],
        gender:{
            type:String
        },
        bio:{
            type:String
        }
        ,
        inviteCode:{
            type:String,
        }
        ,
        referralCode:{
            type:String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return;
    this.password=await bcrypt.hash(this.password,10)
    ;
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
    {
        id:this._id,
        username:this.username,
        email:this.email,

    },
    process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRE
        }
    )
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this.id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRE
    }
)
}
const UserModel = await mongoose.model("User", userSchema)
export default UserModel
