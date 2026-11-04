// Mesma regra da API: volume = peso × repetições × séries.
const round1 = (n) => Math.round(n * 10) / 10

export const entryVolume = (e) => round1(e.weightKg * e.reps * e.sets)

export function computeStats(entries) {
  if (entries.length === 0) return null
  return {
    maxWeight: Math.max(...entries.map((e) => e.weightKg)),
    maxReps: Math.max(...entries.map((e) => e.reps)),
    maxVolume: Math.max(...entries.map(entryVolume)),
  }
}

export const formatNumber = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export const byDateAsc = (a, b) => new Date(a.performedAt) - new Date(b.performedAt)
