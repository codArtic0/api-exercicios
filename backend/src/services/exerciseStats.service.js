import { itemVolume } from './workoutStats.service.js';
import { MAX_REPS, bestOneRepMax, estimateOneRepMax, lastOneRepMaxChange, loadTable } from './oneRepMax.service.js';

// Campos derivados de um registro, devolvidos junto dele: o volume e o 1RM estimado daquela série.
export const withDerived = (entry) => ({
  ...entry,
  volume: itemVolume(entry),
  oneRepMax: estimateOneRepMax(entry.weightKg, entry.reps),
});

// Recordes e 1RM de um exercício. entries em ordem cronológica.
export function computeExerciseStats(entries) {
  if (entries.length === 0) {
    return { entryCount: 0, maxWeight: null, maxReps: null, maxVolume: null, oneRepMax: null, oneRepMaxRepLimit: MAX_REPS };
  }

  const best = bestOneRepMax(entries);
  return {
    entryCount: entries.length,
    maxWeight: Math.max(...entries.map((e) => e.weightKg)),
    maxReps: Math.max(...entries.map((e) => e.reps)),
    maxVolume: Math.max(...entries.map(itemVolume)),
    oneRepMaxRepLimit: MAX_REPS,
    oneRepMax: best === null ? null : { value: best, change: lastOneRepMaxChange(entries), loadTable: loadTable(best) },
  };
}
