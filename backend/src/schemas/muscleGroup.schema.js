import { z } from 'zod';

export const createMuscleGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(40),
  }),
});
