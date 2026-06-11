'use strict';

const pool   = require('../config/database');
const redis  = require('../config/redis');
const logger = require('../config/logger');

// ─── Configuración de TTL por endpoint ───────────────────────────────────────
// Tiempos de vida diferenciados según la volatilidad de los datos.
const TTL = {
  SUMMARY:          60,  // 60s — Dashboard: se refresca cada minuto
  SALES_BY_DAY:    120,  // 2min — Datos históricos, cambian con baja frecuencia
  TOP_PRODUCTS:    300,  // 5min — Ranking estable, alto costo de query (GROUP BY + JOIN)
  SALES_BY_PAYMENT: 300, // 5min — Distribución por método de pago, estable
};

// ─── Wrapper genérico de caché ───────────────────────────────────────────────
/**
 * Intenta leer el resultado de Redis. Si no existe (MISS), ejecuta la query
 * contra PostgreSQL y almacena el resultado en Redis con el TTL indicado.
 *
 * Si Redis falla, la query se ejecuta directamente contra la BD.
 * La aplicación nunca se rompe por un fallo de caché (degradación elegante).
 *
 * @param {string} key   — Clave única en Redis (ej: "report:summary")
 * @param {number} ttl   — Tiempo de vida en segundos
 * @param {Function} queryFn — Función async que ejecuta la query contra PostgreSQL
 * @returns {*} — Resultado de la query (desde caché o desde BD)
 */
async function withCache(key, ttl, queryFn) {
  // Intentar leer de Redis
  try {
    const cached = await redis.get(key);
    if (cached) {
      logger.debug(`[Cache] HIT: ${key}`);
      return JSON.parse(cached);
    }
    logger.debug(`[Cache] MISS: ${key}`);
  } catch (err) {
    logger.warn(`[Cache] Error leyendo Redis, continuando sin caché: ${err.message}`);
  }

  // Ejecutar la query contra PostgreSQL
  const result = await queryFn();

  // Guardar en Redis (fire-and-forget, no bloquea la respuesta)
  try {
    await redis.setex(key, ttl, JSON.stringify(result));
    logger.debug(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
  } catch (err) {
    logger.warn(`[Cache] Error escribiendo a Redis: ${err.message}`);
  }

  return result;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/** GET /api/reports/summary — Resumen general del dashboard */
const summary = async (_req, res) => {
  try {
    const data = await withCache('report:summary', TTL.SUMMARY, async () => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const [ventasHoy, ventasMes, totalProductos, totalClientes] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS monto
           FROM ventas WHERE estado = 'completada' AND created_at >= $1`,
          [hoy]
        ),
        pool.query(
          `SELECT COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS monto
           FROM ventas WHERE estado = 'completada'
           AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`
        ),
        pool.query('SELECT COUNT(*) AS total FROM productos WHERE activo = true'),
        pool.query('SELECT COUNT(*) AS total FROM clientes WHERE activo = true'),
      ]);

      return {
        ventas_hoy:      { cantidad: Number(ventasHoy.rows[0].cantidad),    monto: Number(ventasHoy.rows[0].monto) },
        ventas_mes:      { cantidad: Number(ventasMes.rows[0].cantidad),    monto: Number(ventasMes.rows[0].monto) },
        total_productos: Number(totalProductos.rows[0].total),
        total_clientes:  Number(totalClientes.rows[0].total),
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/reports/sales-by-day?days=30 */
const salesByDay = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const cacheKey = `report:sales-by-day:${days}`;

    const data = await withCache(cacheKey, TTL.SALES_BY_DAY, async () => {
      const result = await pool.query(
        `SELECT DATE(created_at) AS fecha,
                COUNT(*)::int    AS cantidad,
                SUM(total)::int  AS monto
         FROM ventas
         WHERE estado = 'completada'
           AND created_at >= NOW() - ($1 || ' days')::INTERVAL
         GROUP BY DATE(created_at)
         ORDER BY fecha`,
        [days]
      );
      return result.rows;
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/reports/top-products?limit=10 */
const topProducts = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const cacheKey = `report:top-products:${limit}`;

    const data = await withCache(cacheKey, TTL.TOP_PRODUCTS, async () => {
      const result = await pool.query(
        `SELECT p.nombre,
                SUM(dv.cantidad)::int  AS unidades_vendidas,
                SUM(dv.subtotal)::int  AS ingreso_total
         FROM detalle_ventas dv
         JOIN ventas v    ON dv.venta_id    = v.id
         JOIN productos p ON dv.producto_id = p.id
         WHERE v.estado = 'completada'
         GROUP BY p.id, p.nombre
         ORDER BY unidades_vendidas DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/reports/sales-by-payment */
const salesByPayment = async (_req, res) => {
  try {
    const data = await withCache('report:sales-by-payment', TTL.SALES_BY_PAYMENT, async () => {
      const result = await pool.query(
        `SELECT metodo_pago,
                COUNT(*)::int   AS cantidad,
                SUM(total)::int AS monto
         FROM ventas
         WHERE estado = 'completada'
         GROUP BY metodo_pago
         ORDER BY monto DESC`
      );
      return result.rows;
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { summary, salesByDay, topProducts, salesByPayment };
