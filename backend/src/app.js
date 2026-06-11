if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config();
}
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes    = require('./routes/auth');
const productRoutes  = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const clientRoutes   = require('./routes/clients');
const saleRoutes     = require('./routes/sales');
const reportRoutes   = require('./routes/reports');
const userRoutes     = require('./routes/users');
const evalRoutes     = require('./routes/eval');

const pool       = require('./config/database');
const logger     = require('./config/logger');
const { httpLogger } = require('./middleware/httpLogger');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─── CONFIGURACIÓN DE PROXY ──────────────────────────────────────────────────
// Confía en el proxy inverso (Azure Container Apps / Load Balancer) para que 
// el rate limit funcione con la IP real del cliente y no la del proxy.
app.set('trust proxy', 1);

// ─── SEGURIDAD HTTP ──────────────────────────────────────────────────────────
// Helmet: asegura cabeceras HTTP (oculta X-Powered-By, previene XSS, clickjacking, etc.)
app.use(helmet());

// ─── CORS ESTRICTO ───────────────────────────────────────────────────────────
// Whitelist de orígenes autorizados.
//
// En producción se define FRONTEND_URL con los orígenes permitidos separados por coma.
// Incluye:
//   - Dominio público de Cloudflare: https://cloudpos6.tech
//   - FQDN interno de Azure Container Apps del frontend (pruebas de red)
//
// Ejemplo de variable en Azure Container App:
//   FRONTEND_URL=https://cloudpos6.tech,https://app-frontend-core.ambitiouscliff-28478ba7.canadacentral.azurecontainerapps.io
const whitelist = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir peticiones sin origin (health checks, server-side requests, curl)
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`[CORS] Origen bloqueado: ${origin}`);
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,                                    // Cookies HttpOnly cross-origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos explícitos
    allowedHeaders: ['Content-Type', 'Authorization'],    // Cabeceras permitidas
    maxAge: 86400,                                        // Pre-flight cache: 24 horas
  }),
);

// ─── PARSERS ─────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── LOGGING HTTP ───────────────────────────────────────────────────────────
// Registra cada request (método, URL, status, duración, IP) con Winston.
app.use(httpLogger);

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
// Ruta pública y ligera — sin autenticación ni rate limiting.
// Usada por Azure Container Apps para liveness/readiness probes.
// Valida conectividad real con PostgreSQL y Redis antes de responder 200.
app.get('/health', async (_req, res) => {
  const checks = { status: 'ok', timestamp: new Date().toISOString() };

  // Verificar conectividad con PostgreSQL (Supabase)
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    checks.database = { status: 'connected', latencyMs: Date.now() - start };
  } catch (err) {
    checks.status = 'degraded';
    checks.database = { status: 'disconnected', error: 'Error interno en la verificación' };
    // BD es crítica — retornar 503 para que Container Apps marque la réplica como no saludable
    return res.status(503).json(checks);
  }

  // Verificar conectividad con Redis (caché — degradación elegante)
  try {
    const redis = require('./config/redis');
    const start = Date.now();
    await redis.ping();
    checks.redis = { status: 'connected', latencyMs: Date.now() - start };
  } catch (err) {
    // Redis es caché, no es crítico. La app funciona sin él (degradada).
    checks.redis = { status: 'disconnected', error: 'Error interno en la verificación' };
  }

  res.status(200).json(checks);
});

// ─── RUTAS ───────────────────────────────────────────────────────────────────
app.use("/api/", globalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/eval", evalRoutes); // Ruta de evaluación docente (requiere EVAL_SECRET)

// ─── MANEJO DE ERRORES GLOBAL ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error(err.message || 'Error interno del servidor', {
    stack:  err.stack,
    status: err.status || 500,
  });
  res
    .status(err.status || 500)
    .json({ error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message });
});

module.exports = app;
