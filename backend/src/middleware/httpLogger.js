'use strict';

/**
 * Middleware de logging HTTP
 *
 * Registra cada petición entrante con nivel "http" en Winston.
 * Captura: método, URL, status code, duración en ms e IP del cliente.
 *
 * Uso en app.js (antes de las rutas):
 *   const { httpLogger } = require('./middleware/httpLogger');
 *   app.use(httpLogger);
 */

const logger = require('../config/logger');

/**
 * Middleware Express que loguea cada request al finalizar la respuesta.
 * Se engancha en el evento 'finish' del response para capturar el status code real.
 */
const httpLogger = (req, res, next) => {
  const startTime = Date.now();

  // Obtener IP del cliente (considera reverse proxy / load balancer)
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode }          = res;

    // Nivel dinámico: errores del servidor en 'error', del cliente en 'warn', resto en 'http'
    const level =
      statusCode >= 500 ? 'error' :
      statusCode >= 400 ? 'warn'  :
      'http';

    logger[level](`${method} ${originalUrl} ${statusCode} — ${duration}ms`, {
      method,
      url:    originalUrl,
      status: statusCode,
      durationMs: duration,
      ip,
    });
  });

  next();
};

module.exports = { httpLogger };
