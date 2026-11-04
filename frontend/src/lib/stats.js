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

// 3725 s -> "1:02:05"; 125 s -> "2:05"
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export const formatLongDate = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '')
