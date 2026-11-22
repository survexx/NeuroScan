import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from './config/db.js';
import authRouter from './routers/Auth.js';
import predictionRouter from './routers/Prediction.js';

if (!process.env.JWT_SECRET) {
    console.error('Backend startup failed: JWT_SECRET is missing');
    process.exit(1);
}

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

const startServer = async () => {
    try {
        await connectDB();

        app.use('/api/auth', authRouter);
        app.use('/api/predictions', predictionRouter);

        app.use((req, res) => {
            return res.status(404).json({ success: false, message: 'Route not found' });
        });

        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`);
        });
    } catch (error) {
        console.error('Backend startup failed:', error.message);
        process.exit(1);
    }
};

startServer();