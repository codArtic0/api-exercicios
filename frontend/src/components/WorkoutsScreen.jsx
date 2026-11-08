import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { formatLongDate, formatNumber } from '../lib/stats.js'
import { suggestWorkoutName } from '../lib/workout.js'
import { workoutBadge } from '../lib/week.js'
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
      <header className="greet">
        <p className="micro">Modelos</p>
        <div className="sec sec--title">
          <h1 className="title-xl">Treinos</h1>
          <button className="btn btn--sm btn--outline" onClick={() => onNew(suggestWorkoutName(workouts))}>
            <Plus size={16} />
            Novo
          </button>
        </div>
      </header>

      {!loaded && (
        <ul className="list" aria-hidden="true">
          {[0, 1].map((i) => (
            <li key={i} className="panel panel--skeleton" />
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
          <Clipboard size={36} />
          <p>Você ainda não criou nenhum treino.</p>
          <small>Toque em Novo para montar o {suggestWorkoutName(workouts)}.</small>
        </div>
      )}

      {loaded && workouts.length > 0 && (
        <ul className="list">
          {workouts.map((w, index) => (
            <li key={w.id} className="panel workout" style={{ '--i': Math.min(index, 8) }}>
              <div className="workout__head">
                <span className="badge-letter">{workoutBadge(w.name)}</span>
                <div className="workout__id">
                  <strong className="workout__name">{w.name}</strong>
                  <span className="num workout__meta">
                    {w.exerciseCount} ex · {formatNumber(w.plannedVolume)} kg
                  </span>
                </div>
                <button
                  className="icon-btn icon-btn--outline"
                  onClick={() => onEdit(w)}
                  aria-label={`Editar ${w.name}`}
                >
                  <Pencil />
                </button>
              </div>
              <p className="micro workout__list">
                {[...new Set(w.items.map((i) => i.exercise.name))].slice(0, 3).join(' · ')}
                {w.exerciseCount > 3 ? ` · +${w.exerciseCount - 3}` : ''}
              </p>
              <div className="workout__foot">
                <span className="micro">
                  {w.lastSessionAt ? `Último: ${formatLongDate(w.lastSessionAt)}` : 'Ainda não feito'}
                </span>
                <button className="btn btn--primary btn--sm" onClick={() => onRun(w)}>
                  <Play size={16} />
                  Iniciar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loaded && sessions.length > 0 && (
        <section>
          <header className="sec">
            <h2 className="micro">Treinos realizados</h2>
            <span className="micro num">{sessions.length}</span>
          </header>
          <ul className="list">
            {sessions.map((s, index) => {
              const date = new Date(s.finishedAt)
              return (
                <li key={s.id} style={{ '--i': Math.min(index, 8) }}>
                  <button className="row" onClick={() => onOpenSession(s)}>
                    <span className="row__date">
                      <strong>{date.getDate()}</strong>
                      <span className="micro">{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                    </span>
                    <span className="row__main">
                      <strong>{s.workoutName}</strong>
                      <span className="num row__meta">
                        {formatNumber(s.stats.totalVolume)} kg · {s.stats.totalSets} séries
                      </span>
                      <span className="micro">
                        {s.stats.exerciseCount} {s.stats.exerciseCount === 1 ? 'exercício' : 'exercícios'}
                      </span>
                    </span>
                    <ChevronRight />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
