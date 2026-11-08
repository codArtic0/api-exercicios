import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createEntrySchema, listEntriesSchema } from '../schemas/entry.schema.js';
import { createExerciseSchema, listExercisesSchema } from '../schemas/exercise.schema.js';
import * as entryController from '../controllers/entry.controller.js';
import * as exerciseController from '../controllers/exercise.controller.js';

const router = Router();

router.get('/', auth, validate(listExercisesSchema), exerciseController.list);
router.post('/', auth, validate(createExerciseSchema), exerciseController.create);
router.post('/:id/entries', auth, validate(createEntrySchema), entryController.create);
router.get('/:id/entries', auth, validate(listEntriesSchema), entryController.listByExercise);
router.get('/:id/stats', auth, validate(listEntriesSchema), entryController.stats);

export default router;
