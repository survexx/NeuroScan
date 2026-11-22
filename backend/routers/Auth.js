import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function createToken(patient) {
    return jwt.sign(
        { sub: patient._id.toString(), email: patient.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function publicUser(patient) {
    return {
        id: patient._id.toString(),
        name: patient.fullName,
        email: patient.email
    };
}

router.post('/register', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (name.length < 2) {
            return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }

        const existing = await Patient.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const patient = await Patient.create({ fullName: name, email, password: passwordHash });
        const token = createToken(patient);

        return res.status(201).json({ success: true, token, user: publicUser(patient) });
    } catch (error) {
        console.error('Registration failed:', error.message);
        return res.status(500).json({ success: false, message: 'Account could not be created.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const patient = await Patient.findOne({ email }).select('+password');
        if (!patient || !(await bcrypt.compare(password, patient.password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = createToken(patient);
        return res.json({ success: true, token, user: publicUser(patient) });
    } catch (error) {
        console.error('Login failed:', error.message);
        return res.status(500).json({ success: false, message: 'Login could not be completed.' });
    }
});

router.get('/me', requireAuth, (req, res) => {
    return res.json({ success: true, user: publicUser(req.user) });
});

export default router;
