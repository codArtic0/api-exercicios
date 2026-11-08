import { useState } from 'react'
import { entryOneRepMax } from '../lib/oneRepMax.js'
import { entryVolume, formatNumber, formatShortDate } from '../lib/stats.js'

const W = 340
const H = 190
const PAD = { top: 14, right: 14, bottom: 26, left: 46 }
const MAX_POINTS = 12

const METRICS = {
  weight: { label: 'Carga', value: (e) => e.weightKg },
  volume: { label: 'Volume', value: entryVolume },
  oneRm: { label: '1RM estimado', value: entryOneRepMax },
}

// Evolução nos últimos registros. Linha de 2 px, marcas de 8 px com anel da cor do fundo,
// só o último ponto em destaque. Toque ou mouse sobre o gráfico mostra o valor de cada registro.
export default function WeightChart({ entries, metric = 'weight' }) {
  const { label, value } = METRICS[metric]
  const points = entries.slice(-MAX_POINTS)
  const [picked, setPicked] = useState(null)

  if (points.length < 2) {
    return (
      <div className="chart chart--empty">
        <p>Registre ao menos 2 séries para ver a evolução.</p>
      </div>
    )
  }

  const values = points.map(value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = (rawMax - rawMin || rawMax || 1) * 0.15
  const lo = Math.max(0, rawMin - pad)
  const hi = rawMax + pad
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const x = (i) => PAD.left + (i / (points.length - 1)) * innerW
  const y = (v) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH
  const coords = points.map((p, i) => ({ x: x(i), y: y(values[i]), p, v: values[i] }))

  const line = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const area = `${PAD.left},${PAD.top + innerH} ${line} ${x(points.length - 1)},${PAD.top + innerH}`
  const ticks = [hi, (hi + lo) / 2, lo]

  const index = picked ?? points.length - 1
  const shown = coords[index]

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const nearest = coords.reduce((best, c, i) => (Math.abs(c.x - px) < Math.abs(coords[best].x - px) ? i : best), 0)
    setPicked(nearest)
  }

  return (
    <figure className="chart">
      <div className="chart__readout" aria-live="polite">
        <span className="micro">{formatShortDate(shown.p.performedAt)}</span>
        <strong className="chart__value">
          {formatNumber(shown.v)}
          <small> kg</small>
        </strong>
        <span className="micro">
          {shown.p.sets} × {shown.p.reps} · {formatNumber(shown.p.weightKg)} kg
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label} por registro, de ${formatNumber(values[0])} a ${formatNumber(values.at(-1))} kg em ${points.length} registros.`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setPicked(null)}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={PAD.left - 8} y={y(t) + 3.5} textAnchor="end" className="chart__axis">
              {formatNumber(t)}
            </text>
          </g>
        ))}

        <polygon points={area} fill="url(#chart-fill)" className="chart__area" />
        <polyline points={line} pathLength="1" className="chart__line" />

        <line x1={shown.x} x2={shown.x} y1={PAD.top} y2={PAD.top + innerH} className="chart__cursor" />
        {coords.map((c, i) => (
          <circle
            key={c.p.id}
            cx={c.x}
            cy={c.y}
            r={i === index ? 5.5 : 4}
            className={i === index ? 'chart__dot chart__dot--on' : 'chart__dot'}
            style={{ '--i': i }}
          />
        ))}

        <text x={PAD.left} y={H - 6} className="chart__axis">
          {formatShortDate(points[0].performedAt)}
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" className="chart__axis">
          {formatShortDate(points.at(-1).performedAt)}
        </text>
      </svg>
    </figure>
  )
}
