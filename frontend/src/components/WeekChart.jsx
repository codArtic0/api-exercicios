import { useState } from 'react'
import { formatNumber } from '../lib/stats.js'
import { niceMax } from '../lib/week.js'

// Volume dos últimos 7 dias. Cada barra é um botão: toque ou foco mostra o valor do dia.
// Dia sem treino aparece como um toco hachurado, para não parecer dado perdido.
export default function WeekChart({ days }) {
  const [picked, setPicked] = useState(null)
  const selected = picked ?? days.length - 1
  const day = days[selected]

  const max = niceMax(Math.max(...days.map((d) => d.volume)))
  const ticks = [max, max / 2, 0]

  return (
    <figure className="week">
      <div className="week__readout" aria-live="polite">
        <span className="micro">
          {day.isToday ? 'Hoje' : day.short} · {day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
        </span>
        <strong className="week__value">
          {day.count > 0 ? formatNumber(day.volume) : '—'}
          {day.count > 0 && <small> kg</small>}
        </strong>
        <span className="micro">{day.count === 0 ? 'sem treino' : `${day.count} ${day.count === 1 ? 'treino' : 'treinos'}`}</span>
      </div>

      <div className="week__plot">
        <div className="week__grid" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="week__line">
              <i className="micro">{formatNumber(t)}</i>
            </span>
          ))}
        </div>
        <div className="week__bars" role="group" aria-label="Volume por dia, em kg">
          {days.map((d, i) => (
            <button
              key={d.date.toISOString()}
              type="button"
              className={i === selected ? 'bar bar--on' : 'bar'}
              aria-label={`${d.short}: ${d.count > 0 ? `${formatNumber(d.volume)} kg` : 'sem treino'}`}
              aria-pressed={i === selected}
              onClick={() => setPicked(i)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setPicked(i)}
              style={{ '--h': d.count > 0 ? Math.max((d.volume / max) * 100, 4) : 0, '--i': i }}
            >
              <span className="bar__track">
                <span className={d.count > 0 ? 'bar__fill' : 'bar__fill bar__fill--empty'} />
              </span>
              <span className={d.isToday ? 'bar__day bar__day--today' : 'bar__day'}>{d.short}</span>
            </button>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <caption>Volume por dia nos últimos 7 dias</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>Volume (kg)</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date.toISOString()}>
              <td>{d.date.toLocaleDateString('pt-BR')}</td>
              <td>{d.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
