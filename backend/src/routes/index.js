import { Router } from 'express';
import authRoutes from './auth.routes.js';
import exerciseRoutes from './exercise.routes.js';
import muscleGroupRoutes from './muscleGroup.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/muscle-groups', muscleGroupRoutes);
router.use('/exercises', exerciseRoutes);

export default router;
