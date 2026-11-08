import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { formatNumber } from '../lib/stats.js'
import EntryForm from './EntryForm.jsx'
import { Trophy } from './Icons.jsx'
import OneRepMax from './OneRepMax.jsx'
import WeightChart from './WeightChart.jsx'

const DEFAULTS = { sets: 3, reps: 12, weightKg: 20 }

export default function ExerciseDetail({ exercise }) {
  const [state, setState] = useState({ id: null, entries: [], stats: null, error: '' })
  const [metric, setMetric] = useState('weight')

  useEffect(() => {
    let cancelled = false
    Promise.all([api.listEntries(exercise.id), api.exerciseStats(exercise.id)])
      .then(([entries, stats]) => !cancelled && setState({ id: exercise.id, entries, stats, error: '' }))
      .catch((err) => !cancelled && setState({ id: exercise.id, entries: [], stats: null, error: describeError(err) }))
    return () => {
      cancelled = true
    }
  }, [exercise.id])

  const loading = state.id !== exercise.id
  const { entries, stats } = state
  const hasEntries = stats?.entryCount > 0
  const last = entries.at(-1)
  // Séries com muitas repetições não têm 1RM estimado: ficam fora do gráfico dessa métrica.
  const chartEntries = metric === 'oneRm' ? entries.filter((e) => e.oneRepMax !== null) : entries

  async function register(values) {
    await api.createEntry(exercise.id, values)
    // Recordes, 1RM e ordem do histórico são calculados pela API: recarrega depois de registrar.
    const [entries, nextStats] = await Promise.all([api.listEntries(exercise.id), api.exerciseStats(exercise.id)])
    setState((s) => ({ ...s, entries, stats: nextStats }))
  }

  return (
    <>
      <header className="greet">
        <p className="micro">
          {[exercise.primaryGroup.name, ...(exercise.relatedGroups ?? []).map((g) => g.name)].join(' · ')}
        </p>
        <h1 className="title-xl">{exercise.name}</h1>
      </header>

      {loading ? (
        <div className="panel panel--skeleton" aria-hidden="true" />
      ) : state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : (
        <>
          <section className="kpis" aria-label="Seus recordes">
            <div className="kpi">
              <span className="micro">Peso máx</span>
              <strong className="kpi__value">{hasEntries ? formatNumber(stats.maxWeight) : '—'}</strong>
              <span className="micro">kg</span>
            </div>
            <div className="kpi">
              <span className="micro">Reps máx</span>
              <strong className="kpi__value">{hasEntries ? stats.maxReps : '—'}</strong>
              <span className="micro">reps</span>
            </div>
            <div className="kpi">
              <span className="micro">Volume máx</span>
              <strong className="kpi__value">{hasEntries ? formatNumber(stats.maxVolume) : '—'}</strong>
              <span className="micro">kg</span>
            </div>
          </section>

          <section className="panel">
            <header className="sec">
              <h2 className="micro">Evolução</h2>
              <div className="segmented" role="radiogroup" aria-label="Métrica do gráfico">
                {[
                  ['weight', 'Carga'],
                  ['volume', 'Volume'],
                  ['oneRm', '1RM'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={metric === value}
                    className="segmented__btn"
                    onClick={() => setMetric(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </header>
            <WeightChart key={metric} entries={chartEntries} metric={metric} />
          </section>

          <OneRepMax oneRepMax={stats.oneRepMax} repLimit={stats.oneRepMaxRepLimit} />

          <EntryForm
            initial={last ? { sets: last.sets, reps: last.reps, weightKg: last.weightKg } : DEFAULTS}
            onSubmit={register}
          />

          <section>
            <header className="sec">
              <h2 className="micro">Histórico</h2>
              <span className="micro num">{entries.length} registros</span>
            </header>
            {entries.length === 0 ? (
              <div className="empty">
                <p>Nenhuma série registrada ainda.</p>
                <small>Registre a primeira acima.</small>
              </div>
            ) : (
              <ul className="list">
                {[...entries].reverse().map((e, i) => {
                  const date = new Date(e.performedAt)
                  return (
                    <li key={e.id} className="row row--static" style={{ '--i': Math.min(i, 8) }}>
                      <span className="row__date">
                        <strong>{date.getDate()}</strong>
                        <span className="micro">
                          {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                        </span>
                      </span>
                      <span className="row__main">
                        <strong className="num">
                          {e.sets} × {e.reps} · {formatNumber(e.weightKg)} kg
                        </strong>
                        <span className="micro">
                          {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {e.oneRepMax !== null && ` · 1RM ~${formatNumber(e.oneRepMax)} kg`}
                        </span>
                      </span>
                      <span className="row__end">
                        {e.weightKg === stats.maxWeight && (
                          <span className="tag tag--solid">
                            <Trophy size={12} />
                            PR
                          </span>
                        )}
                        <span className="num">{formatNumber(e.volume)} kg</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}
