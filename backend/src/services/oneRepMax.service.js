// 1RM (uma repetição máxima) estimado pela fórmula de Epley: 1RM = peso × (1 + repetições / 30).
// Com 1 repetição o resultado é o próprio peso. Acima de MAX_REPS a estimativa fica imprecisa
// (a série vira resistência, não força), então esses registros não entram no cálculo.
export const MAX_REPS = 20;

const round1 = (n) => Math.round(n * 10) / 10;

export function estimateOneRepMax(weightKg, reps) {
  if (!(weightKg > 0) || !Number.isInteger(reps) || reps < 1 || reps > MAX_REPS) return null;
  return round1(reps === 1 ? weightKg : weightKg * (1 + reps / 30));
}

// Maior 1RM estimado entre os registros. null quando nenhum serve para o cálculo.
export function bestOneRepMax(entries) {
  const values = entries.map((e) => estimateOneRepMax(e.weightKg, e.reps)).filter((v) => v !== null);
  return values.length > 0 ? Math.max(...values) : null;
}

// Quanto o 1RM subiu (ou caiu) com o registro mais recente. Espera a lista em ordem cronológica.
// null sem base de comparação.
export function lastOneRepMaxChange(entries) {
  if (entries.length < 2) return null;
  const before = bestOneRepMax(entries.slice(0, -1));
  const now = bestOneRepMax(entries);
  if (before === null || now === null) return null;
  return round1(now - before);
}

// Percentual do 1RM e repetições típicas nessa carga (tabela usual de treino de força).
const PERCENTAGES = [
  { pct: 95, reps: 2 },
  { pct: 90, reps: 4 },
  { pct: 85, reps: 6 },
  { pct: 80, reps: 8 },
  { pct: 75, reps: 10 },
  { pct: 70, reps: 12 },
  { pct: 60, reps: 15 },
];

// Cargas sugeridas a partir do 1RM, arredondadas para 0,5 kg (o menor salto de anilha comum).
export const loadTable = (oneRepMax) =>
  PERCENTAGES.map(({ pct, reps }) => ({
    pct,
    reps,
    weightKg: Math.round(((oneRepMax * pct) / 100) * 2) / 2,
  }));
