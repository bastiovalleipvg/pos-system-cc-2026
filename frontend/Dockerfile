# ═══════════════════════════════════════════════════════════════════════════════
# FRONTEND — Dockerfile multi-stage optimizado para Next.js 14 (standalone)
# Imagen final ~150 MB vs ~1 GB sin multi-stage.
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Etapa 1: Dependencias ───────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ─── Etapa 2: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inyectar la URL del backend para el proxy rewrite de next.config.js.
# En producción se pasa como ARG durante el build en el pipeline de CI/CD:
#   docker build --build-arg BACKEND_INTERNAL_URL=https://... ./frontend
ARG BACKEND_INTERNAL_URL
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL

# Next.js recopila datos de telemetría anónimos. Deshabilitamos en el build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Etapa 3: Runner (imagen final mínima) ──────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad del contenedor
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar solo los artefactos necesarios del build standalone.
# next.config.js ya está embebido en el server standalone.
COPY --from=builder /app/public ./public

# El directorio standalone contiene el servidor mínimo de Next.js
# con solo las dependencias que realmente se usan (tree-shaken).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# El servidor standalone de Next.js se ejecuta directamente con Node.js.
# No necesita node_modules completos ni npm start.
CMD ["node", "server.js"]
