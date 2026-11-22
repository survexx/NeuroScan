import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';

export async function requireAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization || '';
        const [scheme, headerToken] = authorization.split(' ');
        const token = scheme === 'Bearer' && headerToken ? headerToken : (req.query.token || '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const patient = await Patient.findById(decoded.sub).select('-password');

        if (!patient) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        req.user = patient;
        req.userId = patient._id;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }
}
