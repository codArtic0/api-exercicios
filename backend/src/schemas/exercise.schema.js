import { z } from 'zod';

export const listExercisesSchema = z.object({
  query: z.object({
    group: z.string().trim().min(1).max(50).optional(),
    q: z.string().trim().min(1).max(100).optional(),
  }),
});
