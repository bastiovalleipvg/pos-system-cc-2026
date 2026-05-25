require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const clientRoutes = require("./routes/clients");
const saleRoutes = require("./routes/sales");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");
const evalRoutes = require("./routes/eval");

const app = express();

/* Para desarrollo local
El valor por defecto de la whitelist es http://localhost:3000, así que no necesitas nada en .env para trabajar localmente.

Para producción en Azure
Solo debes añadir en las variables de entorno de tu App Service / Container App:

FRONTEND_URL=https://tu-frontend.azurestaticapps.net */

// ─── SEGURIDAD HTTP ──────────────────────────────────────────────────────────
// 1. Helmet: asegura cabeceras HTTP (oculta que usas Express, previene XSS básico, etc.)
app.use(helmet());

// 2. CORS estricto: solo permite peticiones desde el frontend autorizado
const whitelist = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  // Añadir aquí la URL real de producción en Azure cuando esté disponible
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true, // Vital para enviar cookies HttpOnly en la Fase 2
  }),
);

// ─── PARSERS ─────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ARCHIVOS ESTÁTICOS (imágenes) ───────────────────────────────────────────
// TODO: Eliminar cuando se migre a almacenamiento en la nube (S3, GCS, etc.)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
// Ruta pública y ligera — sin autenticación ni middleware pesado.
// Usada por Azure App Service / Container Apps para liveness/readiness probes.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── RUTAS ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/eval", evalRoutes); // Ruta de evaluación docente (requiere EVAL_SECRET)

// ─── MANEJO DE ERRORES GLOBAL ────────────────────────────────────────────────
// TODO: Reemplazar console.error con logging estructurado (Winston, Pino, etc.)
//       e integrar con servicio de monitoreo (CloudWatch, Datadog, Sentry, etc.)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Error interno del servidor" });
});

module.exports = app;
