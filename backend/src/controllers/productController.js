const pool = require('../config/database');

// TODO: Agregar validación de inputs con express-validator (ya instalado)
// TODO: Sanitizar datos antes de insertarlos

const getAll = async (req, res) => {
  try {
    const { search, categoria_id, activo = 'true' } = req.query;
    const params = [activo !== 'false'];
    let query = `
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = $1
    `;

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.nombre ILIKE $${params.length} OR p.descripcion ILIKE $${params.length})`;
    }
    if (categoria_id) {
      params.push(Number(categoria_id));
      query += ` AND p.categoria_id = $${params.length}`;
    }
    query += ' ORDER BY p.nombre';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    // TODO: Validar que precio >= 0, stock >= 0, nombre no vacío, categoria_id exista
    const imagen_url = req.file ? req.file.url : null;

    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, descripcion || null, Number(precio), Number(stock) || 0, categoria_id || null, imagen_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria_id, activo } = req.body;
    const imagen_url = req.file ? req.file.url : undefined;

    const fields = [];
    const values = [];

    if (nombre      !== undefined) { fields.push(`nombre = $${fields.length + 1}`);       values.push(nombre); }
    if (descripcion !== undefined) { fields.push(`descripcion = $${fields.length + 1}`);  values.push(descripcion); }
    if (precio      !== undefined) { fields.push(`precio = $${fields.length + 1}`);       values.push(Number(precio)); }
    if (stock       !== undefined) { fields.push(`stock = $${fields.length + 1}`);        values.push(Number(stock)); }
    if (categoria_id !== undefined){ fields.push(`categoria_id = $${fields.length + 1}`); values.push(categoria_id); }
    if (activo      !== undefined) { fields.push(`activo = $${fields.length + 1}`);       values.push(activo); }
    if (imagen_url  !== undefined) { fields.push(`imagen_url = $${fields.length + 1}`);   values.push(imagen_url); }

    if (!fields.length) return res.status(400).json({ error: 'No hay campos para actualizar.' });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE productos SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    // Soft delete — no elimina físicamente para mantener historial de ventas
    await pool.query('UPDATE productos SET activo = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Producto desactivado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
