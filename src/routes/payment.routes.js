import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

const razorpay = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_KEY_SECRET
});


router.post(
"/create-razorpay-order",
async (req, res) => {

    try {

        const { amount } = req.body;

        if (!amount) {

            return res.status(400).json({
                success: false,
                message: "Amount is required"
            });

        }

        const options = {

            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`

        };

        const order =
            await razorpay.orders.create(
                options
            );

        return res.status(200).json({
            success: true,
            data: order
        });

    }
    catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}


);

// Verify Payment
router.post(
"/verify-razorpay-payment",
async (req, res) => {


    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    `${razorpay_order_id}|${razorpay_payment_id}`
                )
                .digest("hex");

        if (
            generatedSignature !==
            razorpay_signature
        ) {

            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });

        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });

    }
    catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}

);

export default router;
