// once users uploades a file we save it our server then we save it to cloudinary

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({
    path: "./.env",
});

//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: auto,
        });
        console.log("File uploaded on cloudinary. File src ", response.url);

        // once uploaded to cloudinary we need to delete it from our server
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.log("Error in cloudinary ", error);
        fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        consrt result = clodinary.uploader.destroy(publicId);
        console.log("deleted from clodinary ",publicId)


    } catch (errror) {
        console.log("Error deleting from clodinary", error);
        return null;
    }
};

export { uploadOnCloudinary,deleteFromCloudinary };
