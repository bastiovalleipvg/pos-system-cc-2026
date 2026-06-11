const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * POST /api/auth/login
 * Autentica al usuario por email/password, emite un JWT firmado y lo almacena
 * en una cookie HttpOnly segura. El JWT incluye id, nombre, email y rol.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const result = await pool.query(
      `SELECT u.*, r.nombre as rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.email = $1 AND u.activo = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // JWT_SECRET proviene de Azure Key Vault (vía vault.js) en producción.
    // Si no está definido, fallamos rápido: no emitimos tokens con secretos inseguros.
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('[Auth] FATAL: JWT_SECRET no está definido en las variables de entorno.');
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    res.json({
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/auth/me
 * Retorna los datos del usuario autenticado (extraídos del JWT por authMiddleware).
 */
const me = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, r.nombre as rol
       FROM usuarios u JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/logout
 * Elimina la cookie HttpOnly para cerrar la sesión
 */
const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.json({ message: 'Sesión cerrada exitosamente.' });
};

module.exports = { login, me, logout };
