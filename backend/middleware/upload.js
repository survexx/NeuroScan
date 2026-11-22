import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);
const UPLOAD_DIRECTORY = path.resolve('uploads');

fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, callback) => callback(null, UPLOAD_DIRECTORY),
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        callback(null, uniqueName);
    }
});

export const uploadMri = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
        callback(null, true);
    }
});

export function validateImageFile(file) {
    if (!file) {
        return 'An MRI image file is required.';
    }

    if (file.size > 10 * 1024 * 1024) {
        return 'Image too large (maximum 10 MB).';
    }

    const bytes = fs.readFileSync(file.path);
    if (!bytes || bytes.length < 12) {
        return 'The uploaded file is not a valid JPEG or PNG image.';
    }

    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
        && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;

    if (!isJpeg && !isPng) {
        fs.unlinkSync(file.path);
        return 'The uploaded file is not a valid JPEG or PNG image.';
    }

    return null;
}

export { UPLOAD_DIRECTORY };
