import crypto from "crypto";

export const createRazorpayOrder =
async (req, res) => {


try {

    const { amount } =
        req.body;

    if (!amount) {

        return res.status(400)
        .json({
            success:false,
            message:"Amount required"
        });

    }

    const options = {

        amount:
            amount * 100,

        currency:
            "INR",

        receipt:
            `receipt_${Date.now()}`

    };

    const order =
        await razorpay.orders.create(
            options
        );

    return res.status(200).json({

        success:true,

        data:order

    });

}
catch(error){

    return res.status(500).json({

        success:false,

        message:error.message

    });

}

};

export const verifyRazorpayPayment =
async (req,res)=>{


try{

    const {

        razorpay_order_id,

        razorpay_payment_id,

        razorpay_signature

    } = req.body;

    const generatedSignature =

        crypto
        .createHmac(

            "sha256",

            process.env
            .RAZORPAY_KEY_SECRET

        )

        .update(

            razorpay_order_id +
            "|" +
            razorpay_payment_id

        )

        .digest("hex");

    if(

        generatedSignature !==
        razorpay_signature

    ){

        return res.status(400)
        .json({

            success:false,

            message:
            "Verification Failed"

        });

    }

    return res.status(200)
    .json({

        success:true,

        message:
        "Payment Verified"

    });

}
catch(error){

    return res.status(500)
    .json({

        success:false,

        message:error.message

    });

}


};
