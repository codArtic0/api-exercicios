import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { DEFAULT_ICON, GROUP_ICONS } from '../lib/groups.js'
import {
  byDateAsc,
  computeStats,
  entryVolume,
  formatDateTime,
  formatNumber,
} from '../lib/stats.js'
import EntryForm from './EntryForm.jsx'
import { Trophy } from './Icons.jsx'
import WeightChart from './WeightChart.jsx'

const DEFAULTS = { sets: 3, reps: 12, weightKg: 20 }

export default function ExerciseDetail({ exercise }) {
  const [state, setState] = useState({ id: null, entries: [], error: '' })

  useEffect(() => {
    let cancelled = false
    api
      .listEntries(exercise.id)
      .then((entries) => !cancelled && setState({ id: exercise.id, entries: entries.sort(byDateAsc), error: '' }))
      .catch((err) => !cancelled && setState({ id: exercise.id, entries: [], error: describeError(err) }))
    return () => {
      cancelled = true
    }
  }, [exercise.id])

  const loading = state.id !== exercise.id
  const { entries } = state
  const stats = computeStats(entries)
  const last = entries.at(-1)
  const Icon = GROUP_ICONS[exercise.primaryGroup.name] ?? DEFAULT_ICON

  async function register(values) {
    const created = await api.createEntry(exercise.id, values)
    setState((s) => ({ ...s, entries: [...s.entries, created].sort(byDateAsc) }))
  }

  return (
    <>
      <section className="banner">
        <span className="banner__icon">
          <Icon size={30} />
        </span>
        <div>
          <p className="banner__group">{exercise.primaryGroup.name}</p>
          <h1 className="banner__title">{exercise.name}</h1>
        </div>
      </section>

      {loading ? (
        <div className="tiles" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="tile tile--skeleton" />
          ))}
        </div>
      ) : state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : (
        <>
          <section className="tiles" aria-label="Seus recordes">
            <Tile label="Peso máx." value={stats ? formatNumber(stats.maxWeight) : '—'} unit="kg" />
            <Tile label="Reps máx." value={stats ? stats.maxReps : '—'} unit="reps" />
            <Tile label="Volume máx." value={stats ? formatNumber(stats.maxVolume) : '—'} unit="kg" />
          </section>

          <WeightChart entries={entries} />

          <EntryForm
            initial={last ? { sets: last.sets, reps: last.reps, weightKg: last.weightKg } : DEFAULTS}
            onSubmit={register}
          />

          <section>
            <h2 className="section-title">
              Histórico
              <span className="count">{entries.length}</span>
            </h2>
            {entries.length === 0 ? (
              <div className="empty">
                <p>Nenhuma série registrada ainda.</p>
                <small>Registre a primeira acima.</small>
              </div>
            ) : (
              <ul className="history">
                {[...entries].reverse().map((e) => (
                  <li key={e.id} className="history__item">
                    <div>
                      <strong>
                        {e.sets} × {e.reps} · {formatNumber(e.weightKg)} kg
                      </strong>
                      <small>{formatDateTime(e.performedAt)}</small>
                    </div>
                    <div className="history__right">
                      {stats && e.weightKg === stats.maxWeight && (
                        <span className="badge">
                          <Trophy size={14} />
                          PR
                        </span>
                      )}
                      <span className="history__volume">{formatNumber(entryVolume(e))} kg</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}

function Tile({ label, value, unit }) {
  return (
    <div className="tile">
      <span className="tile__label">{label}</span>
      <strong className="tile__value">{value}</strong>
      <span className="tile__unit">{unit}</span>
    </div>
  )
}
