const router = require('express').Router();
const { login, me, logout } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter }   = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

module.exports = router;
