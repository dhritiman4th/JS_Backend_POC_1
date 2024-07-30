import {v2 as cloudinary} from 'cloudinary';
// NOTE:- In the above line v2 indicates the version of the Cloudinary API that we are using.
import fs from "fs";
import { ApiError } from './ApiError.js';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, 
        { 
            resource_type: "auto" 
        })
        // file has been uploaded successfully
        // console.log(`File is uploaded on cloudinary : \n ---${response.url}\n---${response.secure_url}\n---${response}`);
        fs.unlinkSync(localFilePath);
        return response;
    } catch(error) {
        fs.unlinkSync(localFilePath); // NOTES: - Remove the locally saved temporary file as the upload operation got failed
    }
}

const deleteFromCloudinary = async (cloudUrl) => {
    try {
        if (!cloudUrl) {
            return null;
        }

        const urlComponents = cloudUrl.toString().split("/");
        let publicId;
        if (urlComponents.length > 0) {
            const lastComponent = urlComponents[urlComponents.length - 1];
            publicId = lastComponent.toString().split(".")[0];
        }
        const response = await cloudinary.uploader.destroy(
            publicId
        );
        return response;
    } catch (error) {
        throw new ApiError(500, "Error while deleting file from cloud");
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
};