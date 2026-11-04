import { describe, it, expect } from 'vitest';
import { createEntrySchema } from './entry.schema.js';

const id = '3f9c1d2e-5b7a-4c8d-9e0f-1a2b3c4d5e6f';
const valid = { sets: 3, reps: 12, weightKg: 90.5 };

const parse = (body, params = { id }) => createEntrySchema.safeParse({ params, body });
const failsAt = (result, field) =>
  !result.success && result.error.issues.some((i) => i.path.includes(field));

describe('createEntrySchema', () => {
  it('aceita um registro válido sem data', () => {
    expect(parse(valid).success).toBe(true);
  });

  it('aceita performedAt no passado e converte para Date', () => {
    const result = parse({ ...valid, performedAt: '2026-01-10T10:00:00Z' });

    expect(result.success).toBe(true);
    expect(result.data.body.performedAt).toBeInstanceOf(Date);
  });

  it.each([1, 50])('aceita sets no limite (%i)', (sets) => {
    expect(parse({ ...valid, sets }).success).toBe(true);
  });

  it.each([0, 51, 1.5, '3', null])('rejeita sets inválido (%s)', (sets) => {
    expect(failsAt(parse({ ...valid, sets }), 'sets')).toBe(true);
  });

  it.each([0, 201, 1.5, '12'])('rejeita reps inválido (%s)', (reps) => {
    expect(failsAt(parse({ ...valid, reps }), 'reps')).toBe(true);
  });

  it.each([60, 60.5, 0.5, 1000, 1.1, 60.3])('aceita weightKg %s', (weightKg) => {
    expect(parse({ ...valid, weightKg }).success).toBe(true);
  });

  it.each([0, -5, 1000.1, 60.55, 60.05, '90'])('rejeita weightKg %s', (weightKg) => {
    expect(failsAt(parse({ ...valid, weightKg }), 'weightKg')).toBe(true);
  });

  it('rejeita performedAt no futuro', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();

    expect(failsAt(parse({ ...valid, performedAt: future }), 'performedAt')).toBe(true);
  });

  it('rejeita performedAt que não é data', () => {
    expect(failsAt(parse({ ...valid, performedAt: 'ontem' }), 'performedAt')).toBe(true);
  });

  it('rejeita id que não é UUID', () => {
    expect(failsAt(parse(valid, { id: '123' }), 'id')).toBe(true);
  });

  it.each(['sets', 'reps', 'weightKg'])('rejeita body sem %s', (field) => {
    const body = { ...valid };
    delete body[field];

    expect(failsAt(parse(body), field)).toBe(true);
  });
});
