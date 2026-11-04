import { useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { formatLongDate, formatNumber } from '../lib/stats.js'
import { ArrowDown, ArrowUp, Clock, Trash, Trophy } from './Icons.jsx'

// Estatísticas de um treino realizado: logo após finalizar ou ao abrir pelo histórico.
export default function SessionSummary({ session, justFinished, onClose, onDeleted }) {
  const { stats } = session
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const maxVolume = Math.max(...session.items.map((i) => i.volume), 1)
  const previous = stats.previous

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
    <section className="summary">
      <div className="summary__head">
        <p className="banner__group">{justFinished ? 'Treino concluído' : formatLongDate(session.finishedAt)}</p>
        <h1 className="wizard__title">{session.workoutName}</h1>
        {session.durationMinutes !== null && (
          <p className="runner__clock">
            <Clock />
            {session.durationMinutes < 1 ? 'menos de 1 min' : `${session.durationMinutes} min`}
          </p>
        )}
      </div>

      <div className="summary__hero">
        <span className="tile__label">Volume total</span>
        <strong className="summary__volume">{formatNumber(stats.totalVolume)}</strong>
        <span className="tile__unit">kg</span>
        {previous && (
          <span className={previous.deltaPct >= 0 ? 'delta delta--up' : 'delta delta--down'}>
            {previous.deltaPct >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {formatNumber(Math.abs(previous.deltaPct))}% vs treino anterior ({formatNumber(previous.totalVolume)} kg)
          </span>
        )}
      </div>

      <div className="tiles tiles--two">
        <div className="tile">
          <span className="tile__label">Séries</span>
          <strong className="tile__value">{stats.totalSets}</strong>
          <span className="tile__unit">no total</span>
        </div>
        <div className="tile">
          <span className="tile__label">Exercícios</span>
          <strong className="tile__value">{stats.exerciseCount}</strong>
          <span className="tile__unit">feitos</span>
        </div>
      </div>

      {stats.bestExercise && (
        <div className="highlights">
          <div className="highlight">
            <Trophy size={20} />
            <span className="tile__label">Melhor exercício</span>
            <strong>{stats.bestExercise.name}</strong>
            <small>{formatNumber(stats.bestExercise.volume)} kg de volume</small>
          </div>
          <div className="highlight">
            <Trophy size={20} />
            <span className="tile__label">Mais pesado</span>
            <strong>{stats.heaviest.name}</strong>
            <small>{formatNumber(stats.heaviest.weightKg)} kg</small>
          </div>
        </div>
      )}

      <div>
        <h2 className="section-title">Exercícios</h2>
        <ul className="bars">
          {session.items.map((item, index) => (
            <li key={item.exercise.id} className="bars__row" style={{ '--i': index }}>
              <div className="bars__label">
                <strong>{item.exercise.name}</strong>
                <span>
                  {item.sets} × {item.reps} · {formatNumber(item.weightKg)} kg
                </span>
              </div>
              <div className="bars__track">
                <span className="bars__fill" style={{ '--w': `${(item.volume / maxVolume) * 100}%` }} />
              </div>
              <span className="bars__value">{formatNumber(item.volume)} kg</span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn--primary" onClick={onClose}>
        Concluir
      </button>
      {!justFinished && (
        <button className="btn btn--danger btn--icon" onClick={remove} disabled={busy}>
          <Trash size={20} />
          Apagar este treino
        </button>
      )}
    </section>
  )
}
