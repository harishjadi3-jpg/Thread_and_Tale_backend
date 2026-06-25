import { Router } from "express";

import {
    //user Authentication and Updates
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
    SendOtpToForgotPassword,// here
    deleteAccount,

    //cart feactures
    addToCart,
    removeFromCart,
    orderCartProducts,
    getCart,
    updateCartQuantity,
    clearCart,

    //order Feactures
    cancellOrederedProduct,
    checkOrdersHistory,
    replaceOrderedProduct,
    trackOrder,
    getOrderById,
    updateOrderStatus,
    toggleWishlist,
    returnOrderedProduct,


    //review feactures
    reviewToProduct,
    deleteReviewFromProduct,
    getProductReviews,
    updateProductReview,
    likeReview,
    disLikeReview,




    handleRazorpayWebhook,
    createRazorpayOrder,
    verifyRazorpayPayment,



    //Wishlist feactures
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    moveWishlistToCart,
    moveToWishlist,

    //user profile feactures
    updateUsername,
    sendOtpForEmailChange,
    updateEmail,
    updatePhoneNumber,
    verifyNewEmail, // here 
    enterOtpToVerifyEmail,
    updateBio,
    updateDateOfBirth,
    updateGender,
    getUserProfile,
    getPublicProfile,//here
    getAddressById,
    addAddress,
    deleteAddress,
    updateAddress,
    getAddresses,
    setDefaultAddress,
    makeAdmin,
    addProduct,

    

    //product feactures
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
    orderProduct,





} from "../controllers/user.controller.js"

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/register").post(
    upload.fields([
        {
            name: "profileImage",
            maxCount: 1
        }
    ]),
    registerUser
)

// Authentication 
router.route("/logginwithphonenumber").post(LogginWithPhoneNumber)
router.route("/logginwithemail").post(LogginWithEmail)
router.route("/verifynewemail").post(verifyNewEmail) //storing otp
router.route("/enterotptoverifyemail").post(enterOtpToVerifyEmail)
router.route("/logout").post(verifyJWT, Logout)
router.route("/verifyOtp").post(verifyOneTimePassword)
router.route("/resendOtp").post(resendOtp)
router.route("/refreshtoken").post(verifyJWT, refreshToken)
router.route("/deleteaccount").delete(verifyJWT, deleteAccount)
router.route("/sendotptoforgotPassword").post(verifyJWT, SendOtpToForgotPassword)

//user Updates
router.route("/changepassword").post(verifyJWT, changeCurrectPassword)
router.route("/profile").get(verifyJWT, getCurrentUser)
router.route("/updateprofileimage").patch(
    verifyJWT,
    upload.fields([
        {
            name: "profileImage",
            maxCount: 1
        }]),
    updateProfileImage
);

router.route("/updateusername").patch(verifyJWT, updateUsername)
router.route("/sendotptoupdateemail").post(verifyJWT,sendOtpForEmailChange)
router.route("/updateemail").patch(verifyJWT,updateEmail)
router.route("/updatephonenumber").patch(verifyJWT, updatePhoneNumber)
router.route("/updatebio").patch(verifyJWT,updateBio)
router.route("/updatedateofbirth").patch(verifyJWT, updateDateOfBirth)
router.route("/updategender").patch(verifyJWT, updateGender)
router.route("/getuserprofile").get(verifyJWT, getUserProfile)
router.route("/getaddressbyid").get(verifyJWT, getAddressById)
router.route("/address/add-address").post(verifyJWT, addAddress)
router.route("/updateaddress").patch(verifyJWT, updateAddress)
router.route("/address/delete-address").delete(verifyJWT, deleteAddress)
router.route("/getaddresses").get(verifyJWT, getAddresses)
router.route("/address/set-default/:addressId").patch(verifyJWT, setDefaultAddress)
router.route("/makeadmin").post(verifyJWT, makeAdmin)
router.route("/addproduct").post(verifyJWT,verifyAdmin,
    upload.fields([
        {
            name: "images"
        }
    ]),
    addProduct)

router.route("/toggle-wishlist").post(verifyJWT,toggleWishlist)

router.route("/addtocart").post(verifyJWT, addToCart)
router.route("/removefromcart").delete(verifyJWT, removeFromCart)
router.route("/orderCartProducts").post(verifyJWT, orderCartProducts)
router.route("/getcart").get(verifyJWT, getCart)
router.route("/clearcart").delete(verifyJWT, clearCart)
router.route("/cancellorderedproduct").post(verifyJWT, cancellOrederedProduct)
router.route("/checkordershistory").get(verifyJWT, checkOrdersHistory)
router.route("/replaceorderedproduct").post(verifyJWT, replaceOrderedProduct) 
router.route("/orderproduct").post(verifyJWT, orderProduct)
router.route("/trackorder").get(verifyJWT, trackOrder)
router.route("/getorderbyid").get(verifyJWT, getOrderById)
router.route("/updateorderstatus").patch(verifyJWT,verifyAdmin, updateOrderStatus)
router.route("/returnorderedproduct").post(verifyJWT, returnOrderedProduct)

router.route("/reviewtoproduct").post(verifyJWT, upload.fields([
    {
        name: "images",
        maxCount: 5
    }
]), reviewToProduct)
router.route("/deleteReviewFromProduct").delete(verifyJWT, deleteReviewFromProduct)
router.route("/getproductreviews").get(getProductReviews)
router.route("/updateproductreview").patch(verifyJWT, updateProductReview)

router.route("/likereview").post(verifyJWT, likeReview)
router.route("/dislikereview").post(verifyJWT, disLikeReview)

router.route("/addtowishlist").post(verifyJWT, addToWishlist)
router.route("/getwishlist").get(verifyJWT, getWishlist)
router.route("/removefromwishlist").delete(verifyJWT, removeFromWishlist)
router.route("/movetowishlist").post(verifyJWT, moveToWishlist)
router.route("/movewishlisttocart").post(verifyJWT, moveWishlistToCart)

router.route("/getallproducts").get(getAllProducts)
router.get("/getproductbyid/:id",getProductById);

router.route("/generateReferralCode").get(verifyJWT, generateReferralCode)
router.route("/searchproducts").get(searchProducts)
router.route("/filterproducts").get(filterProducts)
router.route("/sortproducts").get(sortProducts)
router.get("/get-products/:category", getProductsByCategory);
router.route("/getfeaturedproducts").get(getFeaturedProducts)
router.route("/getnewarrivals").get(getNewArrivals)
router.route("/getbestsellingproducts").get(getBestSellingProducts)


export default router


