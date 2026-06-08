'use strict';

const Redis = require('ioredis');
const logger = require('./logger');

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6380,
  password: process.env.REDIS_PASSWORD,
  // Azure Redis requiere TLS habilitado en producción
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
});

redisClient.on('connect', () => logger.info('[Redis] Conectado a Azure Cache for Redis.'));
redisClient.on('error', (err) => logger.error('[Redis] Error de conexión:', err));

module.exports = redisClient;
