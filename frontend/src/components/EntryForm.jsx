import { useState } from 'react'
import { describeError } from '../lib/api.js'
import { Minus, Plus } from './Icons.jsx'

const FIELDS = [
  { key: 'sets', label: 'Séries', step: 1, min: 1, max: 50, mode: 'numeric' },
  { key: 'reps', label: 'Repetições', step: 1, min: 1, max: 200, mode: 'numeric' },
  { key: 'weightKg', label: 'Peso (kg)', step: 2.5, min: 0.5, max: 1000, mode: 'decimal' },
]

const parse = (text) => Number(String(text).replace(',', '.'))
const oneDecimal = (n) => Math.abs(n * 10 - Math.round(n * 10)) < 1e-9

// Espelha o contrato da API para avisar antes de enviar.
function validate(values) {
  const sets = parse(values.sets)
  const reps = parse(values.reps)
  const weightKg = parse(values.weightKg)

  if (!Number.isInteger(sets) || sets < 1 || sets > 50) return 'Séries: use um número inteiro de 1 a 50.'
  if (!Number.isInteger(reps) || reps < 1 || reps > 200) return 'Repetições: use um número inteiro de 1 a 200.'
  if (!(weightKg > 0) || weightKg > 1000 || !oneDecimal(weightKg)) {
    return 'Peso: use de 0,1 a 1000 kg, com no máximo uma casa decimal.'
  }
  return { sets, reps, weightKg }
}

export default function EntryForm({ initial, onSubmit }) {
  const [values, setValues] = useState({
    sets: String(initial.sets),
    reps: String(initial.reps),
    weightKg: String(initial.weightKg).replace('.', ','),
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const change = (key, text) => {
    setValues((v) => ({ ...v, [key]: text }))
    setSaved(false)
  }

  const bump = (field, direction) => {
    const current = parse(values[field.key])
    const base = Number.isFinite(current) ? current : 0
    const next = Math.min(field.max, Math.max(field.min, Math.round((base + direction * field.step) * 10) / 10))
    change(field.key, String(next).replace('.', ','))
  }

  async function submit(e) {
    e.preventDefault()
    const parsed = validate(values)
    if (typeof parsed === 'string') {
      setError(parsed)
      return
    }
    setError('')
    setBusy(true)
    try {
      await onSubmit(parsed)
      setSaved(true)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="entry-form" onSubmit={submit} noValidate>
      <h2 className="section-title">Registrar série</h2>

      <div className="steppers">
        {FIELDS.map((field) => (
          <div className="stepper" key={field.key}>
            <label htmlFor={`f-${field.key}`}>{field.label}</label>
            <div className="stepper__row">
              <button
                type="button"
                className="stepper__btn"
                onClick={() => bump(field, -1)}
                aria-label={`Diminuir ${field.label}`}
              >
                <Minus />
              </button>
              <input
                id={`f-${field.key}`}
                value={values[field.key]}
                onChange={(e) => change(field.key, e.target.value)}
                inputMode={field.mode}
                autoComplete="off"
              />
              <button
                type="button"
                className="stepper__btn"
                onClick={() => bump(field, 1)}
                aria-label={`Aumentar ${field.label}`}
              >
                <Plus />
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="success" role="status">
          Série registrada!
        </p>
      )}

      <button className="btn btn--accent" disabled={busy}>
        {busy ? 'Salvando…' : 'Registrar série'}
      </button>
    </form>
  )
}
