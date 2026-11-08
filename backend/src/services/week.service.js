// Regras do painel "Hoje": semana e treino seguinte. Funções puras; o fuso é o do usuário.

const DAY_MS = 24 * 60 * 60 * 1000;

// Fuso inválido ou ausente cai em UTC, para nunca derrubar a rota.
export function safeTimeZone(timeZone) {
  if (!timeZone) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone });
    return timeZone;
  } catch {
    return 'UTC';
  }
}

// Dia civil ("2026-11-04") de um instante no fuso informado.
export const dayKey = (date, timeZone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

// Os 7 dias terminando hoje, do mais antigo para o mais novo. A conta é feita sobre o dia civil,
// então horário de verão não desloca nada.
export function lastSevenDayKeys(now, timeZone) {
  const [y, m, d] = dayKey(now, timeZone).split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(y, m - 1, d - (6 - i))).toISOString().slice(0, 10));
}

const round1 = (n) => Math.round(n * 10) / 10;

// sessions: [{ finishedAt, stats: { totalVolume, totalSets } }]
export function weekSummary(sessions, now, timeZone) {
  const keys = lastSevenDayKeys(now, timeZone);
  const byDay = new Map(keys.map((k) => [k, []]));
  for (const s of sessions) byDay.get(dayKey(new Date(s.finishedAt), timeZone))?.push(s);

  const days = keys.map((date, i) => {
    const ofDay = byDay.get(date);
    return {
      date,
      volume: round1(ofDay.reduce((sum, s) => sum + s.stats.totalVolume, 0)),
      count: ofDay.length,
      isToday: i === 6,
    };
  });

  const inWindow = [...byDay.values()].flat();
  return {
    days,
    totals: {
      workouts: inWindow.length,
      volume: round1(inWindow.reduce((sum, s) => sum + s.stats.totalVolume, 0)),
      sets: inWindow.reduce((sum, s) => sum + s.stats.totalSets, 0),
    },
  };
}

// Instante mais antigo que pode cair na janela de 7 dias em qualquer fuso (folga de dois dias).
export const weekWindowStart = (now) => new Date(now.getTime() - 9 * DAY_MS);

// Próximo treino da sequência: o que vem depois do último realizado (A -> B -> C -> A...).
export function pickNextWorkout(workouts, lastWorkoutId) {
  if (workouts.length === 0) return null;
  if (!lastWorkoutId) return workouts[0];
  const index = workouts.findIndex((w) => w.id === lastWorkoutId);
  return index === -1 ? workouts[0] : workouts[(index + 1) % workouts.length];
}
