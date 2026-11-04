import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', auth, authController.me);

export default router;
