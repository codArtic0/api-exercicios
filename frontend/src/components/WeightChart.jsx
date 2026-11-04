import { entryVolume, formatNumber, formatShortDate } from '../lib/stats.js'

const W = 320
const H = 170
const PAD = { top: 22, right: 18, bottom: 28, left: 18 }
const MAX_POINTS = 12

const METRICS = {
  weight: { label: 'Carga (kg)', value: (e) => e.weightKg },
  volume: { label: 'Volume (kg)', value: entryVolume },
}

export default function WeightChart({ entries, metric = 'weight' }) {
  const { label, value } = METRICS[metric]
  const points = entries.slice(-MAX_POINTS)

  if (points.length < 2) {
    return (
      <div className="chart chart--empty">
        <p>Registre ao menos 2 séries para ver a evolução.</p>
      </div>
    )
  }

  const values = points.map(value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const coords = points.map((p, i) => ({
    x: PAD.left + (i / (points.length - 1)) * innerW,
    y: PAD.top + innerH - ((value(p) - min) / span) * innerH,
    p,
  }))
  const line = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const area = `${PAD.left},${H - PAD.bottom} ${line} ${W - PAD.right},${H - PAD.bottom}`
  const last = coords.at(-1)
  const summary = `${label} por registro, de ${formatNumber(values[0])} a ${formatNumber(values.at(-1))} em ${points.length} registros.`

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--neon)" stopOpacity="0.38" />
            <stop offset="1" stopColor="var(--neon)" stopOpacity="0" />
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
        <polygon points={area} fill="url(#chart-fill)" className="chart__area" />
        <polyline points={line} pathLength="1" className="chart__line" />
        {coords.map((c, i) => (
          <circle key={c.p.id} cx={c.x} cy={c.y} r="3.5" className="chart__dot" style={{ '--i': i }} />
        ))}
        <circle
          cx={last.x}
          cy={last.y}
          r="6"
          className="chart__dot chart__dot--last"
          style={{ '--i': coords.length }}
        />
        <text
          x={Math.min(last.x, W - PAD.right - 18)}
          y={last.y - 12}
          textAnchor="middle"
          className="chart__label"
        >
          {formatNumber(values.at(-1))} kg
        </text>
        <text x={PAD.left} y={H - 8} className="chart__axis">
          {formatShortDate(points[0].performedAt)}
        </text>
        <text x={W - PAD.right} y={H - 8} textAnchor="end" className="chart__axis">
          {formatShortDate(points.at(-1).performedAt)}
        </text>
      </svg>
      <figcaption>
        {label} nos últimos {points.length} registros
      </figcaption>
    </figure>
  )
}
