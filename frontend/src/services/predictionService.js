import axios from 'axios';
import { getAuthorizationHeader } from './authService';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const PREDICTION_ENDPOINT = '/api/predictions/predict';

const predictionApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000
});

predictionApi.interceptors.request.use((config) => {
    config.headers = { ...config.headers, ...getAuthorizationHeader() };
    return config;
});

export async function predictBrainTumor(imageFile) {
    if (!imageFile) throw new Error('An MRI image is required.');

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
        const response = await predictionApi.post(PREDICTION_ENDPOINT, formData);
        return response.data;
    } catch (error) {
        const serverMessage = error.response?.data?.message;
        throw new Error(serverMessage || 'Unable to reach the prediction service. Check that the backend is running.');
    }
}

export async function checkPredictionHealth() {
    const response = await predictionApi.get('/api/predictions/health');
    return response.data;
}

export async function getPredictionHistory(page = 1, limit = 10) {
    const response = await predictionApi.get('/api/predictions/history', {
        params: { page, limit }
    });
    return response.data;
}

export async function getPredictionHistoryDetail(id) {
    const response = await predictionApi.get(`/api/predictions/history/${id}`);
    return response.data;
}
