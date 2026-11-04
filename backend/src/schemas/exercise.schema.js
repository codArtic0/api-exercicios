import { z } from 'zod';

export const listExercisesSchema = z.object({
  query: z.object({
    group: z.string().trim().min(1).max(50).optional(),
    q: z.string().trim().min(1).max(100).optional(),
  }),
});

export const createExerciseSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    primaryGroupId: z.uuid(),
    relatedGroupIds: z.array(z.uuid()).max(10).default([]),
  }),
});
