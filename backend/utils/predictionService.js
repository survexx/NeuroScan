import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

function getMlServiceUrl() {
    return (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

export async function predictFromFastApi(file) {
    const form = new FormData();
    const stream = fs.createReadStream(file.path);
    form.append('file', stream, {
        filename: file.originalname,
        contentType: file.mimetype,
        knownLength: file.size
    });

    try {
        const response = await axios.post(`${getMlServiceUrl()}/predict`, form, {
            headers: form.getHeaders(),
            timeout: Number(process.env.ML_REQUEST_TIMEOUT_MS || 60000),
            maxContentLength: 10 * 1024 * 1024,
            maxBodyLength: 10 * 1024 * 1024,
            params: { gradcam: false }
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const detail = error.response.data?.detail;
            const upstreamError = new Error(detail || 'FastAPI could not process the image');
            upstreamError.status = status === 400 ? 400 : 502;
            upstreamError.code = 'FASTAPI_ERROR';
            throw upstreamError;
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
            const unavailable = new Error('The prediction service is unavailable');
            unavailable.status = 503;
            unavailable.code = 'ML_SERVICE_UNAVAILABLE';
            throw unavailable;
        }

        if (error.code === 'ECONNABORTED') {
            const timeoutError = new Error('The prediction service timed out');
            timeoutError.status = 504;
            timeoutError.code = 'ML_SERVICE_TIMEOUT';
            throw timeoutError;
        }

        const unexpected = new Error('Unable to communicate with the prediction service');
        unexpected.status = 502;
        unexpected.code = 'ML_SERVICE_ERROR';
        throw unexpected;
    }
}

export async function checkFastApiHealth() {
    const response = await axios.get(`${getMlServiceUrl()}/health`, {
        timeout: Number(process.env.ML_REQUEST_TIMEOUT_MS || 10000)
    });
    return response.data;
}
