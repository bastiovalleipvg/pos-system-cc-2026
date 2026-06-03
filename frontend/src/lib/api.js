import axios from 'axios';

// TODO: En producción, esta URL debe apuntar al Load Balancer / API Gateway del backend
// No hardcodear URLs. Usar únicamente variables de entorno.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Habilitar envío de cookies HttpOnly
});

api.interceptors.request.use((config) => {
  // El token ahora se envía automáticamente mediante cookies (withCredentials: true)
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
