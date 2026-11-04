import { z } from 'zod';
import { repsField, setsField, weightKgField } from './entry.schema.js';

const idParams = z.object({ id: z.uuid() });

const itemSchema = z.object({
  exerciseId: z.uuid(),
  sets: setsField,
  reps: repsField,
  weightKg: weightKgField,
});

const items = z
  .array(itemSchema)
  .min(1)
  .max(30)
  .refine((list) => new Set(list.map((i) => i.exerciseId)).size === list.length, {
    message: 'Exercício repetido no treino',
  });

const name = z.string().trim().min(1).max(60);

export const workoutIdSchema = z.object({ params: idParams });

export const createWorkoutSchema = z.object({ body: z.object({ name, items }) });

export const updateWorkoutSchema = z.object({ params: idParams, body: z.object({ name, items }) });

// O que foi realmente feito no dia: pode ter menos exercícios e números diferentes do modelo.
export const finishSessionSchema = z.object({
  params: idParams,
  body: z.object({
    items,
    startedAt: z.coerce
      .date()
      .refine((d) => d <= new Date(), 'O início não pode estar no futuro')
      .optional(),
  }),
});

export const sessionIdSchema = z.object({ params: idParams });

export const listSessionsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});
