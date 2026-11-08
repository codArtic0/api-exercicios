import { z } from 'zod';
import { repsField, setsField, weightKgField } from './entry.schema.js';

const idParams = z.object({ id: z.uuid() });

const itemSchema = z.object({
  exerciseId: z.uuid(),
  sets: setsField,
  reps: repsField,
  weightKg: weightKgField,
});

// Um exercício pode aparecer em mais de uma linha: cada linha é um bloco de séries com o mesmo
// peso e repetições (ex.: 1 × 12 com 20 kg e 3 × 8 com 40 kg). A ordem da lista é mantida.
const items = z.array(itemSchema).min(1).max(60);

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
