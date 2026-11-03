import { z } from 'zod';

const oneDecimal = (v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9;

export const createEntrySchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    sets: z.number().int().min(1).max(50),
    reps: z.number().int().min(1).max(200),
    weightKg: z
      .number()
      .positive()
      .max(1000)
      .refine(oneDecimal, 'Use no máximo uma casa decimal'),
    performedAt: z.coerce
      .date()
      .refine((d) => d <= new Date(), 'A data não pode estar no futuro')
      .optional(),
  }),
});
