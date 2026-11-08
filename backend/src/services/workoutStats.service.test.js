import { describe, it, expect } from 'vitest';
import {
  compareWithPrevious,
  computeSessionStats,
  groupByExercise,
  itemVolume,
  plannedByExercise,
  plannedTotals,
} from './workoutStats.service.js';

const item = (name, sets, reps, weightKg) => ({
  exerciseId: `id-${name}`,
  exerciseName: name,
  sets,
  reps,
  weightKg,
});

describe('itemVolume', () => {
  it('peso × repetições × séries (o exemplo do diagrama: 90 × 12 × 3 = 3240)', () => {
    expect(itemVolume({ sets: 3, reps: 12, weightKg: 90 })).toBe(3240);
  });

  it('arredonda para uma casa decimal', () => {
    expect(itemVolume({ sets: 3, reps: 10, weightKg: 22.5 })).toBe(675);
    expect(itemVolume({ sets: 1, reps: 7, weightKg: 1.1 })).toBe(7.7);
  });
});

describe('computeSessionStats', () => {
  const items = [item('Agachamento', 3, 8, 70), item('Leg press', 2, 10, 120), item('Extensora', 3, 15, 40)];

  it('soma volume, séries, repetições e conta os exercícios', () => {
    const stats = computeSessionStats(items);

    // 1680 + 2400 + 1800
    expect(stats.totalVolume).toBe(5880);
    expect(stats.totalSets).toBe(8);
    expect(stats.totalReps).toBe(24 + 20 + 45);
    expect(stats.exerciseCount).toBe(3);
  });

  it('melhor exercício é o de maior volume', () => {
    expect(computeSessionStats(items).bestExercise).toEqual({
      exerciseId: 'id-Leg press',
      name: 'Leg press',
      volume: 2400,
    });
  });

  it('mais pesado é o de maior carga, que pode ser outro exercício', () => {
    const stats = computeSessionStats([item('A', 5, 10, 50), item('B', 1, 3, 100)]);

    expect(stats.bestExercise.name).toBe('A');
    expect(stats.heaviest).toEqual({ exerciseId: 'id-B', name: 'B', weightKg: 100 });
  });

  it('em empate vale o primeiro da lista', () => {
    const stats = computeSessionStats([item('A', 2, 10, 50), item('B', 2, 10, 50)]);

    expect(stats.bestExercise.name).toBe('A');
    expect(stats.heaviest.name).toBe('A');
  });

  it('um exercício só', () => {
    const stats = computeSessionStats([item('A', 3, 12, 90)]);

    expect(stats.totalVolume).toBe(3240);
    expect(stats.bestExercise.name).toBe('A');
    expect(stats.exerciseCount).toBe(1);
  });

  it('blocos do mesmo exercício contam como um exercício e somam o volume', () => {
    // Supino: 1 × 12 com 20 kg + 3 × 8 com 40 kg = 240 + 960 = 1200. Remada: 4 × 10 com 25 kg = 1000.
    const stats = computeSessionStats([
      item('Supino', 1, 12, 20),
      item('Supino', 3, 8, 40),
      item('Remada', 4, 10, 25),
    ]);

    expect(stats.exerciseCount).toBe(2);
    expect(stats.totalSets).toBe(8);
    expect(stats.totalVolume).toBe(2200);
    expect(stats.bestExercise).toEqual({ exerciseId: 'id-Supino', name: 'Supino', volume: 1200 });
    expect(stats.heaviest).toEqual({ exerciseId: 'id-Supino', name: 'Supino', weightKg: 40 });
  });

  it('lista vazia: tudo zerado e sem destaque', () => {
    expect(computeSessionStats([])).toEqual({
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      exerciseCount: 0,
      bestExercise: null,
      heaviest: null,
    });
  });
});

describe('compareWithPrevious', () => {
  it('devolve o volume anterior e a variação em %', () => {
    expect(compareWithPrevious(6800, 4080)).toEqual({ totalVolume: 4080, deltaPct: 66.7 });
  });

  it('variação negativa quando o volume caiu', () => {
    expect(compareWithPrevious(900, 1000)).toEqual({ totalVolume: 1000, deltaPct: -10 });
  });

  it('volume igual: 0%', () => {
    expect(compareWithPrevious(1000, 1000).deltaPct).toBe(0);
  });

  it.each([null, undefined, 0])('sem comparação quando o anterior é %s', (previous) => {
    expect(compareWithPrevious(1000, previous)).toBeNull();
  });
});

describe('groupByExercise', () => {
  const ex = (id, name) => ({ id, name });

  it('junta blocos seguidos do mesmo exercício e soma o volume', () => {
    const groups = groupByExercise([
      { exercise: ex('s', 'Supino'), sets: 1, reps: 12, weightKg: 20 },
      { exercise: ex('s', 'Supino'), sets: 3, reps: 8, weightKg: 40 },
      { exercise: ex('r', 'Remada'), sets: 4, reps: 10, weightKg: 25 },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ exercise: { id: 's' }, volume: 1200 });
    expect(groups[0].blocks).toEqual([
      { sets: 1, reps: 12, weightKg: 20, volume: 240 },
      { sets: 3, reps: 8, weightKg: 40, volume: 960 },
    ]);
    expect(groups[1].volume).toBe(1000);
  });
});

describe('plannedTotals e plannedByExercise', () => {
  const items = [
    { exercise: { id: 's' }, sets: 1, reps: 12, weightKg: 20 },
    { exercise: { id: 's' }, sets: 3, reps: 8, weightKg: 40 },
    { exercise: { id: 'r' }, sets: 4, reps: 10, weightKg: 25 },
  ];

  it('volume, séries e exercícios distintos', () => {
    expect(plannedTotals(items)).toEqual({ volume: 2200, sets: 8, exerciseCount: 2 });
  });

  it('volume previsto por exercício soma os blocos', () => {
    expect(plannedByExercise(items)).toEqual({ s: 1200, r: 1000 });
  });
});
