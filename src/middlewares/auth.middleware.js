import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";

export const verifyJWT=asyncHandler(async(req,res,next)=>{
    // get the token
    // decode it and verify the details from db 
    //later try here with header also (beacuase in some cases we can not send token in cookie)
    const token = req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

if (!token) {
    throw new ApiError(401, "Unauthorized");
}

    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
    if(!decodedToken){
        throw new ApiError("Token is not Matching",401);
    }
    const user=await User.findById(decodedToken.id).select("-password -refreshtoken");

    if(!user){ // if user is not found in db then he should verify gmail for getting access to the account
        throw new ApiError("User not matched",404)
    }
    req.user=user;
    next();
})

export const verifyAdmin = asyncHandler(async (req, res, next) => {

  

    if (!req.user) {
        throw new ApiError(401, "Unauthorized Access");
    }

    if (req.user.role !== "admin") {
        throw new ApiError(403, "Access Denied. Admin Only");
    }

    next();
});