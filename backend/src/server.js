// ─── DEBE SER EL PRIMER BLOQUE DEL PROCESO ──────────────────────────────────
// El SDK de Application Insights requiere iniciarse antes de cualquier otro
// require() para que el auto-instrumentation capture peticiones HTTP,
// dependencias y excepciones de forma automática.
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  require('applicationinsights')
    .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)       // Registra cada petición HTTP entrante
    .setAutoCollectDependencies(true)   // Registra llamadas a BD, HTTP externo, etc.
    .setAutoCollectExceptions(true)     // Captura excepciones no controladas
    .setAutoCollectPerformance(true)    // Métricas de CPU, memoria, etc.
    .setAutoCollectConsole(false)       // Winston ya maneja los logs — evitar duplicados
    .start();
}
// ─────────────────────────────────────────────────────────────────────────────

const loadSecrets = require('./config/vault');

async function startServer() {
  await loadSecrets();

  const app = require('./app');
  const logger = require('./config/logger');

  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    logger.info(`Servidor POS iniciado`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      appInsights: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    });
  });
}

startServer().catch(err => {
  console.error("Error fatal al iniciar el servidor:", err);
  process.exit(1);
});
