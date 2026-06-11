import axios from 'axios';

/**
 * Cliente HTTP centralizado — Axios.
 *
 * En producción, todas las llamadas usan rutas relativas (/api/...).
 * Next.js las redirige al backend vía proxy rewrite (next.config.js),
 * manteniendo las cookies same-origin y el tráfico dentro de la red privada de Azure.
 *
 * En desarrollo, el mismo proxy redirige a http://localhost:3001.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Envío automático de cookies HttpOnly
});

api.interceptors.request.use((config) => {
  // El token se envía automáticamente mediante cookies (withCredentials: true).
  // No se necesita header Authorization manual.
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Evitar bucle infinito: no redirigir si ya estamos en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?alert=unauth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
