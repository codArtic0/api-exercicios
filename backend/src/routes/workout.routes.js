import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createWorkoutSchema,
  finishSessionSchema,
  updateWorkoutSchema,
  workoutIdSchema,
} from '../schemas/workout.schema.js';
import * as workoutController from '../controllers/workout.controller.js';

const router = Router();

router.get('/', auth, workoutController.list);
router.post('/', auth, validate(createWorkoutSchema), workoutController.create);
router.get('/:id', auth, validate(workoutIdSchema), workoutController.get);
router.put('/:id', auth, validate(updateWorkoutSchema), workoutController.update);
router.delete('/:id', auth, validate(workoutIdSchema), workoutController.remove);
router.post('/:id/sessions', auth, validate(finishSessionSchema), workoutController.finish);

export default router;
