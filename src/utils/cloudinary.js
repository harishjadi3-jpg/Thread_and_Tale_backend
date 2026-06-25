import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';
import fs from 'fs';


// while debugging you moverd this configuration into inside the function
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder:'ecommerce_useres_profileImages'


        });
        fs.unlinkSync(localFilePath)
        
        return result.url;

    } catch (error) {
        fs.unlinkSync(localFilePath)
        
        throw new ApiError(error, 500);
    }

}

export { uploadOnCloudinary }
