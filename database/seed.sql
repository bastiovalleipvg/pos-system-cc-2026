-- ============================================================
-- SISTEMA POS - DATOS DE PRUEBA
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- ============================================================
-- CATEGORÍAS
-- ============================================================
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Bebidas',     'Bebidas frías, calientes y jugos'),
  ('Alimentos',   'Comidas, snacks y productos de alimentación'),
  ('Tecnología',  'Dispositivos electrónicos y accesorios'),
  ('Hogar',       'Artículos para el hogar y limpieza'),
  ('Papelería',   'Útiles de oficina y papelería');

-- ============================================================
-- PRODUCTOS
-- ============================================================
INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES
  ('Coca-Cola 500ml',         'Bebida gaseosa fría',                    1500,  100, 1),
  ('Agua Mineral 1.5L',       'Agua mineral sin gas',                    800,  200, 1),
  ('Café Americano',          'Café negro en grano molido',             1990,   80, 1),
  ('Jugo Natural Naranja',    'Jugo exprimido 300ml',                   1800,   50, 1),
  ('Sándwich Completo',       'Pan, palta, tomate y mayonesa',          3500,   30, 2),
  ('Empanada de Pino',        'Empanada horneada con pino',             2200,   40, 2),
  ('Yogurt Frutilla 200g',    'Yogurt con trozos de frutilla',          1200,   60, 2),
  ('Manzana Roja kg',         'Manzanas frescas por kilo',              1990,   80, 2),
  ('Mouse Inalámbrico',       'Mouse USB inalámbrico 2.4GHz',          12990,   15, 3),
  ('Teclado USB',             'Teclado español compacto',               9990,   20, 3),
  ('Audífonos Bluetooth',     'Audífonos BT con micrófono',            25990,   10, 3),
  ('Cable USB-C 1m',          'Cable de carga y datos USB-C',           3990,   50, 3),
  ('Detergente 1L',           'Detergente líquido para ropa',           3500,   40, 4),
  ('Escoba Cerdas Duras',     'Escoba doméstica resistente',            4990,   25, 4),
  ('Cuaderno 100 hojas',      'Cuaderno universitario cuadriculado',    2490,   80, 5),
  ('Lápiz Pasta Azul x10',    'Caja con 10 lápices pasta azul',        1990,   60, 5),
  ('Resma Papel Carta 500',   'Resma papel carta 75g 500 hojas',        6990,   30, 5);

-- ============================================================
-- CLIENTES
-- ============================================================
INSERT INTO clientes (rut, nombre, email, telefono, direccion) VALUES
  ('12345678-9', 'Juan Pérez González',     'juan.perez@gmail.com',    '+56912345678', 'Av. Libertador 1234, Santiago'),
  ('98765432-1', 'María González López',    'maria.gonzalez@gmail.com','+56987654321', 'Calle Rosas 567, Valparaíso'),
  ('11111111-1', 'Carlos Rodríguez Silva',  'carlos.r@empresa.cl',     '+56911111111', 'Pasaje Sol 890, Concepción'),
  ('22222222-2', 'Ana Martínez Díaz',       'ana.martinez@outlook.com','+56922222222', 'Av. O''Higgins 321, Temuco'),
  ('33333333-3', 'Pedro Soto Vargas',       'pedro.soto@gmail.com',    '+56933333333', 'Los Robles 456, Rancagua');

-- ============================================================
-- USUARIO ADMINISTRADOR
-- Ejecuta el siguiente script para generar el hash correcto:
--   node database/create-admin.js
--
-- O genera el hash manualmente con Node.js:
--   node -e "const b=require('bcryptjs'); b.hash('admin123',10).then(h=>console.log(h))"
-- Luego reemplaza PASSWORD_HASH_AQUI con el hash generado.
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES
  ('Administrador', 'admin@pos.cl', '$2a$10$sGU1RYq5g6YmJEy0v.qqS.QpMZjlU.Ee1GFHS8r2TRDQY53Y2NRPG', 1);

INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES
  ('Cajero Demo', 'cajero@pos.cl', '$2a$10$XEMxr9rCPZ4LkyKNg0IkUuBkiWOWFvkvHEC27PlaozzXpROB7PgCy', 2);

-- ============================================================
-- VENTAS DE EJEMPLO
-- Se insertan solo si hay usuarios creados. Ajustar usuario_id según corresponda.
-- ============================================================
-- Ver database/create-admin.js para crear usuarios primero.
