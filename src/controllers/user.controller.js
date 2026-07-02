import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import { upload } from "../middlewares/multer.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { sendMailOTP } from "../utils/sendMails.js";
import Cart from "../models/cart.model.js";
import Review from "../models/review.model.js";
import { generateAndSendOtp } from "../utils/generateOtpAndSendotp.js";
import crypto from "crypto";
import WhishList from "../models/whishList.model.js";
import DisLike from "../models/disLike.model.js";
import Product from "../models/product.model.js";
import Address from "../models/address.model.js";
import Order from "../models/order.model.js";
import Replace from "../models/replace.model.js";
import Like from "../models/like.model.js";




const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken };
    } catch (error) {
        console.log("Error while generating Accesstokena and refresh token", error);
        throw new ApiError(500, "Error while generating Accesstokena and refresh token");
    }
}
const verifyOneTimePassword = asyncHandler(async (req, res, next) => {
    try { // this is like verify mail
        const { otp, email } = req.body;
        const user = await User.findOne({ email })
        console.log("This is otp from req body", otp);
        if (otp.trim() === "") {
            throw new ApiError(500, "Otp is invalid");
        }
        if (!user) {
            throw new ApiError(500, "Unable to find user");
        }
        if (user.verifyOtp !== otp) {
            throw new ApiError(500, "Otp is invalid");
        }
        if (user.verifyOtpExpire < Date.now()) {
            user.verifyOtp = undefined,
                user.verifyMail = false,
                user.verifyOtpExpire = undefined,
                await user.save({ validateBeforeSave: false })
            throw new ApiError(403, "Otp is expired");
        }
        user.verifyOtp = undefined,
            user.verifyMail = true,
            user.verifyOtpExpire = undefined,
            es.status(200).json(new ApiResponse(200, {}, "Otp verified successfully"))
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Otp verification failed");
    }

})


const registerUser = asyncHandler(async (req, res, next) => {
    const { username, email, phoneNumber, password, dateOfBirth, gender, bio } = req.body;
    const existedUser = await User.findOne({
        $or: [{ email }, { phoneNumber }]
    })
    if ([username, email, phoneNumber, password].some((field) => field.trim() === "")) {
        throw new ApiError(500, "All fields are required");
    }
    if (existedUser) {
        throw new ApiError(500, "User details(phone number or email) already Existed");
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("These are fine upto code", username, email, phoneNumber, password, verifyCode);
    const otpResult = await sendMailOTP(email, "Verification Code for Registration", `Your verification code is ${verifyCode}`, "");

    //if it is accepted then the otpResult.accepted lenght should be greater than 0 ,otherwises rejected lenght will be greater than one

    if (!otpResult) {
        throw new ApiError(500, "Error while sending verification code to email");
    }

    let profileImage = "";
    let profilePathImage = "";
    if (req.files?.profileImage?.length > 0) {
        console.log("Files uploaded from User", req.files.profileImage[0].path);

        profileImage = req.files?.profileImage[0]?.path;
        console.log("Proflie image path", profileImage);

        profilePathImage = await uploadOnCloudinary(profileImage);
        console.log("Uploaded path of profile image", profilePathImage);
    }
    console.log("These are fine upto creating user");
    const user = await User.create({
        username,
        email,
        password,
        phoneNumber,
        profileImage: profilePathImage || "",
        verifyOtp: verifyCode,
        verifyOtpExpire: Date.now() + 60 * 60 * 3000, // 5 min
        dateOfBirth, gender, bio
    })
    console.log("User created successfully", user);
    console.log("Created user", user)
    const registedUserDetails = await User.findById(user._id).select("-password -refreshToken");
    if (!registedUserDetails) {
        throw new ApiError(500, "Error while Registering");
    }
    console.log(user);
    return res.status(201).json(
        new ApiResponse(200, registedUserDetails, "User registered Successfully")
    )
})

const LogginWithPhoneNumber = asyncHandler(async (req, res, next) => {
    const { phoneNumber, password } = req.body;
    console.log("This is loggin with phone number", phoneNumber, password)
    if ([phoneNumber, password].some((field) => field.trim() === "")) {
        throw new ApiError(500, "All fields should be needed");
    }
    const existedUser = await User.findOne({ phoneNumber });
    console.log("Existed used while loggin with phone number", existedUser);
    console.log("This is password from req body", password);
    const isPasswordValid = await existedUser.isPasswordCorrect(password);
    console.log("is password valid or not in loggin with phone number", isPasswordValid);
    if (!isPasswordValid) {
        throw new ApiError(500, "password is invalid in logginwith Phone Number");
    }
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(existedUser._id);
    console.log("Access token and refresh token in loggin with phone number", accessToken, refreshToken);
    const options = {
        httpOnly: true,
        secure: true
    }
    const loggedInUser = await User.findById(existedUser._id)
        .select("-password -refreshToken");// here see again you are trying to optimise this

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "user Logged in Successfully"))

})

const LogginWithEmail = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if ([email, password].some((field) => field.trim() === "")) {
        throw new ApiError(500, "All fields should be needed");
    }
    console.log("This is loggin with email", email);
    const existedUser = await User.findOne({ email });
    console.log("Existed used while loggin with Email");
    const isPasswordValid = await existedUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(500, "password is invalid in logginwith Email");
    }
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(existedUser._id);
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    }
    const loggedInUser = await User.findById(existedUser._id)
        .select("-password -refreshToken"); // here see again you are trying to optimise this

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "user Logged in Successfully"))

})

const Logout = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }

        }, {
        new: true
    }

    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))

})

const changeCurrectPassword = asyncHandler(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if ([oldPassword, newPassword].some((field) => field.trim() === "")) {
            throw new ApiError(500, "All fileds should require");
        }
        const user = await User.findById(req.user?._id);
        if (!user) {
            throw new ApiError(500, "User not Logged in");
        }
        const isPasswordValid = await user.isPasswordCorrect(oldPassword);
        if (!isPasswordValid) {
            throw new ApiError(500, "Old password is invalid");
        }
        user.password = newPassword;
        await user.save({ validateBeforeSave: false });
        res.status(200).json(new ApiResponse(200, {}, "Password changed Successfully"));
    } catch (error) {
        throw new ApiError(500, "Error while changing current password")// what happends if i use try catch even i am using asyncHandler
    }
})

const getCurrentUser = asyncHandler(
    async (req, res) => {

        try {
            const userId = req.user._id;

            const user = await User.findById(userId)
                .select("-password -refreshToken -verifyOtp");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Primary Address (latest address)
            const primaryAddress = await Address
                .findOne({ userId })
                .sort({ createdAt: -1 });


            // Wishlist Count
            const wishlistCount =
                await WhishList.countDocuments({
                    userId
                });

            // Review Count
            const reviewCount =
                await Review.countDocuments({
                    userId
                });
            const cartCount = await Cart.countDocuments({
                userId
            })
            const orderCount = await Order.countDocuments({
                userId

            })
            const totalAddressesCount = await Address.countDocuments({
                userId
            })
            const profileData = {
                ...user.toObject(),

                statistics: {
                    cartItems: cartCount,
                    totalOrders: orderCount,
                    totalAddresses: totalAddressesCount,
                    totalWishlistItems: wishlistCount,
                    totalReviews: reviewCount
                },

                primaryAddress
            };
            console.log("Profile,", profileData)

            return res.status(200).json(
                new ApiResponse(
                    200,
                    profileData,
                    "Profile fetched successfully"
                )
            );
        } catch (error) {
            console.log(error)

        }
    }
);

const resendOtp = asyncHandler(async (req, res) => {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "User already verified");
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verifyOtp = verifyCode;
    user.verifyOtpExpire = Date.now() + 60000;

    await user.save({ validateBeforeSave: false });


    await sendMailOTP(
        email,
        "Verification Code",
        `Your OTP is ${verifyCode}`,
        ""
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { user: user },
            "OTP resent successfully"
        )
    );

});

const refreshToken = asyncHandler(async (req, res, next) => {
    try {
        console.log("This is incoming refreshToken", req.cookies.refreshToken);
        const incomingRefreshToken = req.cookies.refreshToken;
        // what is mean by {incomingRefreshToken } and incomingRefreshToken
        console.log("This is incoming refreshToken", incomingRefreshToken, req.cookie);
        if (!incomingRefreshToken) {
            throw new ApiError(500, "Error while Checking refreshToken");
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id);
        if (!user) {
            throw new ApiError(500, "User Not Exist while refreshing token", 404);
        }
        if (user.refreshToken != incomingRefreshToken) {
            throw new ApiError(500, "Refresh Token not Matching");
        }
        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);
        user.refreshToken = newRefreshToken;

        const options = {
            httpOnly: true,
            secure: true
        }

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Token refreshed Successfully",))
    } catch (error) {
        throw new ApiError(500, "Errow while refreshing token", error);
    }

})

const updateProfileImage = asyncHandler(async (req, res, next) => {
    try {
        console.log("Files uploaded from User in updating profile image", req.files.profileImage);
        const profileImage = req.files.profileImage[0]?.path;
        console.log("Local profile path in updating profile image", profileImage);
        if (!profileImage) {
            throw new ApiError("Error while Updating Profile Image");
        }
        const updatedProfilePath = await uploadOnCloudinary(profileImage);
        if (!updatedProfilePath) {
            throw new ApiError(500, "Errow while uploading on Cloudinary in updating profile");
        }
        const user = await User.findById(req.user._id)// how this req.user is getting user details
        if (!user) {
            throw new ApiError("Error while fecthing user in Updating Profile Image");
        }
        user.profileImage = updateProfileImage;
        await user.save({ validateBeforeSave: false });
        res.status(200)
            .json(new ApiResponse(200, { profileImage: updatedProfilePath }, "Profile Image Updated Successfully"));
    } catch (error) {
        throw new ApiError(500, "Error while updating user image");
    }
})

const orderProduct = asyncHandler(async (req, res, next) => {

    try {
        const {
            productId,
            paymentType,
            orderCount,
            color,
            size
        } = req.body;

        const product = await Product.findById(productId);
        console.log("This is product in ordering product", product);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }
        console.log("Received color:", color);
        console.log("Received size:", size);

        console.log(
            "Available variants:",
            product.details
        );

        const variant = product.details.find(
            (item) =>
                item.color === color &&
                item.size === size
        );

        if (!variant) {
            throw new ApiError(404, "Variant not found");
        }

        if (variant.availabilityCount < orderCount) {
            throw new ApiError(
                400,
                "Sorry ! this product is out of stock"
            );
        }

        variant.availabilityCount -= orderCount;

        variant.sellingCount += orderCount;

        let paymentStatus = false;

        const totalAmount = variant.price * orderCount;

        const user = await User.findById(req.user._id);

        if (user.address.length === 0) {
            throw new ApiError(
                400,
                "Please add address before ordering"
            );
        }

        const order = await Order.create({
            productId,
            userId: req.user._id,
            paymentType,
            paymentStatus,
            orderCount,
            color,
            size,
            totalAmount,
            delivaryTime:
                Date.now() + 7 * 24 * 60 * 60 * 1000,
            delivaryAddress: user.address[0]
        });
        console.log("This is order in ordering product", order);
        await product.save({ validateBeforeSave: false });

        res.status(200).json(
            new ApiResponse(
                200,
                order,
                "Order booked successfully"
            )
        );
    }
    catch (error) {
        console.error("ORDER ERROR:");
        console.error(error);
        console.error(error.stack);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }



});

const cancellOrederedProduct = asyncHandler(async (req, res, next) => {
    try {
        const { orderId } = req.body;
        if (!req.user._id) {
            throw new ApiError(404, "User Not allowed Permissions")
        }
        const orderDetails = await Order.findById(orderId);
        if (!orderDetails) {
            throw new ApiError(500, "Order Not Found")
        }
        const productId = orderDetails.productId;
        const product = await Product.findById(productId);
        if (!product) {
            throw new ApiError(500, "Error while Fetching Product in cancelling order")
        }

        product.details.availabilityCount += orderDetails.orderCount;
        orderDetails.orderStatus = "cancelled";
        if (orderDetails.paymentStatus == true) {
            // money will be credited into your account soon
        }

        await product.save({ validateBeforeSave: false });
        await orderDetails.save({ validateBeforeSave: false })
        res.status(200).json(new ApiResponse(200, { orderId }, "Order cancelled Successfullly"))
    } catch (error) {
        throw new ApiError(500, "Order Cancellation Failed", error);
    }
})

const addToCart = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const {
        productId,
        quantity,
        size,
        color,
        gender
    } = req.body;
    console.log("This is add to cart", userId, productId, quantity, size, color)

    // find product
    const product = await Product.findById(productId);

    if (!product) {

        throw new ApiError(
            404,
            "Product not found"
        );
    }

    // find matching variant
    const matchedVariant = product.details.find(

        (item) =>

            item.size === size &&
            item.color === color &&
            item.gender === gender
    );

    if (!matchedVariant) {

        throw new ApiError(
            404,
            "Product variant not found"
        );
    }

    // check existing cart item
    const existingCartItem =
        await Cart.findOne({

            userId,
            productId,
            size,
            color,
            gender
        });

    // calculate amount
    const totalAmount =
        matchedVariant.price * quantity;

    // IF PRODUCT ALREADY EXISTS
    if (existingCartItem) {

        existingCartItem.quantity += quantity;

        existingCartItem.totalAmount += totalAmount;

        await existingCartItem.save();

        return res.status(200).json(

            new ApiResponse(
                200,
                existingCartItem,
                "Cart updated successfully"
            )
        );
    }

    // CREATE NEW CART ITEM
    const cart = await Cart.create({

        userId,

        productId,

        quantity,

        size,
        color,
        gender,

        price: matchedVariant.price,

        totalAmount
    });

    return res.status(201).json(

        new ApiResponse(
            201,
            cart,
            "Product added to cart successfully"
        )
    );
});
const checkOrdersHistory = asyncHandler(
    async (req, res) => {

        const userId =
            req.user._id;

        const orders =
            await Order.find({
                userId
            })

                .populate({

                    path: "productId",

                    select:
                        `
        name
        brand
        category
        images
        details
        description
        `

                })

                .sort({
                    createdAt: -1
                });

        if (!orders) {

            throw new ApiError(
                404,
                "Orders Not Found"
            );

        }

        return res.status(200).json(

            new ApiResponse(

                200,

                orders,

                "Orders History Fetched Successfully"

            )

        );

    });

const orderCartProducts = asyncHandler(
    async (req, res) => {

        const { paymentType } = req.body;
        console.log("This is paymentType", paymentType)

        const userId = req.user._id;

        const cartList = await Cart.find({
            userId
        }).populate("productId");

        if (!cartList.length) {

            throw new ApiError(
                404,
                "Cart is Empty"
            );

        }

        const user =
            await User.findById(
                userId
            );

        if (
            !user.address ||
            user.address.length === 0
        ) {

            throw new ApiError(
                400,
                "Please add address before ordering"
            );

        }

        const orders = [];

        for (
            const item of cartList
        ) {

            const product =
                item.productId;

            const quantity =
                item.quantity;

            const variant =
                product.details.find(
                    detail =>
                        detail.size === item.size &&
                        detail.color === item.color
                ) ||
                product.details[0];

            const price =
                variant.price;

            if (
                variant.availabilityCount <
                quantity
            ) {

                throw new ApiError(
                    400,
                    `${product.name} is out of stock`
                );

            }

            variant.availabilityCount -=
                quantity;

            variant.sellingCount +=
                quantity;

            await product.save();

            const order =
                await Order.create({

                    productId:
                        product._id,

                    userId,

                    paymentType,

                    paymentStatus:
                        paymentType ===
                        "ONLINE",

                    orderCount:
                        quantity,

                    totalAmount:
                        quantity * price,

                    delivaryTime:
                        Date.now() +
                        7 * 24 * 60 * 60 * 1000,

                    delivaryAddress:
                        user.address[0]

                });

            orders.push(order);

        }

        await Cart.deleteMany({
            userId
        });

        res.status(200).json(

            new ApiResponse(
                200,
                orders,
                "Cart Ordered Successfully"
            )

        );

    }
);

const removeFromCart = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const { productId } = req.body;

    // find and delete cart item

    const cartItem = await Cart.findOneAndDelete({

        userId,
        productId
    });
    console.log("This is cart item after deleting from cart", cartItem);

    if (!cartItem) {

        throw new ApiError(
            404,
            "Cart item not found"
        );
    }

    return res.status(200).json(

        new ApiResponse(
            200,
            cartItem,
            "Product removed from cart successfully"
        )
    );
});
const reviewToProduct = asyncHandler(async (req, res, next) => {
    try {
        const { productId, stars, content } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const orderHistory = await Order.findOne({ userId, productId });
        if (!orderHistory) {
            throw new ApiError(500, "You have not ordered this product yet");
        }


        const { images } = req.files;
        const dbImages = await Promise.all(

            images.map(async (file) => {

                const uploadedImage =
                    await uploadOnCloudinary(file.path);

                return uploadedImage;
            })
        );
        const review = await Review.create({
            userId,
            productId,
            content,
            stars,
            images: dbImages
        })


        await review.save();
        res.status(200).json(new ApiResponse(200, review, "Review addedd Successdully"))
    } catch (error) {
        throw new ApiError(500, "Error while Reviewing a product", error)
    }
})

const deleteReviewFromProduct = asyncHandler(async (req, res, next) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;
        const review = await Review.findOneAndDelete({ productId });
        if (!review) {
            throw new ApiError(500, "Review Failed to Delete");
        }
        res.status(200).json(new ApiResponse(200, review, "Review Deleted Successfully"))
    } catch (error) {
        throw new ApiError(500, "Error while deleting Review of a product", error)


    }
})

const addAddress = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const {
        addressLine,
        village,
        mandal,
        dist,
        state,
        pinCode,
        phoneNumber
    } = req.body;

    if (
        [
            addressLine,
            village,
            mandal,
            dist,
            state,
            pinCode,
            phoneNumber
        ].some(
            item => !item || item.trim() === ""
        )
    ) {
        throw new ApiError(
            400,
            "All fields are required"
        );
    }

    const existingAddresses =
        await Address.find({
            userId
        });

    const address =
        await Address.create({

            addressLine,
            village,
            mandal,
            dist,
            state,
            pinCode,
            phoneNumber,
            userId,

            isDefault:
                existingAddresses.length === 0

        });

    await User.findByIdAndUpdate(
        userId,
        {
            $push: {
                address: address._id
            }
        }
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            address,
            "Address added successfully"
        )
    );

});

const setDefaultAddress =
asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const { addressId } = req.params;

    await Address.updateMany(
        { userId },
        {
            $set: {
                isDefault: false
            }
        }
    );

    const address =
        await Address.findOneAndUpdate(
            {
                _id: addressId,
                userId
            },
            {
                $set: {
                    isDefault: true
                }
            },
            {
                returnDocument: "after"
            }
        );

    if (!address) {
        throw new ApiError(
            404,
            "Address not found"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            address,
            "Default address updated"
        )
    );

});

const deleteAddress = asyncHandler(async (req, res, next) => {
    try {
        const { addressId } = req.body;
        const address = await Address.findByIdAndDelete(addressId);
        if (!address) {
            throw new ApiError(500, "Address not found in deleting address");
        }
        const user = await User.findById(req.user._id);
        user.address = user.address.pull(addressId);
        await user.save({ validateBeforeSave: false });
        res.status(200).json(new ApiResponse(200, address, "Address Deleted Successfully"))

    } catch (error) {
        throw new ApiError(500, "Error While Deleting Address", error)

    }

})

const replaceOrderedProduct = asyncHandler(async (req, res) => {
    const {
        oldProductId,
        newProductId,
        paymentType,
        orderId,
        oldSize,
        oldColor
    } = req.body;

    const userId = req.user._id;
    const oldProduct = await Product.findOne({
        _id: oldProductId,
        details: {
            $elemMatch: {
                size: oldSize,
                color: oldColor
            }
        }
    });
    console.log("This is old product in replacing ordered product", oldProduct);

    if (!oldProduct) {
        throw new ApiError(404, "Old product not found");
    }
    const newProduct = await Product.findById(newProductId);

    if (!newProduct) {
        throw new ApiError(404, "New product not found");
    }

    const newVariant = newProduct.details.find(
        item =>
            item.size === oldSize &&
            item.color === oldColor
    );

    if (!newVariant) {
        throw new ApiError(
            404,
            "Selected variant not found in new product"
        );
    }

    if (newVariant.availabilityCount < 1) {
        throw new ApiError(
            400,
            "New product is out of stock"
        );
    }
    const orderDetails = await Order.findById(orderId);

    if (!orderDetails) {
        throw new ApiError(404, "Order not found");
    }
    if (orderDetails.userId.toString() !== userId.toString()) {
        throw new ApiError(
            403,
            "Not authorized to replace this order"
        );
    }
    if (orderDetails.orderStatus === "cancelled") {
        throw new ApiError(
            400,
            "Cancelled orders cannot be replaced"
        );
    }
    const alreadyReplaced = await Replace.findOne({
        orderId
    });

    if (alreadyReplaced) {
        throw new ApiError(
            400,
            "Replacement already requested for this order"
        );
    }

    const totalAmount =
        newVariant.price * orderDetails.orderCount;
    const replaceOrder = await Replace.create({
        orderId,
        oldProductId,
        newProductId,
        userId,
        paymentType,
        orderStatus: "replaced successfully",
        paymentStatus: false,
        orderCount: orderDetails.orderCount,
        totalAmount,
        deliveryTime:
            Date.now() + 1000 * 60 * 60 * 24 * 7,
        isReplaced: true
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            replaceOrder,
            "Replacement order created successfully"
        )
    );
});


const updateAddress = asyncHandler(async (req, res, next) => {
    const { addressId, addressLine, village, mandal, dist, state, pinCode, phoneNumber } = req.body;
    try {
        const address = await Address.findByIdAndUpdate(addressId, {
            addressLine,
            village,
            mandal,
            dist,
            state,
            pinCode,
            phoneNumber
        }, { new: true });
        if (!address) {
            throw new ApiError(500, "Address not found in updating address");
        }
        res.status(200).json(new ApiResponse(200, address, "Address Updated Successfully"))
    } catch (error) {
        throw new ApiError(500, "Error While Updating Address", error)
    }
})

const makeAdmin = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.role = "admin";

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, user, "User promoted to admin")
    );
});

const addProduct = asyncHandler(async (req, res) => {

    const {
        category,
        name,
        description,
        deliveryTime,
        brand,
        isFeatured
    } = req.body;

    const { images } = req.files;
    const dbImages = await Promise.all(

        images.map(async (file) => {

            const uploadedImage =
                await uploadOnCloudinary(file.path);

            return uploadedImage;
        })
    );

    if (
        !category ||
        !name ||
        !description ||
        !deliveryTime
    ) {
        throw new ApiError(400, "All required fields are mandatory");
    }

    // at least one image
    if (dbImages.length === 0) {
        throw new ApiError(400, "Product images are required");
    }
    console.log("This is running", req.body.details);
    const parsedDetails = JSON.parse(req.body.details);
    console.log("These are the parsed details", parsedDetails);
    const product = await Product.create({
        category,
        name,
        description,
        images: dbImages,
        deliveryTime,
        details: parsedDetails,
        brand,
        isFeatured
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            product,
            "Product added successfully"
        )
    );
});



const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { amount } = req.body;

    const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json(
        new ApiResponse(200, order, "Razorpay order created successfully")
    );
});



const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body;

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (generatedSignature !== razorpay_signature) {
        throw new ApiError(400, "Payment verification failed");
    }



    res.status(200).json(
        new ApiResponse(200, {}, "Payment verified successfully")
    );
});


const handleRazorpayWebhook = asyncHandler(async (req, res) => {
    // Verify webhook signature and process events
    res.status(200).json({ success: true });
});


const getCart = asyncHandler(async (req, res, next) => {

    const userId = req.user._id;

    const cart = await Cart.find({ userId })
        .populate("productId");

    if (!cart) {

        throw new ApiError(
            500,
            "Cart Not Found"
        );

    }

    res.status(200).json(
        new ApiResponse(
            200,
            cart,
            "Cart Fetched Successfully"
        )
    );

});

const clearCart = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const cart = await Cart.deleteMany({ userId });
    if (!cart) {
        throw new ApiError(500, "Cart Not Found in Clearing Cart");
    }
    res.status(200).json(new ApiResponse(200, {}, "Cart Cleared Successfully"))
})

const getAddresses = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const addresses = await Address.find({ userId });
    res.status(200).json(new ApiResponse(200, addresses, "Addresses Fetched Successfully"))
})


const getProductReviews = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const reviews = await Review.find({ productId }).populate("userId", "username");
    res.status(200).json(new ApiResponse(200, reviews, "Product Reviews Fetched Successfully"));
});

const SendOtpToForgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user.email) {
        throw new ApiError(500, "Email not found from You");
    }
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("These are fine upto code", user.username, email, user.phoneNumber, user.password, verifyCode);
    const otpResult = await sendMailOTP(email, "Verification Code for Registration", `Your verification code is ${verifyCode}`, "");
    console.log("OTP result", otpResult);
    user.verifyOtp = verifyCode;
    user.verifyOtpExpire = Date.now() + 60 * 60 * 60 * 3;
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, user, "You can Enter Yout new Password"))
})


const addToWishlist = asyncHandler(async (req, res) => {

    try {

        const { productId } = req.body;
        console.log("This is product id", productId);
        console.log("This is whole body", req.body)

        const userId = req.user._id;
        console.log("this is user", userId)

        const exists =
            await WhishList.findOne({
                productId,
                userId
            });
        console.log("exist ---------------------", exists)
        if (exists) {
            console.log("already")
            return res.status(400).json({
                success: false,
                message:
                    "Already in wishlist"
            });

        }

        const wishlist =
            await WhishList.create({
                productId,
                userId
            });
        console.log("this is whishlist", wishlist)

        res.status(201).json({
            success: true,
            wishlist
        });

    } catch (error) {
        console.log(error)

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

})

const toggleWishlist =
    async (req, res) => {

        try {

            const { productId } = req.body;
            console.log("This is req.body", req.body)
            console.log("This is product Id", productId)

            const userId = req.user._id;

            const existing =
                await WhishList.findOne({
                    userId,
                    productId
                });

            console.log("This is existig ", existing);
            if (existing) {

                await WhishList.findByIdAndDelete(
                    existing._id
                );

                return res.status(200).json({
                    success: true,
                    isWishlisted: false,
                    message:
                        "Removed from wishlist"
                });

            }

            await WhishList.create({
                userId,
                productId
            });

            res.status(201).json({
                success: true,
                isWishlisted: true,
                message:
                    "Added to wishlist"
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });

        }

    };

const getWishlist = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const wishlist = await WhishList
        .find({ userId })
        .populate("productId");

    res.status(200).json(
        new ApiResponse(
            200,
            wishlist,
            "Wishlist fetched successfully"
        )
    );

});

const trackOrder = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { orderId } = req.body;
    const order = await Order.findById(orderId)
    if (!order) {
        throw new ApiError(500, "Failed in Traking Order")
    }
    res.status(200).json(new ApiResponse(200, order.orderStatus, "This is your Order Details"))
})

const sendOtpForEmailChange = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    await generateAndSendOtp(
        user,
        user.email,
        "Verify your current email"
    );
    console.log("OTP sent to email for changing email", user);
    res.status(200).json(
        new ApiResponse(200, user, "OTP sent to your current email")
    );
});
const updateEmail = asyncHandler(async (req, res) => {
    const { otp, newMail } = req.body;

    const user = await User.findById(req.user._id);
    console.log("This is user in updating email", newMail);


    if (user.verifyOtp !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (user.verifyOtpExpire < Date.now()) {
        throw new ApiError(400, "OTP expired");
    }
    console.log("This is user before updating email", user);

    user.email = newMail;// this line is might not be woriking
    user.verifyOtp = undefined;
    user.verifyOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.log("This is user after updating email 2 ", user);
    res.status(200).json(
        new ApiResponse(200, user, "Email updated successfully")
    );
});
const deleteAccount = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
                accessToken: 1,
            }

        }, {
        new: true
    })
    await User.findByIdAndDelete(req.user._id)
    res.status(200).json(new ApiResponse(200, {}, "Account Deleted Successfully"))

})

const updateUsername = asyncHandler(async (req, res, next) => {
    const { username } = req.body;
    console.log("Username from req body in updating username", username);
    const user = await User.findById(req.user._id);
    user.username = username;
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, user, 'username updated Successfully'));

})


const updatePhoneNumber = asyncHandler(async (req, res, next) => {
    const { phoneNumber } = req.body;
    const user = await User.findById(req.user._id);
    user.phoneNumber = phoneNumber;
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, user, 'Phone Number  updated Successfully'));

})
const verifyNewEmail = asyncHandler(async (req, res, next) => {// OTP generated and saved into db
    const { email } = req.body;
    console.log("Email from req body in verify new email", email);
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpResult = await sendMailOTP(email, "Verification Code for Registration", `Your verification code is ${verifyCode}`, "");
    console.log("OTP result", otpResult);
    const user = await User.findOne({ email });
    user.verifyOtp = verifyCode;
    user.verifyOtpExpire = Date.now() + 60 * 60 * 60;
    user.verifyMail = false;
    await user.save({ validateBeforeSave: false });
    // from here you should call verifyonetimepassword
    res.status(200).json(new ApiResponse(200, user, 'Otp Sended to email  Successfully'));

})

const enterOtpToVerifyEmail = asyncHandler(async (req, res, next) => {
    const { email, userOtp } = req.body;
    if (!userOtp) {
        throw new ApiError(500, "User Otp Is invalid");
    }
    const user = await User.findOne({ email });
    if (user.verifyOtpExpire < Date.now()) {
        throw new ApiError(500, "User Otp Is Expired");
    }
    if (user.verifyOtp !== userOtp) {
        throw new ApiError(500, "User Otp Is Not Matching");
    }
    user.verifyOtp = undefined;
    user.verifyMail = true;
    user.verifyOtpExpire = undefined;
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    console.log("Access token and refresh token in loggin with phone number", accessToken, refreshToken);
    const options = {
        httpOnly: true,
        secure: true
    }
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");// here see again you are trying to optimise this

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "user Logged in Successfully"))
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, user, 'Email verified Successfully'));

})



const updateBio = asyncHandler(async (req, res, next) => {
    const { bio } = req.body;
    const user = await User.findById(req.user._id);
    user.bio = bio;
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, user, 'Bio updated Successfully'));

})

const updateDateOfBirth = asyncHandler(async (req, res, next) => {
    const { dateOfBirth } = req.body;
    const user = await User.findById(req.user._id);
    user.dateOfBirth = dateOfBirth;
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, user, 'Date of birth  updated Successfully'));
})
const updateGender = asyncHandler(async (req, res, next) => {
    try {
        console.log("Gender from req body in update gender", req.body.gender);
        const { gender } = req.body;
        const user = await User.findById(req.user._id);
        user.gender = gender;
        await user.save({ validateBeforeSave: false });
        res.status(200).json(new ApiResponse(200, user, 'gender updated Successfully'));
    } catch (error) {
        throw new ApiError(500, "Error updating gender");
    }

})
const getUserProfile = asyncHandler(async (req, res, next) => {
    res.status(200).json(new ApiResponse(200, { user: req.user }, "User fetched successfully"))
})
const getNewArrivals = asyncHandler(async (req, res) => {
    const products = await Product.find({})
        .sort({ createdAt: -1 })
        .limit(10);

    res.status(200).json(
        new ApiResponse(200, products, "New arrivals fetched successfully")
    );
});

const getBestSellingProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({})
        .sort({ sellingCount: -1 })
        .limit(10);

    res.status(200).json(
        new ApiResponse(200, products, "Best selling products fetched successfully")
    );
});

const removeFromWishlist = asyncHandler(async (req, res, next) => {
    const { productId } = req.body;
    console.log("This is req.body", req.body)

    console.log("Product id from req body in removing from wishlist", productId);
    console.log("this is user id", req.user._id)
    const userWishlist = await WhishList.find({
        userId: req.user._id
    });

    console.log(userWishlist);
    const whishList = await WhishList.findOneAndDelete({
        productId,
        userId: req.user._id
    });


    console.log("This is wishlist after deleting from wishlist", whishList);

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                whishList,
                "Removed From Wishlist Successfully"
            )
        );
});

const moveWishlistToCart = asyncHandler(
    async (req, res) => {

        const userId = req.user._id;

        const wishlist = await WhishList.find({
            userId
        });

        if (!wishlist.length) {

            throw new ApiError(
                404,
                "Wishlist is Empty"
            );

        }


        for (const item of wishlist) {

            const product = await Product.findById(
                item.productId
            );


            if (!product) continue;


            const price =
                product.details?.[0]?.price || 0;
            console.log("price", price)

            const quantity = 1;

            const existedCart =
                await Cart.findOne({
                    userId,
                    productId: item.productId
                });


            if (existedCart) {

                existedCart.quantity += quantity;

                existedCart.amount =
                    existedCart.quantity * price;

                existedCart.totalAmount =
                    existedCart.quantity * price;

                await existedCart.save();

            } else {

                await Cart.create({

                    userId,

                    productId: item.productId,

                    quantity,

                    price,

                    totalAmount: price

                });

            }

        }
        console.log("Success");

        res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Wishlist moved to cart successfully"
            )
        );

    }
);


const getPublicProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
        .select("username profileImage bio referralCode createdAt");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(
        new ApiResponse(200, user, "Public profile fetched successfully")
    );
});



const filterProducts = asyncHandler(async (req, res) => {
    const { category, minPrice, maxPrice, brand } = req.query;

    const filter = {};

    if (category) {
        filter.category = category;
    }

    if (brand) {
        filter.brand = brand;
    }

    if (minPrice || maxPrice) {
        filter["details.price"] = {};

        if (minPrice) {
            filter["details.price"].$gte = Number(minPrice);
        }

        if (maxPrice) {
            filter["details.price"].$lte = Number(maxPrice);
        }
    }

    const products = await Product.find(filter);

    res.status(200).json(
        new ApiResponse(200, products, "Filtered products fetched successfully")
    );
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ isFeatured: true }).limit(10);

    res.status(200).json(
        new ApiResponse(200, products, "Featured products fetched successfully")
    );
});



const getProductsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    console.log("Category from req params in get products by category", category);

    if (!category) {
        throw new ApiError(400, "Category is required");
    }

    const products = await Product.find({
        category: {
            $regex: `^${category}$`,
            $options: "i"
        }
    });

    if (!products || products.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200,
                products,
                products.length
                    ? "Products fetched successfully"
                    : "No products found"
            )
        );
    }

    res.status(200).json(
        new ApiResponse(
            200,
            products,
            "Products fetched by category successfully"
        )
    );
});

const sortProducts = asyncHandler(async (req, res) => {
    const { sortBy = "createdAt", order = "desc" } = req.query;

    const sortOption = {};
    sortOption[sortBy] = order === "asc" ? 1 : -1;

    const products = await Product.find({}).sort(sortOption);

    res.status(200).json(
        new ApiResponse(200, products, "Products sorted successfully")
    ); f
});
const searchProducts = asyncHandler(async (req, res) => {
    const { keyword } = req.query;
    console.log("This is in backend",keyword);

    if (!keyword) {
        throw new ApiError(400, "Keyword is required");
    }
    const products = await Product.find({
    $or: [
        {
            name: {
                $regex: keyword,
                $options: "i"
            }
        },
        {
            description: {
                $regex: keyword,
                $options: "i"
            }
        },
        {
            brand: {
                $regex: keyword,
                $options: "i"
            }
        },
        {
            category: {
                $regex: keyword,
                $options: "i"
            }
        }
    ]
});
    console.log("This  is backcend result",products)

    res.status(200).json(
        new ApiResponse(200, products, "Search results fetched successfully")
    );
});



const getProductById = async (req, res) => {

    try {

        const { id } = req.params;
        console.log("Product id from req params in get product by id", id);

        const product =
            await Product.findById(id)
                .populate({
                    path: "details.reviews",
                    populate: {
                        path: "userId",
                        select:
                            "username profileImage"
                    }
                });

        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }

        let allReviews = [];

        product.details.forEach((variant) => {

            if (variant.reviews) {

                allReviews.push(
                    ...variant.reviews
                );

            }

        });

        const totalReviews =
            allReviews.length;

        const totalStars =
            allReviews.reduce(
                (sum, review) =>
                    sum + review.stars,
                0
            );

        const averageRating =
            totalReviews > 0
                ? totalStars / totalReviews
                : 0;

        res.status(200).json({

            success: true,

            product,

            reviews: allReviews,

            totalBuyers:
                product.details.reduce(
                    (sum, variant) =>
                        sum +
                        variant.sellingCount,
                    0
                ),

            averageRating

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
const getAllProducts = asyncHandler(async (req, res) => {

    const products = await Product.find({});

    const totalProducts = products.length;

    return res.status(200).json(
        new ApiResponse(
            200,
            products,
            "Products Fetched Successfully"
        )
    );

});


const generateReferralCode = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(500, "Error while Generating Referral Code");
    }
    user.inviteCode = inviteCode;
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, user, "Referral Code generated Successfully"));
})

const updateProductReview = asyncHandler(async (req, res) => {
    const { reviewId, stars, content } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    if (review.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this review");
    }

    if (stars !== undefined) {
        review.stars = stars;
    }

    if (content !== undefined) {
        review.content = content;
    }

    await review.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, review, "Review updated successfully")
    );
});

const getAddressById = asyncHandler(async (req, res, next) => {
    const { addressId } = req.body;
    const address = await Address.findById(addressId);
    if (!address) {
        throw new ApiError(500, "Address not FOund");
    }
    res.status(200).json(new ApiResponse(200, address, "Address Fetched Successfully"))

})

const returnOrderedProduct = asyncHandler(async (req, res) => {
    const { orderId, reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to return this order");
    }

    order.orderStatus = "returned";
    order.returnReason = reason;
    order.returnRequestedAt = new Date();

    await order.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, order, "Return request submitted successfully")
    );
});


const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId, status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    order.orderStatus = status;

    await order.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, order, "Order status updated successfully")
    );
});



const getOrderById = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(500, "Order Not Found in fetching order by id");
    }
    res.status(200).json(new ApiResponse(200, order, "Order Fetched Successfully"))
})



const moveToWishlist = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { productId } = req.body;
    const whishList = await WhishList.create({
        userId,
        productId
    })
    if (!whishList) {
        throw new ApiError(500, "Error while moving to WhishList");
    }
    res.status(200).json(new ApiResponse(200, whishList, "Product moved to WhishList Successfully"))
})



const updateCartQuantity = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (quantity < 1) {
        throw new ApiError(400, "Quantity must be at least 1");
    }

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    const item = await cart.items.find(
        (item) => item.productId.toString() === productId
    );

    if (!item) {
        throw new ApiError(404, "Product not found in cart");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    item.quantity = quantity;
    item.amount = product.details.price * quantity;

    cart.totalAmount = cart.items.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    await cart.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, cart, "Cart quantity updated successfully")
    );
});


const disLikeReview = asyncHandler(async (req, res, next) => {

    const { reviewId } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    // check already disliked
    const alreadyDisliked = await DisLike.findOne({
        reviewId,
        userId
    });

    console.log(
        "Already disliked result in disliking review",
        alreadyDisliked
    );

    // remove dislike
    if (alreadyDisliked) {

        const removeDislike = await DisLike.findOneAndDelete({
            reviewId,
            userId
        });

        if (review.disLikeCount > 0) {
            review.disLikeCount -= 1;
        }

        await review.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    removeDislike,
                    "Dis Like removed Successfully"
                )
            );
    }

    // remove like if exists
    const isLiked = await Like.findOne({
        reviewId,
        userId
    });

    if (isLiked) {

        await Like.findOneAndDelete({
            reviewId,
            userId
        });

        if (review.likeCount > 0) {
            review.likeCount -= 1;
        }
    }

    // create dislike
    const dislike = await DisLike.create({
        reviewId,
        userId
    });

    review.disLikeCount += 1;

    await review.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                dislike,
                "Disliked Successfully"
            )
        );

});

const likeReview = asyncHandler(async (req, res, next) => {

    const { reviewId } = req.body;

    console.log("Review ID from req body in like review", reviewId);

    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    console.log("This is review in like review", review);

    // Check already liked or not
    const alreadyLiked = await Like.findOne({
        reviewId,
        userId
    });

    console.log("Already liked result in like review", alreadyLiked);

    // If already liked -> unlike
    if (alreadyLiked) {

        const deletedLike = await Like.findOneAndDelete({
            reviewId,
            userId
        });
        if (review.likeCount > 0) {
            review.likeCount -= 1;
        }

        await review.save({ validateBeforeSave: false });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    deletedLike,
                    likeCount: review.likeCount
                },
                "Like removed successfully"
            )
        );
    }

    // Check dislike
    const alreadyDisliked = await DisLike.findOne({
        reviewId,
        userId
    });

    console.log("Already disliked result in like review", alreadyDisliked);

    // If disliked -> remove dislike
    if (alreadyDisliked) {

        await DisLike.findOneAndDelete({
            reviewId,
            userId
        });
        if (review.disLikeCount > 0) {
            review.disLikeCount -= 1;
        }
    }

    console.log("This is review before liking", review);

    // Create like
    const like = await Like.create({
        reviewId,
        userId
    });

    console.log("This is like document after creating like", like);

    review.likeCount += 1;

    console.log("This is review after liking", review);

    await review.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                like,
                likeCount: review.likeCount
            },
            "Review liked successfully"
        )
    );

})


//const removeCoupon = asyncHandler(async (req, res, next) => {
//
//
//})
//
//const applyCoupon = asyncHandler(async (req, res, next) => {
//
//})
//
//
//const validateCoupon = asyncHandler(async (req, res, next) => {
//
//})
//
//const applyReferralCode = asyncHandler(async (req, res, next) => {
//
//
//})
export {
    registerUser,
    LogginWithPhoneNumber,
    LogginWithEmail,
    Logout,
    changeCurrectPassword,
    getCurrentUser,
    refreshToken,
    updateProfileImage,
    verifyOneTimePassword,
    resendOtp,
    addToCart,
    toggleWishlist,
    cancellOrederedProduct,
    checkOrdersHistory,
    orderCartProducts,
    removeFromCart,
    reviewToProduct,
    deleteReviewFromProduct,
    addAddress,
    deleteAddress,
    updateAddress,
    replaceOrderedProduct,
    handleRazorpayWebhook,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getCart,
    clearCart,
    getAddresses,
    setDefaultAddress,
    getProductReviews,
    SendOtpToForgotPassword,
    addToWishlist,
    getWishlist,
    trackOrder,
    makeAdmin,
    // deactivateAccount, what is mean by de activate how to do thhis
    deleteAccount,
    updateUsername,
    updateEmail,
    enterOtpToVerifyEmail,
    sendOtpForEmailChange,
    updatePhoneNumber,
    verifyNewEmail,
    updateBio,
    updateDateOfBirth,
    updateGender,
    getUserProfile,
    getPublicProfile,
    getAllProducts,
    getProductById,
    generateReferralCode,
    searchProducts,
    filterProducts,
    sortProducts,
    getProductsByCategory,
    getFeaturedProducts,
    getNewArrivals,
    getBestSellingProducts,
    removeFromWishlist,
    moveWishlistToCart,
    //applyReferralCode,
    //applyCoupon,
    //removeCoupon,
    //validateCoupon,
    getOrderById,
    updateOrderStatus,
    returnOrderedProduct,
    getAddressById,
    updateProductReview,
    likeReview,
    disLikeReview,
    updateCartQuantity,
    moveToWishlist,
    addProduct,
    orderProduct,


}


