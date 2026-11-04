import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { formatLongDate, formatNumber } from '../lib/stats.js'
import { suggestWorkoutName } from '../lib/workout.js'
import { ChevronRight, Clipboard, Pencil, Play, Plus } from './Icons.jsx'

export default function WorkoutsScreen({ onNew, onEdit, onRun, onOpenSession }) {
  // Carrega ao entrar na aba: ao voltar de um treino finalizado a lista já vem atualizada.
  const [state, setState] = useState({ loaded: false, workouts: [], sessions: [], error: '' })

  useEffect(() => {
    let cancelled = false
    Promise.all([api.listWorkouts(), api.listSessions(10)])
      .then(([workouts, sessions]) => !cancelled && setState({ loaded: true, workouts, sessions, error: '' }))
      .catch((err) =>
        !cancelled && setState({ loaded: true, workouts: [], sessions: [], error: describeError(err) }),
      )
    return () => {
      cancelled = true
    }
  }, [])

  const { loaded, workouts, sessions, error } = state

  return (
    <>
      <section className="hero">
        <p className="hero__hello">Seus modelos de treino</p>
        <h1 className="hero__title">Qual treino hoje?</h1>
      </section>

      {!loaded && (
        <ul className="list" aria-hidden="true">
          {[0, 1].map((i) => (
            <li key={i} className="card card--skeleton" />
          ))}
        </ul>
      )}

      {loaded && error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {loaded && !error && workouts.length === 0 && (
        <div className="empty">
          <Clipboard size={40} />
          <p>Você ainda não criou nenhum treino.</p>
          <small>Toque no + para montar o {suggestWorkoutName(workouts)}.</small>
        </div>
      )}

      {loaded && workouts.length > 0 && (
        <ul className="list">
          {workouts.map((w, index) => {
            const names = w.items.map((i) => i.exercise.name)
            return (
              <li key={w.id} className="workout" style={{ '--i': Math.min(index, 8) }}>
                <div className="workout__head">
                  <div>
                    <strong className="workout__name">{w.name}</strong>
                    <small className="workout__meta">
                      {w.items.length} {w.items.length === 1 ? 'exercício' : 'exercícios'}
                      {w.lastSessionAt ? ` · último: ${formatLongDate(w.lastSessionAt)}` : ' · ainda não feito'}
                    </small>
                  </div>
                  <button
                    className="icon-btn icon-btn--outline"
                    onClick={() => onEdit(w)}
                    aria-label={`Editar ${w.name}`}
                  >
                    <Pencil />
                  </button>
                </div>
                <p className="workout__list">
                  {names.slice(0, 3).join(' · ')}
                  {names.length > 3 ? ` · +${names.length - 3}` : ''}
                </p>
                <button className="btn btn--primary btn--icon" onClick={() => onRun(w)}>
                  <Play size={20} />
                  Iniciar treino
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {loaded && sessions.length > 0 && (
        <section>
          <h2 className="section-title">
            Treinos realizados
            <span className="count">{sessions.length}</span>
          </h2>
          <ul className="list">
            {sessions.map((s, index) => (
              <li key={s.id} style={{ '--i': Math.min(index, 8) }}>
                <button className="card" onClick={() => onOpenSession(s)}>
                  <span className="card__body">
                    <strong>{s.workoutName}</strong>
                    <span className="card__last">
                      {formatNumber(s.stats.totalVolume)} kg · {s.stats.totalSets} séries
                    </span>
                    <small>
                      {formatLongDate(s.finishedAt)} · {s.stats.exerciseCount}{' '}
                      {s.stats.exerciseCount === 1 ? 'exercício' : 'exercícios'}
                    </small>
                  </span>
                  <ChevronRight />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="fab" onClick={() => onNew(suggestWorkoutName(workouts))} aria-label="Novo treino">
        <Plus size={30} />
      </button>
    </>
  )
}
