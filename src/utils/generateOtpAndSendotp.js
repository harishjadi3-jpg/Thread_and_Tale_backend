import { sendMailOTP } from "./sendMails.js";

const generateAndSendOtp = async (
    user,
    email,
    subject = "Verification Code"
) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.verifyOtp = otp;
    user.verifyOtpExpire = Date.now() + 10 * 60 * 1000; 

    await user.save({ validateBeforeSave: false });

    await sendMailOTP(
        email,
        subject,
        `Your verification code is ${otp}`,
        ""
    );

    return otp;
};

export { generateAndSendOtp };