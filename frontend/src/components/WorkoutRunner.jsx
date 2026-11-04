import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { DEFAULT_ICON, GROUP_ICONS } from '../lib/groups.js'
import { formatClock, formatNumber } from '../lib/stats.js'
import { fromExercise, fromWorkoutItem, isChanged, sumVolume, validateItems } from '../lib/workout.js'
import { plannedVolume } from '../lib/week.js'
import ExercisePicker from './ExercisePicker.jsx'
import { Check, Clock, Plus } from './Icons.jsx'
import MiniSteppers from './MiniSteppers.jsx'

// O treino do dia. Começa com os números do modelo, mas cada um pode ser mudado (fez menos
// séries, usou outra carga...). Ao finalizar, tudo é registrado de uma vez. O modelo não muda.
export default function WorkoutRunner({ workout, groups, onFinished }) {
  const [startedAt] = useState(() => new Date())
  const [now, setNow] = useState(() => Date.now())
  const [items, setItems] = useState(() => workout.items.map(fromWorkoutItem))
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const included = items.filter((i) => i.included)
  const volume = sumVolume(included)

  const patch = (key, changes) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...changes } : i)))
  const setValue = (key, field, text) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, values: { ...i.values, [field]: text } } : i)))

  async function finish() {
    if (included.length === 0) {
      setError('Marque ao menos um exercício para finalizar.')
      return
    }
    const payload = validateItems(included)
    if (typeof payload === 'string') {
      setError(payload)
      return
    }

    setError('')
    setBusy(true)
    try {
      const session = await api.finishWorkout(workout.id, { items: payload, startedAt: startedAt.toISOString() })
      // O resumo compara o que foi feito com o que o modelo previa (o modelo não muda).
      onFinished(session, {
        volume: plannedVolume(workout),
        byExercise: Object.fromEntries(workout.items.map((i) => [i.exercise.id, i.sets * i.reps * i.weightKg])),
      })
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <section className="runner">
      <header className="greet runner__head">
        <div>
          <p className="micro">Treino do dia</p>
          <h1 className="title-xl">{workout.name}</h1>
        </div>
        <p className="runner__clock num" aria-label="Tempo de treino">
          <Clock />
          {formatClock((now - startedAt.getTime()) / 1000)}
        </p>
      </header>

      <ul className="list">
        {items.map((item, index) => {
          const Icon = GROUP_ICONS[item.groupName] ?? DEFAULT_ICON
          const changed = isChanged(item)
          return (
            <li
              key={item.key}
              className={item.included ? 'item' : 'item item--off'}
              style={{ '--i': Math.min(index, 8) }}
            >
              <div className="item__head">
                <span className="card__icon">
                  <Icon size={22} />
                </span>
                <span className="card__body">
                  <strong>
                    {item.name}
                    {!item.planned && <span className="tag">Extra</span>}
                    {changed && item.included && <span className="tag tag--warn">Alterado</span>}
                  </strong>
                  <small>
                    {item.planned
                      ? `Modelo: ${item.planned.sets} × ${item.planned.reps} · ${formatNumber(item.planned.weightKg)} kg`
                      : item.groupName}
                  </small>
                </span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={item.included}
                    onChange={(e) => patch(item.key, { included: e.target.checked })}
                  />
                  <span>{item.included ? 'Feito' : 'Pular'}</span>
                </label>
              </div>
              <MiniSteppers
                idPrefix={`r-${item.key}`}
                values={item.values}
                disabled={!item.included}
                onChange={(field, text) => setValue(item.key, field, text)}
              />
            </li>
          )
        })}
      </ul>

      <button type="button" className="btn btn--ghost" onClick={() => setPicking(true)}>
        <Plus size={20} />
        Adicionar exercício extra
      </button>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div className="runner__bar">
        <div className="runner__total">
          <span>Volume</span>
          <strong>{formatNumber(volume)} kg</strong>
        </div>
        <button className="btn btn--primary" onClick={finish} disabled={busy}>
          <Check size={22} />
          {busy ? 'Salvando…' : 'Finalizar treino'}
        </button>
      </div>

      {picking && (
        <ExercisePicker
          groups={groups}
          excludeIds={items.map((i) => i.exerciseId)}
          onClose={() => setPicking(false)}
          onPick={(exercise) => {
            setItems((list) => [...list, fromExercise(exercise)])
            setPicking(false)
          }}
        />
      )}
    </section>
  )
}
