import mongoose from 'mongoose';

const predictionRecordSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        default: null
    },
    tumorDetected: {
        type: Boolean,
        required: true
    },
    tumorType: {
        type: String,
        required: true,
        trim: true
    },
    confidenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    probabilities: {
        type: Map,
        of: Number,
        default: {}
    },
    originalImageName: {
        type: String,
        trim: true,
        default: ''
    },
    imageUrl: {
        type: String,
        trim: true,
        default: ''
    },
    cloudinaryPublicId: {
        type: String,
        trim: true,
        default: ''
    },
    localImagePath: {
        type: String,
        trim: true,
        default: ''
    },
    predictedAt: {
        type: Date,
        default: Date.now
    },
    doctorNotes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.models.PatientRecord 
    || mongoose.model('PatientRecord', predictionRecordSchema);