const rateLimit = require("express-rate-limit");

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

module.exports = { loginLimiter };

/* 
Para probar:
# Health check — debe responder inmediatamente
curl http://localhost:3001/health
# → {"status":"ok","timestamp":"..."}

# Enviar 6 intentos de login seguidos — el 6to debe dar 429
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{}"

El endpoint /api/products, /api/sales, etc. no están limitados, 
por lo que el cajero puede escanear sin restricciones.
*/
