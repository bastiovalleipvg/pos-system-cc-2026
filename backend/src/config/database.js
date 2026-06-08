'use strict';

const { Pool } = require('pg');
const logger   = require('./logger');

/**
 * Pool de conexiones a PostgreSQL.
 *
 * SEGURIDAD: Todos los valores provienen EXCLUSIVAMENTE de variables de entorno.
 * No existen valores por defecto ni fallbacks. Si alguna variable no está
 * definida, pg lanzará un error en tiempo de conexión que detendrá el servicio,
 * haciendo evidente la mala configuración antes de llegar a producción.
 *
 * Las variables requeridas son:
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *
 * En producción estas variables son inyectadas por vault.js desde Azure Key Vault.
 */
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // SSL dinámico: obligatorio con verificación relajada en producción
  // (Azure Database for PostgreSQL usa certificados autofirmados de CA interna).
  // En desarrollo se deshabilita para facilitar conexiones locales.
  ssl: process.env.NODE_ENV === 'production'
    ? { require: true, rejectUnauthorized: false }
    : false,

  max:                     10,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 2000,
});

// Registrar el error en el sistema de logging central (Winston + Application Insights)
pool.on('error', (err) => {
  logger.error('Error inesperado en el pool de conexiones PostgreSQL', {
    message: err.message,
    stack:   err.stack,
  });
});

module.exports = pool;
