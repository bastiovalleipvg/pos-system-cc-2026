const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT.
 *
 * Extrae el token JWT desde la cookie 'token' (HttpOnly) o desde el header
 * Authorization (formato: "Bearer <token>"). Verifica su validez con
 * jwt.verify() y decodifica el payload, inyectándolo en req.user.
 *
 * Respuestas de error:
 *   401 — No se proporcionó token.
 *   403 — Token inválido o expirado.
 */
const authMiddleware = (req, res, next) => {
  let token = null;
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('[Auth] FATAL: JWT_SECRET no está definido en las variables de entorno.');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware de autorización por rol.
 *
 * Verifica que el usuario autenticado (req.user, inyectado por authMiddleware)
 * posea uno de los roles especificados. Caso contrario, retorna 403.
 *
 * @param {string[]} roles — Roles permitidos (ej: ['admin'])
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
    }
    next();
  };
};

module.exports = { authMiddleware, requireRole };
