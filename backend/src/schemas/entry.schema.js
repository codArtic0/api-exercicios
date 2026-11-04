import { z } from 'zod';

const oneDecimal = (v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9;

// Limites de uma série. Reaproveitados pelos treinos (modelo e execução do dia).
export const setsField = z.number().int().min(1).max(50);
export const repsField = z.number().int().min(1).max(200);
export const weightKgField = z
  .number()
  .positive()
  .max(1000)
  .refine(oneDecimal, 'Use no máximo uma casa decimal');

export const createEntrySchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    sets: setsField,
    reps: repsField,
    weightKg: weightKgField,
    performedAt: z.coerce
      .date()
      .refine((d) => d <= new Date(), 'A data não pode estar no futuro')
      .optional(),
  }),
});

export const listEntriesSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});
