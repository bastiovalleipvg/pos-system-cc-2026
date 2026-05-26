'use strict';

/**
 * Logger central — Winston + Azure Application Insights
 *
 * Comportamiento por entorno:
 *  - development : salida colorizada en consola.
 *  - production  : JSON estructurado en consola + transport a Application Insights
 *                  (activo solo si APPLICATIONINSIGHTS_CONNECTION_STRING está definida).
 *
 * Uso:
 *   const logger = require('./config/logger');
 *   logger.info('Mensaje', { clave: 'valor' });
 *   logger.error('Error', { message: err.message, stack: err.stack });
 */

const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = format;

// ─── Nivel de log ─────────────────────────────────────────────────────────────
// Controla la verbosidad sin tocar código.
// En .env: LOG_LEVEL=debug | info | warn | error   (default: info)
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const IS_PROD   = process.env.NODE_ENV === 'production';

// ─── Formato para desarrollo ──────────────────────────────────────────────────
// Legible en terminal: "[2026-05-26 13:00:00] INFO: Mensaje { meta }"
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] ${level}: ${stack || message}${metaStr}`;
  }),
);

// ─── Formato para producción ──────────────────────────────────────────────────
// JSON estructurado: compatible con Azure Monitor, Datadog, ELK, etc.
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

// ─── Transports base ─────────────────────────────────────────────────────────
const loggerTransports = [
  new transports.Console({
    format: IS_PROD ? prodFormat : devFormat,
  }),
];

// ─── Transport de Application Insights (solo si la connection string existe) ──
// El SDK de applicationinsights ya debe estar inicializado en server.js ANTES
// de que este módulo sea requerido. Aquí solo agregamos el transport de Winston
// que envía los logs como "traces" a Azure Monitor.
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  try {
    // applicationinsights expone su cliente TelemetryClient para uso manual.
    const appInsights = require('applicationinsights');
    const client = appInsights.defaultClient;

    // Transport personalizado que reenvía cada log de Winston a AI como trace.
    const { Transport } = require('winston').transports;
    class AppInsightsTransport extends Transport {
      log(info, callback) {
        // Mapear niveles de Winston a SeverityLevel de Application Insights
        const severityMap = {
          error:   3, // Error
          warn:    2, // Warning
          info:    1, // Information
          http:    1,
          verbose: 0, // Verbose
          debug:   0,
          silly:   0,
        };
        const severity = severityMap[info.level] ?? 1;

        // Extraer message y el resto como propiedades personalizadas
        const { level, message, timestamp: ts, stack, ...properties } = info;
        if (stack) properties.stack = stack;

        client.trackTrace({
          message,
          severity,
          properties,
        });
        client.flush(); // Asegurar envío inmediato en entornos serverless
        callback();
      }
    }

    loggerTransports.push(new AppInsightsTransport());
  } catch (err) {
    // No lanzar error si el SDK no está disponible — degradación elegante.
    // eslint-disable-next-line no-console
    console.warn('[logger] No se pudo cargar el transport de Application Insights:', err.message);
  }
}

// ─── Instancia del logger ─────────────────────────────────────────────────────
const logger = createLogger({
  level:       LOG_LEVEL,
  transports:  loggerTransports,
  // Captura excepciones no controladas y las registra antes de salir.
  exceptionHandlers: [
    new transports.Console({ format: IS_PROD ? prodFormat : devFormat }),
  ],
  exitOnError: false,
});

module.exports = logger;
