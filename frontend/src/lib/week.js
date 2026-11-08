// Apresentação do painel "Hoje". As regras (semana, volume, próximo treino) vêm prontas da API.

const weekdayShort = (d) => d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

// Dia da API ("2026-11-04") -> rótulos para o gráfico. Meio-dia local evita virar de dia por fuso.
export function decorateDays(days) {
  return days.map((day) => {
    const date = new Date(`${day.date}T12:00:00`)
    return {
      ...day,
      date,
      short: weekdayShort(date),
      initial: weekdayShort(date).charAt(0).toUpperCase(),
    }
  })
}

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
