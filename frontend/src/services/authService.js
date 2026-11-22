import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const authApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000
});

const TOKEN_KEY = 'neuroscan_token';
const USER_KEY = 'neuroscan_user';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getSavedUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
        return null;
    }
}

export function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export async function registerAccount(payload) {
    const response = await authApi.post('/api/auth/register', payload);
    return response.data;
}

export async function loginAccount(payload) {
    const response = await authApi.post('/api/auth/login', payload);
    return response.data;
}

export async function getCurrentUser() {
    const response = await authApi.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
}

export function getAuthorizationHeader() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
