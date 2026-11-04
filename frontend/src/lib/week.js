// Cálculos do painel "Hoje": tudo a partir dos treinos e das sessões que a API já devolve.

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime()

const weekdayShort = (d) => d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

// Os 7 dias terminando hoje, do mais antigo para o mais novo, com o volume de cada um.
export function lastSevenDays(sessions, today = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i))
    const ofDay = sessions.filter((s) => sameDay(new Date(s.finishedAt), date))
    return {
      date,
      short: weekdayShort(date),
      initial: weekdayShort(date).charAt(0).toUpperCase(),
      volume: Math.round(ofDay.reduce((sum, s) => sum + s.stats.totalVolume, 0) * 10) / 10,
      count: ofDay.length,
      isToday: i === 6,
    }
  })
}

// Totais dos últimos 7 dias.
export function weekTotals(sessions, today = new Date()) {
  const from = startOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6))
  const inWindow = sessions.filter((s) => new Date(s.finishedAt) >= from)
  return {
    workouts: inWindow.length,
    volume: Math.round(inWindow.reduce((sum, s) => sum + s.stats.totalVolume, 0) * 10) / 10,
    sets: inWindow.reduce((sum, s) => sum + s.stats.totalSets, 0),
  }
}

// Próximo treino da sequência: depois do último que foi feito (A -> B -> C -> A...).
// sessions vem do mais recente para o mais antigo.
export function pickNextWorkout(workouts, sessions) {
  if (workouts.length === 0) return null
  const last = sessions.find((s) => s.workoutId)
  if (!last) return workouts[0]
  const index = workouts.findIndex((w) => w.id === last.workoutId)
  return index === -1 ? workouts[0] : workouts[(index + 1) % workouts.length]
}

export const plannedVolume = (workout) =>
  Math.round(workout.items.reduce((sum, i) => sum + i.sets * i.reps * i.weightKg, 0) * 10) / 10

export const plannedSets = (workout) => workout.items.reduce((sum, i) => sum + i.sets, 0)

// Teto "redondo" para o eixo do gráfico: 6800 -> 8000, 2520 -> 3000.
export function niceMax(value) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * magnitude).find((s) => s >= value)
  return step
}

// Inicial do treino para o selo: "Treino B" -> "B".
export function workoutBadge(name) {
  const last = name.trim().split(/\s+/).at(-1) ?? ''
  return last.charAt(0).toUpperCase() || '·'
}
