import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', auth, dashboardController.get);

export default router;
