import { ENTRY_FIELDS, bumpValue } from '../lib/entry.js'
import { Minus, Plus } from './Icons.jsx'

export default function Steppers({ values, onChange, idPrefix = 'f' }) {
  return (
    <div className="steppers">
      {ENTRY_FIELDS.map((field) => (
        <div className="stepper" key={field.key}>
          <label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</label>
          <div className="stepper__row">
            <button
              type="button"
              className="stepper__btn"
              onClick={() => onChange(field.key, bumpValue(field, values[field.key], -1))}
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
              onClick={() => onChange(field.key, bumpValue(field, values[field.key], 1))}
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
