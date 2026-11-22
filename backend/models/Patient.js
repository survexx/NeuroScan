import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    age: {
        type: Number,
        default: null
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', null],
        default: null
    },
    contactNumber: {
        type: String,
        default: ''
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password:{
        type: String,
        required: true,
        select: false
    }
}, {timestamps: true});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;