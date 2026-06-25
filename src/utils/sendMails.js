import nodemailer from "nodemailer";
import transporter from "../config/emailTransporter.config.js";
import {asyncHandler} from "./asyncHandler.js";
const sendMailOTP = async (sendTo, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL,
            to:sendTo,
            subject: subject, 
            text: text,
            html: html, 
        });
        
        console.log("Message sent: %s", info.messageId);
        // Preview URL is only available when using an Ethereal test account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return info;
    } catch (err) {
        console.error("Error while sending mail:", err);
    }

}

export {sendMailOTP};
