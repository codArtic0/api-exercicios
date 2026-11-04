import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { listSessionsSchema, sessionIdSchema } from '../schemas/workout.schema.js';
import * as sessionController from '../controllers/session.controller.js';

const router = Router();

router.get('/', auth, validate(listSessionsSchema), sessionController.list);
router.get('/:id', auth, validate(sessionIdSchema), sessionController.get);
router.delete('/:id', auth, validate(sessionIdSchema), sessionController.remove);

export default router;
