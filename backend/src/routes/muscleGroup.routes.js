import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createMuscleGroupSchema } from '../schemas/muscleGroup.schema.js';
import * as muscleGroupController from '../controllers/muscleGroup.controller.js';

const router = Router();

router.get('/', auth, muscleGroupController.list);
router.post('/', auth, validate(createMuscleGroupSchema), muscleGroupController.create);

export default router;
