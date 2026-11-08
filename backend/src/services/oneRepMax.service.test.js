import { describe, it, expect } from 'vitest';
import { bestOneRepMax, estimateOneRepMax, lastOneRepMaxChange, loadTable } from './oneRepMax.service.js';

describe('estimateOneRepMax (Epley)', () => {
  it.each([
    [100, 1, 100],
    [80, 8, 101.3],
    [85, 8, 107.7],
    [40, 12, 56],
  ])('%s kg × %s reps = %s kg', (weight, reps, expected) => {
    expect(estimateOneRepMax(weight, reps)).toBe(expected);
  });

  it.each([
    ['mais de 20 repetições', 20, 25],
    ['peso zero', 0, 5],
    ['repetições zero', 50, 0],
    ['repetições fracionadas', 50, 2.5],
  ])('null com %s', (_nome, weight, reps) => {
    expect(estimateOneRepMax(weight, reps)).toBeNull();
  });
});

describe('bestOneRepMax e lastOneRepMaxChange', () => {
  const entries = [
    { weightKg: 80, reps: 8 },
    { weightKg: 85, reps: 8 },
  ];

  it('vale a maior estimativa entre os registros', () => {
    expect(bestOneRepMax(entries)).toBe(107.7);
  });

  it('ignora séries sem estimativa e devolve null se nenhuma serve', () => {
    expect(bestOneRepMax([{ weightKg: 20, reps: 30 }])).toBeNull();
    expect(bestOneRepMax([])).toBeNull();
  });

  it('a variação é o quanto o último registro mudou o 1RM', () => {
    expect(lastOneRepMaxChange(entries)).toBe(6.4);
    expect(lastOneRepMaxChange([entries[1], entries[0]])).toBe(0);
  });

  it('sem base de comparação a variação é null', () => {
    expect(lastOneRepMaxChange([entries[0]])).toBeNull();
    expect(lastOneRepMaxChange([{ weightKg: 20, reps: 30 }, entries[0]])).toBeNull();
  });
});

describe('loadTable', () => {
  it('cargas por percentual, em múltiplos de 0,5 kg', () => {
    const table = loadTable(100);

    expect(table[0]).toEqual({ pct: 95, reps: 2, weightKg: 95 });
    expect(table.find((r) => r.pct === 80)).toEqual({ pct: 80, reps: 8, weightKg: 80 });
    expect(table.every((r) => r.weightKg * 2 === Math.round(r.weightKg * 2))).toBe(true);
  });
});
