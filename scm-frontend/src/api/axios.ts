import axios from 'axios';

// Handle Render providing just the hostname
const rawUrl = import.meta.env.VITE_API_URL;
const baseURL = rawUrl
    ? (rawUrl.startsWith('http') ? `${rawUrl}/api` : `https://${rawUrl}/api`)
    : 'http://localhost:5000/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
