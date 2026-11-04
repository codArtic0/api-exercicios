// Funções puras: recebem os exercícios de um treino e calculam as estatísticas.
// Mesma regra de volume do resto do app: peso × repetições × séries.

const round1 = (n) => Math.round(n * 10) / 10;

export const itemVolume = ({ sets, reps, weightKg }) => round1(sets * reps * weightKg);

// items: [{ exerciseId, exerciseName, sets, reps, weightKg }]
export function computeSessionStats(items) {
  if (items.length === 0) {
    return {
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      exerciseCount: 0,
      bestExercise: null,
      heaviest: null,
    };
  }

  const withVolume = items.map((item) => ({ ...item, volume: itemVolume(item) }));

  // Em empate, vale o primeiro da lista (a ordem em que foram feitos).
  const best = withVolume.reduce((a, b) => (b.volume > a.volume ? b : a));
  const heaviest = withVolume.reduce((a, b) => (b.weightKg > a.weightKg ? b : a));

  return {
    totalVolume: round1(withVolume.reduce((sum, i) => sum + i.volume, 0)),
    totalSets: items.reduce((sum, i) => sum + i.sets, 0),
    totalReps: items.reduce((sum, i) => sum + i.sets * i.reps, 0),
    exerciseCount: items.length,
    bestExercise: { exerciseId: best.exerciseId, name: best.exerciseName, volume: best.volume },
    heaviest: { exerciseId: heaviest.exerciseId, name: heaviest.exerciseName, weightKg: heaviest.weightKg },
  };
}

// Compara o volume com o do treino anterior. null quando não há anterior com volume.
export function compareWithPrevious(totalVolume, previousVolume) {
  if (previousVolume === null || previousVolume === undefined || previousVolume <= 0) return null;
  return {
    totalVolume: previousVolume,
    deltaPct: round1(((totalVolume - previousVolume) / previousVolume) * 100),
  };
}
