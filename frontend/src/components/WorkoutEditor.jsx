import { useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { DEFAULT_ICON, GROUP_ICONS } from '../lib/groups.js'
import { fromExercise, fromWorkoutItem, validateItems } from '../lib/workout.js'
import ExercisePicker from './ExercisePicker.jsx'
import { ArrowDown, ArrowUp, Check, Plus, Trash } from './Icons.jsx'
import MiniSteppers from './MiniSteppers.jsx'

// Cria ou edita o modelo de um treino (ex.: Treino A). Os números daqui são só o ponto de partida:
// no dia do treino dá para mudar cada um.
export default function WorkoutEditor({ workout, suggestedName, groups, onSaved, onDeleted }) {
  const editing = !!workout
  const [name, setName] = useState(workout?.name ?? suggestedName)
  const [items, setItems] = useState(() => (workout?.items ?? []).map(fromWorkoutItem))
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const setValue = (key, field, text) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, values: { ...i.values, [field]: text } } : i)))

  const remove = (key) => setItems((list) => list.filter((i) => i.key !== key))

  const move = (index, direction) =>
    setItems((list) => {
      const target = index + direction
      if (target < 0 || target >= list.length) return list
      const copy = [...list]
      ;[copy[index], copy[target]] = [copy[target], copy[index]]
      return copy
    })

  async function save(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Dê um nome ao treino.')
      return
    }
    if (items.length === 0) {
      setError('Adicione ao menos um exercício.')
      return
    }
    const payload = validateItems(items)
    if (typeof payload === 'string') {
      setError(payload)
      return
    }

    setError('')
    setBusy(true)
    try {
      const body = { name: name.trim(), items: payload }
      const saved = editing ? await api.updateWorkout(workout.id, body) : await api.createWorkout(body)
      onSaved(saved)
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  async function removeWorkout() {
    if (!window.confirm(`Excluir o ${workout.name}? Os treinos já realizados continuam no histórico.`)) return
    setBusy(true)
    try {
      await api.deleteWorkout(workout.id)
      onDeleted()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <>
    <form className="editor" onSubmit={save} noValidate>
      <h1 className="wizard__title">{editing ? 'Editar treino' : 'Novo treino'}</h1>
      <p className="wizard__hint">
        Os números abaixo são o ponto de partida. No dia do treino você ajusta o que realmente fez.
      </p>

      <label className="field">
        <span>Nome do treino</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="off" />
      </label>

      <ul className="list">
        {items.map((item, index) => {
          const Icon = GROUP_ICONS[item.groupName] ?? DEFAULT_ICON
          return (
            <li key={item.key} className="item" style={{ '--i': Math.min(index, 8) }}>
              <div className="item__head">
                <span className="card__icon">
                  <Icon size={22} />
                </span>
                <span className="card__body">
                  <strong>{item.name}</strong>
                  <small>{item.groupName}</small>
                </span>
                <div className="item__actions">
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Subir ${item.name}`}
                  >
                    <ArrowUp />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={`Descer ${item.name}`}
                  >
                    <ArrowDown />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm icon-btn--danger"
                    onClick={() => remove(item.key)}
                    aria-label={`Remover ${item.name}`}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
              <MiniSteppers
                idPrefix={`e-${item.key}`}
                values={item.values}
                onChange={(field, text) => setValue(item.key, field, text)}
              />
            </li>
          )
        })}
      </ul>

      <button type="button" className="btn btn--ghost btn--icon" onClick={() => setPicking(true)}>
        <Plus size={20} />
        Adicionar exercício
      </button>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn--primary btn--icon" disabled={busy}>
        <Check size={22} />
        {busy ? 'Salvando…' : 'Salvar treino'}
      </button>

      {editing && (
        <button type="button" className="btn btn--danger btn--icon" onClick={removeWorkout} disabled={busy}>
          <Trash size={20} />
          Excluir treino
        </button>
      )}

    </form>

      {/* Fora do <form>: nada de dentro do seletor pode enviar o formulário por engano. */}
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
    </>
  )
}
