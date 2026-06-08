const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Máximo 200 peticiones por IP para no bloquear uso normal del POS
  message: {
    error: "Demasiadas peticiones a la API, por favor intente de nuevo después de 15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador específico para el endpoint de login.
// NO se aplica globalmente para no afectar operaciones legítimas de alta frecuencia
// (ej: cajero escaneando productos rápidamente).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 5, // Máximo 5 intentos por IP en la ventana
  message: {
    error:
      "Demasiados intentos de inicio de sesión desde esta IP, por favor intente de nuevo después de 15 minutos",
  },
  standardHeaders: true, // Retorna info del límite en cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*` (deprecadas)
});

module.exports = { loginLimiter, globalLimiter };
