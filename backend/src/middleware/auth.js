const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT.
 *
 * TODO: IMPLEMENTAR - Este middleware no verifica ningún token.
 * Actualmente todas las rutas protegidas son accesibles sin autenticación.
 *
 * Pasos para implementar:
 * 1. Extraer el token del header Authorization (formato: "Bearer <token>")
 * 2. Verificar el token con jwt.verify() usando process.env.JWT_SECRET
 * 3. Agregar el usuario decodificado a req.user
 * 4. Retornar 401 si no hay token o 403 si el token es inválido/expirado
 * 5. Eliminar el llamado directo a next() al final de esta función
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal_cambiar');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware de autorización por rol.
 *
 * TODO: IMPLEMENTAR - Actualmente no verifica roles.
 * Requiere que authMiddleware esté implementado primero.
 *
 * @param {string[]} roles - Roles permitidos (ej: ['admin'])
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
