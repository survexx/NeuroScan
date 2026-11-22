import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { uploadMri, validateImageFile, UPLOAD_DIRECTORY } from '../middleware/upload.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { predictFromFastApi, checkFastApiHealth } from '../utils/predictionService.js';
import PatientRecord from '../models/PatientRecord.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/files/:filename', async (req, res) => {
    try {
        const record = await PatientRecord.findOne({
            patientId: req.userId,
            localImagePath: { $regex: `${path.basename(req.params.filename).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$` }
        });

        if (!record) return res.status(404).json({ success: false, message: 'Image not found' });

        const filePath = path.resolve(record.localImagePath);
        if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Image not found' });
        return res.sendFile(filePath);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Image could not be loaded' });
    }
});

function normalizePrediction(data) {
    if (!data || typeof data.label !== 'string'
        || typeof data.confidence !== 'number'
        || !data.probabilities || typeof data.probabilities !== 'object') {
        const error = new Error('The prediction service returned an invalid response');
        error.status = 502;
        throw error;
    }

    return {
        prediction: data.label,
        confidence: data.confidence,
        probabilities: data.probabilities
    };
}

router.post('/predict', uploadMri.single('file'), async (req, res) => {
    const validationError = validateImageFile(req.file);
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }

    let cloudinaryUpload = null;

    try {
        const predictionResponse = await predictFromFastApi(req.file);
        const result = normalizePrediction(predictionResponse);

        try {
            cloudinaryUpload = await uploadToCloudinary(req.file.path, req.file.originalname);
        } catch (cloudinaryError) {
            console.error('Cloudinary upload failed:', cloudinaryError.message);
        }

        const localFileName = path.basename(req.file.path);
        const localImageUrl = `${req.protocol}://${req.get('host')}/api/predictions/files/${encodeURIComponent(localFileName)}`;

        let savedToHistory = true;
        let recordId = null;
        try {
            const record = await PatientRecord.create({
                patientId: req.userId,
                tumorDetected: !['notumor', 'no tumor', 'no_tumor'].includes(result.prediction.toLowerCase()),
                tumorType: result.prediction,
                confidenceScore: result.confidence,
                probabilities: result.probabilities,
                originalImageName: req.file.originalname,
                imageUrl: cloudinaryUpload?.secure_url || '',
                cloudinaryPublicId: cloudinaryUpload?.public_id || '',
                localImagePath: req.file.path,
                predictedAt: new Date()
            });
            recordId = record._id.toString();
        } catch (databaseError) {
            savedToHistory = false;
            console.error('Prediction history save failed:', databaseError.message);
        }

        return res.status(savedToHistory ? 200 : 202).json({
            success: true,
            savedToHistory,
            recordId,
            imageUrl: cloudinaryUpload?.secure_url || null,
            localImageUrl,
            prediction: result.prediction,
            confidence: result.confidence,
            probabilities: result.probabilities
        });
    } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Image too large (maximum 10 MB).'
                : 'Invalid or missing image upload.';
            return res.status(400).json({ success: false, message });
        }

        const status = error.status || 502;
        return res.status(status).json({ success: false, message: error.message });
    }
});

router.get('/health', async (req, res) => {
    try {
        const health = await checkFastApiHealth();
        return res.json({ success: true, mlService: health });
    } catch (error) {
        return res.status(error.code === 'ECONNABORTED' ? 504 : 503).json({
            success: false,
            message: 'The prediction service is unavailable'
        });
    }
});

function normalizeProbabilities(probabilities) {
    if (!probabilities) return {};
    if (typeof probabilities.entries === 'function') {
        return Object.fromEntries(Array.from(probabilities.entries()));
    }
    if (typeof probabilities.toObject === 'function') {
        return probabilities.toObject();
    }
    if (typeof probabilities === 'object') {
        return probabilities;
    }
    return {};
}

function mapHistoryRecord(record, req) {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    return {
        id: record._id.toString(),
        filename: record.originalImageName,
        prediction: record.tumorType,
        tumorDetected: record.tumorDetected,
        confidence: record.confidenceScore,
        confidenceDisplay: typeof record.confidenceScore === 'number'
            ? `${(record.confidenceScore * 100).toFixed(1)}%`
            : 'N/A',
        probabilities: record.probabilities ? normalizeProbabilities(record.probabilities) : {},
        imageUrl: record.imageUrl,
        localImageUrl: record.localImagePath
            ? `${req.protocol}://${req.get('host')}/api/predictions/files/${encodeURIComponent(path.basename(record.localImagePath))}?token=${encodeURIComponent(token)}`
            : '',
        createdAt: record.predictedAt || record.createdAt
    };
}

router.get('/history', async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page || '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '10', 10) || 10, 1), 100);
        const filter = { patientId: req.userId };
        const total = await PatientRecord.countDocuments(filter);
        const records = await PatientRecord.find(filter)
            .sort({ predictedAt: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return res.json({
            success: true,
            records: records.map((record) => mapHistoryRecord(record, req)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error('Prediction history fetch failed:', error.message);
        return res.status(500).json({ success: false, message: 'Prediction history could not be loaded' });
    }
});

router.get('/history/:id', async (req, res) => {
    try {
        const record = await PatientRecord.findOne({ _id: req.params.id, patientId: req.userId }).lean();
        if (!record) return res.status(404).json({ success: false, message: 'Prediction record not found' });
        return res.json({ success: true, record: mapHistoryRecord(record, req) });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Prediction record not found' });
        }
        return res.status(500).json({ success: false, message: 'Prediction record could not be loaded' });
    }
});

export default router;