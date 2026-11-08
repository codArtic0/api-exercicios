// Funções puras: recebem os exercícios de um treino e calculam as estatísticas.
// Mesma regra de volume do resto do app: peso × repetições × séries.

const round1 = (n) => Math.round(n * 10) / 10;

export const itemVolume = ({ sets, reps, weightKg }) => round1(sets * reps * weightKg);

// items: [{ exerciseId, exerciseName, sets, reps, weightKg }]. Um exercício pode ter vários itens
// (blocos com pesos diferentes): o volume e a contagem consideram o exercício como um todo.
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

  // Soma os blocos de cada exercício (a ordem de primeira aparição é mantida).
  const byExercise = new Map();
  for (const item of withVolume) {
    const current = byExercise.get(item.exerciseId);
    if (current) current.volume += item.volume;
    else byExercise.set(item.exerciseId, { exerciseId: item.exerciseId, name: item.exerciseName, volume: item.volume });
  }

  // Em empate, vale o primeiro da lista (a ordem em que foram feitos).
  const best = [...byExercise.values()].reduce((a, b) => (b.volume > a.volume ? b : a));
  const heaviest = withVolume.reduce((a, b) => (b.weightKg > a.weightKg ? b : a));

  return {
    totalVolume: round1(withVolume.reduce((sum, i) => sum + i.volume, 0)),
    totalSets: items.reduce((sum, i) => sum + i.sets, 0),
    totalReps: items.reduce((sum, i) => sum + i.sets * i.reps, 0),
    exerciseCount: byExercise.size,
    bestExercise: { exerciseId: best.exerciseId, name: best.name, volume: round1(best.volume) },
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
