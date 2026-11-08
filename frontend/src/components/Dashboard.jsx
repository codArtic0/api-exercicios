import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { formatLongDate, formatNumber } from '../lib/stats.js'
import { decorateDays, workoutBadge } from '../lib/week.js'
import { ChevronRight, Play, Plus } from './Icons.jsx'
import WeekChart from './WeekChart.jsx'

// Aba inicial: o que treinar agora, como foi a semana e o último treino.
export default function Dashboard({ user, onRun, onNewWorkout, onOpenSession }) {
  const [state, setState] = useState({ loaded: false, data: null, error: '' })

  useEffect(() => {
    let cancelled = false
    api
      .dashboard()
      .then((data) => !cancelled && setState({ loaded: true, data, error: '' }))
      .catch((err) => !cancelled && setState({ loaded: true, data: null, error: describeError(err) }))
    return () => {
      cancelled = true
    }
  }, [])

  const { loaded, data, error } = state
  const today = new Date()
  const next = data?.nextWorkout ?? null
  const totals = data?.week.totals
  const last = data?.lastSession

  return (
    <>
      <header className="greet">
        <p className="micro">
          {today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).replace('.', '')}
        </p>
        <h1 className="title-xl">Bora{user ? `, ${user.name.split(' ')[0]}` : ''}.</h1>
      </header>

      {!loaded && <div className="panel panel--skeleton" aria-hidden="true" />}

      {loaded && error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {loaded && !error && next && (
        <section className="panel hud next" aria-label="Próximo treino">
          <p className="micro">Próximo treino</p>
          <div className="next__head">
            <span className="badge-letter">{workoutBadge(next.name)}</span>
            <div>
              <h2 className="next__name">{next.name}</h2>
              <p className="num next__meta">
                {next.exerciseCount} ex · {next.plannedSets} séries · {formatNumber(next.plannedVolume)} kg
              </p>
            </div>
          </div>
          <ul className="next__list">
            {next.items.slice(0, 3).map((i) => (
              <li key={i.id}>
                <span>{i.exercise.name}</span>
                <span className="num">
                  {i.sets}×{i.reps}
                </span>
              </li>
            ))}
            {next.items.length > 3 && <li className="next__more micro">+{next.items.length - 3} séries</li>}
          </ul>
          <button className="btn btn--primary" onClick={() => onRun(next)}>
            <Play size={18} />
            Iniciar treino
          </button>
        </section>
      )}

      {loaded && !error && !next && (
        <section className="panel hud next next--empty">
          <p className="micro">Primeiro passo</p>
          <h2 className="next__name">Monte seu primeiro treino</h2>
          <p className="muted">Escolha os exercícios e os números de partida. No dia, você ajusta o que fez.</p>
          <button className="btn btn--primary" onClick={onNewWorkout}>
            <Plus size={18} />
            Criar treino
          </button>
        </section>
      )}

      {loaded && !error && data && (
        <>
          <section className="kpis" aria-label="Últimos 7 dias">
            <div className="kpi">
              <span className="micro">Treinos</span>
              <strong className="kpi__value">{totals.workouts}</strong>
              <span className="micro">7 dias</span>
            </div>
            <div className="kpi">
              <span className="micro">Volume</span>
              <strong className="kpi__value">{formatNumber(totals.volume)}</strong>
              <span className="micro">kg</span>
            </div>
            <div className="kpi">
              <span className="micro">Séries</span>
              <strong className="kpi__value">{totals.sets}</strong>
              <span className="micro">7 dias</span>
            </div>
          </section>

          <section className="panel">
            <header className="sec">
              <h2 className="micro">Volume por dia</h2>
              <span className="micro">Últimos 7 dias</span>
            </header>
            <WeekChart days={decorateDays(data.week.days)} />
          </section>

          {last && (
            <section>
              <header className="sec">
                <h2 className="micro">Último treino</h2>
              </header>
              <button className="row" onClick={() => onOpenSession(last)}>
                <span className="row__date">
                  <strong>{new Date(last.finishedAt).getDate()}</strong>
                  <span className="micro">
                    {new Date(last.finishedAt).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                </span>
                <span className="row__main">
                  <strong>{last.workoutName}</strong>
                  <span className="num row__meta">
                    {formatNumber(last.stats.totalVolume)} kg · {last.stats.totalSets} séries
                  </span>
                  <span className="micro">{formatLongDate(last.finishedAt)}</span>
                </span>
                <ChevronRight />
              </button>
            </section>
          )}
        </>
      )}
    </>
  )
}
