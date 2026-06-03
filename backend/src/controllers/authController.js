const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * POST /api/auth/login
 * TODO: Completar implementación de autenticación.
 * Actualmente devuelve un token de prueba sin verificar roles ni expiración real.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // TODO: Validar que email y password no estén vacíos
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

    // TODO: Usar process.env.JWT_SECRET y process.env.JWT_EXPIRES_IN configurados
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || 'secreto_temporal_cambiar',
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
 * TODO: Requiere que authMiddleware esté implementado correctamente.
 */
const me = async (req, res) => {
  try {
    // TODO: req.user viene de authMiddleware cuando esté implementado
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
