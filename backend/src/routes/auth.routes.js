const { Router } = require('express');
const { register, login, profile } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { registerSchema, loginSchema } = require('../validation/auth.validation');

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, profile);

module.exports = router;
