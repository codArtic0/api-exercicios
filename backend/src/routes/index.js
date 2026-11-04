import { Router } from 'express';
import authRoutes from './auth.routes.js';
import exerciseRoutes from './exercise.routes.js';
import muscleGroupRoutes from './muscleGroup.routes.js';
import sessionRoutes from './session.routes.js';
import workoutRoutes from './workout.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/muscle-groups', muscleGroupRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/workouts', workoutRoutes);
router.use('/sessions', sessionRoutes);

export default router;
