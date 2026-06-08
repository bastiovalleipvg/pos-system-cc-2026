const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

// Middleware rápido para atrapar los errores de validación
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/',    authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);

router.post('/',   
  authMiddleware, 
  requireRole(['admin']), 
  upload.single('imagen'),
  [
    body('nombre').notEmpty().trim().escape().withMessage('El nombre es obligatorio'),
    body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
    body('stock').isInt({ min: 0 }).withMessage('Stock inválido')
  ],
  checkValidation,
  ctrl.create
);

router.put('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  upload.single('imagen'), 
  [
    body('nombre').optional().notEmpty().trim().escape().withMessage('El nombre no puede estar vacío'),
    body('precio').optional().isFloat({ min: 0 }).withMessage('Precio inválido'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock inválido')
  ],
  checkValidation,
  ctrl.update
);

router.delete('/:id', authMiddleware, requireRole(['admin']), ctrl.remove);

module.exports = router;
