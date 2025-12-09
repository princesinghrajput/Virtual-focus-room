const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload to Cloudinary
const uploadToCloudinary = async (file, folder = 'focus-room') => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder,
            resource_type: 'auto' // Automatically detect file type
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
            type: result.resource_type
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

module.exports = { cloudinary, uploadToCloudinary };
