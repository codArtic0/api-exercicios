import { useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { formatLongDate, formatNumber } from '../lib/stats.js'
import { useCountUp } from '../lib/useCountUp.js'
import { groupByExercise } from '../lib/workout.js'
import Gauge from './Gauge.jsx'
import { ArrowDown, ArrowUp, Trash, Trophy } from './Icons.jsx'

// Estatísticas de um treino realizado: logo após finalizar ou ao abrir pelo histórico.
// "planned" (volume do modelo) só existe logo após finalizar. Com ele aparecem o medidor e as
// barras hachuradas do que o modelo previa; sem ele, só o que foi feito.
export default function SessionSummary({ session, planned, justFinished, onClose, onDeleted }) {
  const { stats } = session
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const volume = useCountUp(stats.totalVolume)

  const previous = stats.previous
  const pct = planned && planned.volume > 0 ? (stats.totalVolume / planned.volume) * 100 : null
  const groups = groupByExercise(session.items)
  const maxBar = Math.max(...groups.flatMap((g) => [g.volume, planned?.byExercise?.[g.exercise.id] ?? 0]), 1)

  async function remove() {
    if (!window.confirm('Apagar este treino? As séries que ele registrou também serão apagadas.')) return
    setBusy(true)
    try {
      await api.deleteSession(session.id)
      onDeleted()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <>
      <header className="greet">
        <p className="micro">{justFinished ? 'Treino concluído' : formatLongDate(session.finishedAt)}</p>
        <h1 className="title-xl">{session.workoutName}</h1>
      </header>

      <section className="panel hud hero" aria-label="Volume total">
        <span className="micro">Volume total</span>
        <strong className="hero__num num">
          {formatNumber(volume)}
          <small>kg</small>
        </strong>
        {previous && (
          <span className={previous.deltaPct >= 0 ? 'delta delta--up' : 'delta delta--down'}>
            {previous.deltaPct >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {formatNumber(Math.abs(previous.deltaPct))}% vs treino anterior
            <span className="num"> ({formatNumber(previous.totalVolume)} kg)</span>
          </span>
        )}
      </section>

      <section className={pct === null ? 'facts-wrap' : 'facts-wrap facts-wrap--gauge'}>
        {pct !== null && <Gauge value={pct} label="Volume feito em relação ao modelo" caption="do modelo" />}
        <dl className="facts">
          <div>
            <dt className="micro">Séries</dt>
            <dd className="num">{stats.totalSets}</dd>
          </div>
          <div>
            <dt className="micro">Exercícios</dt>
            <dd className="num">{stats.exerciseCount}</dd>
          </div>
          <div>
            <dt className="micro">Duração</dt>
            <dd className="num">
              {session.durationMinutes === null ? '—' : session.durationMinutes < 1 ? '<1 min' : `${session.durationMinutes} min`}
            </dd>
          </div>
        </dl>
      </section>

      {stats.bestExercise && (
        <section className="highlights">
          <div className="highlight">
            <span className="micro">
              <Trophy size={12} /> Melhor exercício
            </span>
            <strong>{stats.bestExercise.name}</strong>
            <span className="num">{formatNumber(stats.bestExercise.volume)} kg de volume</span>
          </div>
          <div className="highlight">
            <span className="micro">
              <Trophy size={12} /> Mais pesado
            </span>
            <strong>{stats.heaviest.name}</strong>
            <span className="num">{formatNumber(stats.heaviest.weightKg)} kg</span>
          </div>
        </section>
      )}

      <section>
        <header className="sec">
          <h2 className="micro">Exercícios</h2>
          {planned && (
            <span className="legend micro">
              <i className="legend__swatch legend__swatch--plan" /> Modelo
              <i className="legend__swatch" /> Feito
            </span>
          )}
        </header>
        <ul className="bars">
          {groups.map((group, index) => {
            const plan = planned?.byExercise?.[group.exercise.id]
            return (
              <li key={`${group.exercise.id}-${index}`} className="bars__row" style={{ '--i': index }}>
                <div className="bars__label">
                  <strong>{group.exercise.name}</strong>
                  <span className="num">
                    {group.blocks
                      .map((b) => `${b.sets} × ${b.reps} · ${formatNumber(b.weightKg)} kg`)
                      .join(' + ')}
                  </span>
                </div>
                <span className="bars__value num">{formatNumber(group.volume)} kg</span>
                <div className={plan !== undefined ? 'bars__track bars__track--pair' : 'bars__track'}>
                  {plan !== undefined && (
                    <span className="bars__plan" style={{ '--w': `${(plan / maxBar) * 100}%` }} />
                  )}
                  <span className="bars__fill" style={{ '--w': `${(group.volume / maxBar) * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn--primary" onClick={onClose}>
        Concluir
      </button>
      {!justFinished && (
        <button className="btn btn--danger" onClick={remove} disabled={busy}>
          <Trash size={18} />
          Apagar este treino
        </button>
      )}
    </>
  )
}
