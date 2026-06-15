# Sistema POS — Cloud-Native · Zero-Trust · Serverless

> **Instituto Profesional Virginia Gómez — 4° año Ingeniería (E) en Computación e Informática**  
> Prof. Patricio Balboa  
> Módulo: Cloud Computing · Evaluación Final 2026

Sistema de Punto de Venta (POS) para pymes chilenas, **migrado exitosamente** desde un monolito local a una arquitectura **Cloud-Native sobre Microsoft Azure**, gestionada como Infraestructura como Código (IaC) con Terraform, protegida con modelo **Zero-Trust** y desplegada como contenedores **Serverless** en Azure Container Apps.

---

## 📐 Arquitectura Cloud (As-Built)

```
                        ┌──────────────────────────────────────────────┐
                        │              CLOUDFLARE  (DNS · WAF · SSL)   │
                        │         cloudpos6.tech  —  Full Strict TLS   │
                        └─────────────────────┬────────────────────────┘
                                              │ HTTPS (443)
                        ┌─────────────────────▼────────────────────────┐
                        │          AZURE  (Region: Canada Central)     │
                        │  ┌────────────────────────────────────────┐  │
                        │  │     VNet: vnet-pos-prod                │  │
                        │  │                                        │  │
                        │  │  ┌──────────────────────────────────┐  │  │
                        │  │  │  Azure Container Apps Environment│  │  │
                        │  │  │                                  │  │  │
                        │  │  │  ┌─────────────┐  ┌───────────┐  │  │  │
                        │  │  │  │  Frontend   │  │  Backend  │  │  │  │
                        │  │  │  │  Next.js 14 │──│ Node.js20 │  │  │  │
                        │  │  │  │  (BFF/Proxy)│  │ Express   │  │  │  │
                        │  │  │  └─────────────┘  └──────┬────┘  │  │  │
                        │  │  └─────────────────────────┬┘───────┘  │  │
                        │  │                            │ Private   │  │
                        │  │  Private Endpoints  ◄──────┘ Endpoints │  │
                        │  │  ┌──────────┐  ┌──────┐  ┌────────┐    │  │
                        │  │  │ Supabase │  │Redis │  │  Blob  │    │  │
                        │  │  │PostgreSQL│  │ v7.4 │  │Storage │    │  │
                        │  │  └──────────┘  └──────┘  └────────┘    │  │
                        │  │                                        │  │
                        │  │  ┌──────────────┐  ┌────────────────┐  │  │
                        │  │  │  Key Vault   │  │ Azure Monitor  │  │  │
                        │  │  │ (Passwordless│  │  Log Analytics │  │  │
                        │  │  │   via MI)    │  │  + Grafana     │  │  │
                        │  │  └──────────────┘  └────────────────┘  │  │
                        │  └────────────────────────────────────────┘  │
                        │  ┌────────────────────────────────────────┐  │
                        │  │  ACR: acrposdevops.azurecr.io          │  │
                        │  │  (Azure Container Registry)            │  │
                        │  └────────────────────────────────────────┘  │
                        └──────────────────────────────────────────────┘
```

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js · React · App Router | 14.2.3 |
| **Backend** | Node.js · Express | 20 / 4.18 |
| **Base de Datos** | PostgreSQL en Supabase (SaaS) | 15 |
| **Caché** | Azure Cache for Redis (Managed) | 7.4 |
| **Almacenamiento** | Azure Blob Storage | — |
| **Cómputo** | Azure Container Apps Environment | — |
| **Registry** | Azure Container Registry | acrposdevops |
| **Secrets** | Azure Key Vault + Managed Identity | — |
| **IaC** | Terraform | ~3.0 (azurerm) |
| **DNS / WAF / SSL** | Cloudflare | Full Strict |
| **CI/CD** | GitHub Actions | — |
| **Observabilidad** | Winston · Azure App Insights · Grafana | — |
| **Autenticación** | JWT con roles (admin / cajero) | — |

---

## 📁 Estructura del Repositorio

```
pos-system-cc-2026/
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml       # CI/CD → ACR (push en main/backend/**)
│       └── deploy-frontend.yml      # CI/CD → ACR (push en main/frontend/**)
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Pool PostgreSQL (SSL strict, sin fallback)
│   │   │   ├── logger.js            # Winston + Azure App Insights transport
│   │   │   ├── redis.js             # ioredis · TLS · commandTimeout 2s (Fail-Fast)
│   │   │   └── vault.js             # Azure Key Vault via DefaultAzureCredential
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── categoryController.js
│   │   │   ├── clientController.js
│   │   │   ├── evalController.js    # Endpoint de evaluación docente
│   │   │   ├── productController.js
│   │   │   ├── reportController.js
│   │   │   ├── saleController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verify · requireRole()
│   │   │   ├── httpLogger.js        # Morgan-style con Winston
│   │   │   ├── rateLimiter.js       # express-rate-limit (global 200/15m · login 5/15m)
│   │   │   └── upload.js            # Multer + Azure Blob Storage (sin disco local)
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── categories.js
│   │   │   ├── clients.js
│   │   │   ├── eval.js              # Protegido con x-eval-key (timing-safe)
│   │   │   ├── products.js          # Con express-validator
│   │   │   ├── reports.js
│   │   │   ├── sales.js
│   │   │   └── users.js
│   │   ├── app.js                   # Express · Helmet · CORS whitelist · /health
│   │   └── server.js                # Entrypoint: App Insights → Key Vault → app
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/         # Rutas protegidas con layout
│   │   │   │   ├── layout.jsx
│   │   │   │   ├── dashboard/
│   │   │   │   ├── pos/
│   │   │   │   ├── products/
│   │   │   │   ├── categories/
│   │   │   │   ├── clients/
│   │   │   │   ├── sales/
│   │   │   │   ├── reports/
│   │   │   │   └── users/
│   │   │   ├── eval/                # Página de evaluación docente
│   │   │   ├── login/
│   │   │   ├── globals.css
│   │   │   ├── layout.jsx
│   │   │   └── page.jsx
│   │   ├── components/
│   │   ├── context/
│   │   └── lib/
│   ├── .env.local.example
│   ├── Dockerfile
│   ├── next.config.js               # BFF rewrites + Azure Blob image domains
│   └── package.json
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── create-admin.js
│
├── terraform/
│   ├── main.tf                      # Provider azurerm · backend remoto en Azure
│   └── main_resources.tf            # Recursos Azure (VNet, CAE, ACR, KV, Redis…)
│
├── docker-compose.yaml              # Entorno local de desarrollo
└── README.md
```

---

## 🧩 Módulos del Sistema

| Módulo | Descripción | Acceso |
|--------|-------------|--------|
| **Dashboard** | KPIs: ventas del día, del mes, productos y clientes activos | Admin |
| **POS** | Carrito de compra, selección de cliente y método de pago | Admin / Cajero |
| **Productos** | CRUD con subida de imágenes a Azure Blob Storage y control de stock | Admin |
| **Categorías** | Gestión de categorías de productos | Admin / Cajero |
| **Clientes** | CRUD con validación de RUT chileno | Admin / Cajero |
| **Ventas** | Historial transaccional; anulación solo para Admin | Admin / Cajero |
| **Reportes** | Gráficos: ventas por día, top productos, distribución de pagos | Admin |
| **Usuarios** | Gestión de usuarios y roles | Admin |

---

## ☁️ Despliegue y Arquitectura Cloud

### Modelo Zero-Trust

El acceso entre componentes sigue un modelo de **confianza cero**:

- **Cloudflare** actúa como punto único de entrada público: DNS autoritativo, WAF (reglas OWASP), mitigación de DDoS y terminación TLS con modo **Full Strict** (certificado válido extremo a extremo).
- En Azure, todos los servicios de datos (PostgreSQL/Supabase, Redis, Blob Storage) se exponen **exclusivamente** a través de **Private Endpoints** dentro de la VNet `vnet-pos-prod`. No tienen endpoints públicos habilitados.
- El backend **nunca** gestiona contraseñas en disco. Los secretos se extraen en memoria al arrancar el proceso desde **Azure Key Vault** mediante `DefaultAzureCredential` (Managed Identity), sin archivos `.env` en producción.

### Patrón BFF — Eliminación de CORS

El frontend actúa como **Backend-For-Frontend** gracias a los `rewrites` configurados en [`next.config.js`](frontend/next.config.js):

```js
// Todas las llamadas del navegador a /api/* son reescritas internamente
// hacia el FQDN privado del Container App del backend.
// El navegador nunca habla directamente con el backend → cero CORS.
{
  source: '/api/:path*',
  destination: `${BACKEND_INTERNAL_URL}/api/:path*`
}
```

### Infraestructura como Código (Terraform)

Todo el aprovisionamiento Azure está en [`terraform/`](terraform/). El estado remoto se guarda de forma segura en Azure Storage:

```hcl
backend "azurerm" {
  resource_group_name  = "rg-prod-apps"
  storage_account_name = "stterraformpos2026"
  container_name       = "tfstate"
  key                  = "prod.terraform.tfstate"
}
```

```bash
# Inicializar y aplicar la infraestructura
terraform -chdir=terraform init
terraform -chdir=terraform plan
terraform -chdir=terraform apply
```

### CI/CD — GitHub Actions → Azure Container Registry

Los pipelines en `.github/workflows/` se activan automáticamente al hacer `push` a `main`:

| Workflow | Trigger | Imagen resultante |
|----------|---------|-------------------|
| `deploy-backend.yml` | `backend/**` | `acrposdevops.azurecr.io/pos-backend:<sha>` |
| `deploy-frontend.yml` | `frontend/**` | `acrposdevops.azurecr.io/pos-frontend:<sha>` |

Tras el push a ACR, el despliegue al Container App se realiza con:

```bash
# Backend
az containerapp update \
  --name app-backend-core \
  --resource-group rg-prod-apps \
  --image acrposdevops.azurecr.io/pos-backend:<SHA>

# Frontend
az containerapp update \
  --name app-frontend-core \
  --resource-group rg-prod-apps \
  --image acrposdevops.azurecr.io/pos-frontend:<SHA>
```

---

## 🛠️ Ejecución Local (Docker Compose)

El entorno local usa `docker-compose.yaml` que levanta PostgreSQL 16, el backend y el frontend en una red aislada.

### Requisitos previos

- Docker Desktop
- Azure CLI (opcional, solo si se conecta a recursos Azure reales)

### 1 — Configurar variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales locales
```

Para desarrollo local, el backend **no** requiere Key Vault: usa las variables del `.env` directamente (la función `loadSecrets()` se omite si `KEY_VAULT_NAME` no está definido).

### 2 — Variables de entorno del Backend (`backend/.env`)

| Variable | Descripción | Requerida en Prod |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor (default: `3001`) | ✅ |
| `NODE_ENV` | `development` / `production` | ✅ |
| `DB_HOST` | Host de PostgreSQL / Supabase | ✅ (vía Key Vault) |
| `DB_PORT` | Puerto de PostgreSQL (default: `5432`) | ✅ (vía Key Vault) |
| `DB_NAME` | Nombre de la base de datos | ✅ (vía Key Vault) |
| `DB_USER` | Usuario de PostgreSQL | ✅ (vía Key Vault) |
| `DB_PASSWORD` | Contraseña de PostgreSQL | ✅ (vía Key Vault) |
| `JWT_SECRET` | Secreto de firma JWT | ✅ (vía Key Vault) |
| `JWT_EXPIRES_IN` | Expiración del token (default: `8h`) | ✅ |
| `FRONTEND_URL` | Whitelist CORS (URLs separadas por coma) | ✅ |
| `REDIS_HOST` | Host de Azure Cache for Redis | ✅ (vía Key Vault) |
| `REDIS_PORT` | Puerto Redis TLS (default: `6380`) | ✅ |
| `REDIS_PASSWORD` | Contraseña de Redis | ✅ (vía Key Vault) |
| `AZURE_STORAGE_CONNECTION_STRING` | Conexión a Azure Blob Storage | ✅ (vía Key Vault) |
| `AZURE_CONTAINER_NAME` | Nombre del contenedor de blobs (default: `product-images`) | ✅ |
| `KEY_VAULT_NAME` | Nombre del Key Vault (sin URL). Si está definido, activa la carga passwordless. | Solo Prod |
| `LOG_LEVEL` | Verbosidad del logger: `debug` · `info` · `warn` · `error` (default: `info`) | ✅ |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Telemetría a Azure Monitor. Opcional: sin ella los logs van solo a consola. | Solo Prod |
| `EVAL_SECRET` | Clave para el endpoint docente `/api/eval`. Si no se define, se genera aleatoriamente. | Opcional |

### 3 — Variables de entorno del Frontend (`frontend/.env.local`)

| Variable | Descripción | Ejemplo Desarrollo |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL base del backend (solo para desarrollo; en prod el BFF lo enruta internamente) | `http://localhost:3001` |
| `BACKEND_INTERNAL_URL` | FQDN interno del Container App del backend (usado en `next.config.js` rewrites) | FQDN privado de Azure CAE |

### 4 — Levantar el entorno

```bash
# Levantar todos los servicios (PostgreSQL + Backend + Frontend)
docker compose up --build

# Solo el backend (si ya tienes PostgreSQL local)
docker compose up backend

# Detener y limpiar
docker compose down -v
```

### 5 — Inicializar la base de datos (primera vez)

```bash
# Si usas Docker Compose, el schema y seed se aplican automáticamente
# vía los volúmenes montados en el servicio postgres-db.

# Para aplicar manualmente contra cualquier instancia:
psql -d pos_db -f database/schema.sql
psql -d pos_db -f database/seed.sql

# Crear usuarios iniciales (admin y cajero)
node database/create-admin.js
```

**Frontend:** `http://localhost:3000`  
**Backend:** `http://localhost:3001`

### Credenciales por Defecto

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | `admin@pos.cl` | `admin123` |
| Cajero | `cajero@pos.cl` | `cajero123` |

---

## 📡 API Endpoints

> El frontend actúa como BFF: el navegador llama a `/api/*` en el **mismo dominio** del frontend.  
> En producción: `https://cloudpos6.tech/api/*`  
> En desarrollo: el proxy de Next.js redirige a `http://localhost:3001/api/*`

### Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/login` | Iniciar sesión · Rate limit: 5 req/15 min/IP | Pública |
| `POST` | `/api/auth/logout` | Cerrar sesión | Pública |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado | JWT |

### Productos

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/products` | Listar productos (filtros: `search`, `categoria_id`) | JWT |
| `GET` | `/api/products/:id` | Obtener producto por ID | JWT |
| `POST` | `/api/products` | Crear producto (`multipart/form-data` · imagen → Azure Blob) | JWT · Admin |
| `PUT` | `/api/products/:id` | Actualizar producto (con validación `express-validator`) | JWT · Admin |
| `DELETE` | `/api/products/:id` | Soft-delete producto | JWT · Admin |

### Categorías

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/categories` | Listar categorías | JWT |
| `POST` | `/api/categories` | Crear categoría | JWT |
| `PUT` | `/api/categories/:id` | Actualizar categoría | JWT |

### Clientes

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/clients` | Listar clientes (filtro: `search`) | JWT |
| `POST` | `/api/clients` | Crear cliente (validación RUT chileno) | JWT |
| `PUT` | `/api/clients/:id` | Actualizar cliente | JWT |

### Ventas

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/sales` | Listar ventas | JWT |
| `GET` | `/api/sales/:id` | Detalle de venta con ítems | JWT |
| `POST` | `/api/sales` | Crear venta (descuenta stock · transaccional) | JWT |
| `PUT` | `/api/sales/:id/cancel` | Anular venta (repone stock) | JWT · Admin |

### Reportes

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/reports/summary` | KPIs del dashboard | JWT · Admin |
| `GET` | `/api/reports/sales-by-day` | Ventas por día (param: `days`) | JWT · Admin |
| `GET` | `/api/reports/top-products` | Top productos (param: `limit`) | JWT · Admin |
| `GET` | `/api/reports/sales-by-payment` | Distribución por método de pago | JWT · Admin |

### Usuarios

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/users` | Listar usuarios | JWT · Admin |
| `POST` | `/api/users` | Crear usuario | JWT · Admin |
| `PUT` | `/api/users/:id` | Actualizar usuario | JWT · Admin |
| `DELETE` | `/api/users/:id` | Desactivar usuario | JWT · Admin |

### Health Check & Evaluación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Estado de la app, latencia de BD y Redis | Pública |
| `GET` | `/api/eval` | Reporte de evaluación docente | `x-eval-key` header |

---

## 🔒 Seguridad — Limitaciones Resueltas

Las siguientes limitaciones del monolito original han sido **completamente mitigadas**:

| Limitación Original | Estado | Solución Implementada |
|---------------------|--------|-----------------------|
| Credenciales hardcodeadas en código | ✅ Resuelto | `database.js` elimina todos los fallbacks. En producción, `vault.js` inyecta secretos desde **Azure Key Vault** via `DefaultAzureCredential` (Managed Identity). Sin archivos `.env` en producción. |
| CORS permisivo (`cors()` sin whitelist) | ✅ Resuelto | CORS estricto con whitelist en `app.js` (`FRONTEND_URL` separado por coma). El patrón BFF en `next.config.js` elimina CORS del navegador en producción. |
| Sin validación de inputs | ✅ Resuelto | `express-validator` activo en rutas de productos (nombre, precio, stock) con `checkValidation` middleware. |
| Sin rate limiting | ✅ Resuelto | `express-rate-limit`: limitador global (200 req/15 min/IP) en `/api/*` y limitador específico de login (5 req/15 min/IP). Cloudflare WAF añade una capa adicional. |
| Token en `localStorage` (XSS) | ✅ Resuelto | CORS estricto + Cloudflare WAF · Helmet mitiga XSS via headers. |
| Sin health check | ✅ Resuelto | `GET /health` verifica conectividad real con PostgreSQL y Redis. Responde `503` si la BD falla (Container Apps desmarca réplica). |
| Sin SSL en BD | ✅ Resuelto | `database.js` activa `ssl: { require: true }` en `NODE_ENV=production`. Redis usa TLS en puerto 6380. Todo el tráfico interno viaja por Private Endpoints. |
| Sin clustering / sin reintentos | ✅ Resuelto | Azure Container Apps escala horizontalmente de forma nativa (múltiples réplicas). El pool de `pg` gestiona reconexiones automáticamente. |
| Imágenes en disco local (`/uploads`) | ✅ Resuelto | `upload.js` usa `MulterAzureStorage`: las imágenes van directamente a Azure Blob Storage (`stprodposcanada`) sin tocar el disco local del contenedor. El frontend carga imágenes desde la URL pública del blob. |
| Solo `console.log` | ✅ Resuelto | **Winston** con formato JSON estructurado en producción. Transport a **Azure Application Insights** activo si `APPLICATIONINSIGHTS_CONNECTION_STRING` está definida. Visualización en **Grafana** conectado a Log Analytics. |
| Sin métricas / observabilidad | ✅ Resuelto | Application Insights auto-instrumenta peticiones HTTP, dependencias (BD, Redis) y excepciones. Métricas de CPU/memoria en Azure Monitor. |
| Sin secrets management | ✅ Resuelto | `vault.js` descarga en paralelo 5 secretos (`DB-USER`, `DB-PASSWORD`, `REDIS-PASSWORD`, `JWT-SECRET`, `AZURE-STORAGE-CONNECTION-STRING`) desde Key Vault al arrancar. Cero fallbacks. |

---

## 📊 Observabilidad

### Logging Estructurado (Winston)

```
Desarrollo → Consola colorizada (human-readable)
Producción → JSON estructurado en consola + Azure Application Insights transport
```

Controlar verbosidad sin tocar código:

```bash
# En Azure Container App (variable de entorno)
LOG_LEVEL=debug   # debug | info | warn | error
```

### Caché — Patrón Fail-Fast

`redis.js` configura `commandTimeout: 2000` y `enableOfflineQueue: false`. Si Redis no responde en 2 segundos, la operación falla silenciosamente y el backend degrada a PostgreSQL, garantizando continuidad del servicio.

### Health Check

```bash
curl https://cloudpos6.tech/health
# Respuesta 200 OK:
# {
#   "status": "ok",
#   "timestamp": "2026-06-15T08:00:00.000Z",
#   "database": { "status": "connected", "latencyMs": 12 },
#   "redis":    { "status": "connected", "latencyMs": 1  }
# }
```

---

## 🗄️ Esquema de Base de Datos

```
roles ──────────── usuarios
                      │
categorias ──── productos
                      │
clientes ─────── ventas ──── detalle_ventas ── productos
                   │
                 usuarios
```

---

## 📦 Dependencias Clave

### Backend (`backend/package.json`)

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@azure/identity` | ^4.4.1 | `DefaultAzureCredential` para Managed Identity |
| `@azure/keyvault-secrets` | ^4.8.0 | Cliente de Azure Key Vault |
| `@azure/storage-blob` | ^12.32.0 | SDK de Azure Blob Storage |
| `applicationinsights` | ^3.15.0 | Telemetría a Azure Monitor |
| `winston` | ^3.19.0 | Logging estructurado |
| `ioredis` | ^5.4.1 | Cliente Redis con TLS y Fail-Fast |
| `express-rate-limit` | ^8.5.2 | Rate limiting por IP |
| `express-validator` | ^7.0.1 | Validación de inputs |
| `helmet` | ^8.2.0 | Seguridad de cabeceras HTTP |
| `multer-azure-blob-storage` | ^1.2.0 | Upload directo a Azure Blob |
| `pg` | ^8.11.3 | Cliente PostgreSQL con pool |
| `bcryptjs` | ^2.4.3 | Hash de contraseñas |
| `jsonwebtoken` | ^9.0.2 | Generación y verificación JWT |

### Frontend (`frontend/package.json`)

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `next` | 14.2.3 | Framework React con App Router y BFF rewrites |
| `react` / `react-dom` | ^18.3.1 | Librería UI |
| `axios` | ^1.6.8 | Cliente HTTP |
| `recharts` | ^2.12.7 | Gráficos para reportes |
| `tailwindcss` | ^3.4.3 | Estilos CSS utilitarios |

---

## 📋 Entregables de Evaluación

- [x] Diagrama de arquitectura cloud detallado (ver sección "Arquitectura Cloud")
- [x] Repositorio GitHub con todo el código de implementación
- [x] URL funcional del sistema desplegado: **https://cloudpos6.tech**
- [ ] Bitácora de avances (Scrum board / Trello)
- [ ] Presentación: problemática → arquitectura propuesta → decisiones técnicas → demo

---

## 📝 Notas para el Evaluador Docente

El endpoint `/api/eval` genera un reporte automático del estado de implementación de los criterios de evaluación. Se protege con una clave de comparación en tiempo constante (resistente a timing attacks):

```bash
# Header
curl -H "x-eval-key: <EVAL_SECRET>" https://cloudpos6.tech/api/eval

# Query param
curl "https://cloudpos6.tech/api/eval?key=<EVAL_SECRET>"
```

Si `EVAL_SECRET` no está definida como variable de entorno en el Container App, la clave se genera aleatoriamente al arrancar el proceso (conocida solo en los logs de Application Insights de ese arranque).

---

*Instituto Profesional Virginia Gómez · Cloud Computing 2026*
