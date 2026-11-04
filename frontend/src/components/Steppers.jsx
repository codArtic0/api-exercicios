import { ENTRY_FIELDS, parseNumber, toText } from '../lib/entry.js'
import { Minus, Plus } from './Icons.jsx'

export default function Steppers({ values, onChange, idPrefix = 'f' }) {
  const bump = (field, direction) => {
    const current = parseNumber(values[field.key])
    const base = Number.isFinite(current) ? current : 0
    const next = Math.min(
      field.max,
      Math.max(field.min, Math.round((base + direction * field.step) * 10) / 10),
    )
    onChange(field.key, toText(next))
  }

  return (
    <div className="steppers">
      {ENTRY_FIELDS.map((field) => (
        <div className="stepper" key={field.key}>
          <label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</label>
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
              id={`${idPrefix}-${field.key}`}
              value={values[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
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
  )
}
