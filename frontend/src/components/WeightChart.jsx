import { formatNumber, formatShortDate } from '../lib/stats.js'

const W = 320
const H = 170
const PAD = { top: 22, right: 18, bottom: 28, left: 18 }
const MAX_POINTS = 12

export default function WeightChart({ entries }) {
  const points = entries.slice(-MAX_POINTS)

  if (points.length < 2) {
    return (
      <div className="chart chart--empty">
        <p>Registre ao menos 2 séries para ver a evolução da carga.</p>
      </div>
    )
  }

  const weights = points.map((p) => p.weightKg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const span = max - min || 1
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const coords = points.map((p, i) => ({
    x: PAD.left + (i / (points.length - 1)) * innerW,
    y: PAD.top + innerH - ((p.weightKg - min) / span) * innerH,
    p,
  }))
  const line = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const area = `${PAD.left},${H - PAD.bottom} ${line} ${W - PAD.right},${H - PAD.bottom}`
  const last = coords.at(-1)
  const summary = `Peso por registro, de ${formatNumber(weights[0])} kg a ${formatNumber(weights.at(-1))} kg em ${points.length} registros.`

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH * t}
            y2={PAD.top + innerH * t}
            className="chart__grid"
          />
        ))}
        <polygon points={area} fill="url(#chart-fill)" />
        <polyline points={line} className="chart__line" />
        {coords.map((c) => (
          <circle key={c.p.id} cx={c.x} cy={c.y} r="3.5" className="chart__dot" />
        ))}
        <circle cx={last.x} cy={last.y} r="6" className="chart__dot chart__dot--last" />
        <text
          x={Math.min(last.x, W - PAD.right - 18)}
          y={last.y - 12}
          textAnchor="middle"
          className="chart__label"
        >
          {formatNumber(last.p.weightKg)} kg
        </text>
        <text x={PAD.left} y={H - 8} className="chart__axis">
          {formatShortDate(points[0].performedAt)}
        </text>
        <text x={W - PAD.right} y={H - 8} textAnchor="end" className="chart__axis">
          {formatShortDate(points.at(-1).performedAt)}
        </text>
      </svg>
      <figcaption>Carga (kg) nos últimos {points.length} registros</figcaption>
    </figure>
  )
}
