import streamifier from "streamifier";
import { cloudinary } from "../../config/cloudinary.js";

function uploadBufferToCloudinary(buffer, folder = "bkswealthclub") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export const uploadsService = {
  uploadSingle: async ({ file, folder }) => {
    if (!file) return null;

    if (!cloudinary.config().cloud_name) {
      return {
        url: "",
        publicId: "",
        note: "Cloudinary not configured. Returned placeholder upload response.",
      };
    }

    const result = await uploadBufferToCloudinary(file.buffer, folder || "bkswealthclub");
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  },
};
