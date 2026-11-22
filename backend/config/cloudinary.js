import { v2 as cloudinary } from 'cloudinary';

export function configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary is not configured');
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
    });

    return cloudinary;
}

export function uploadToCloudinary(filePath, originalName) {
    const client = configureCloudinary();

    return client.uploader.upload(filePath, {
        folder: 'brain-tumor-mri',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        filename_override: originalName
    });
}
