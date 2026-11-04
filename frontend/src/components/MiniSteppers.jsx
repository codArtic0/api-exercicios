import { ENTRY_FIELDS, bumpValue } from '../lib/entry.js'
import { Minus, Plus } from './Icons.jsx'

// Séries, repetições e peso lado a lado: cabe várias linhas na tela do celular.
export default function MiniSteppers({ values, onChange, idPrefix, disabled = false }) {
  return (
    <div className="mini">
      {ENTRY_FIELDS.map((field) => (
        <div className="mini__field" key={field.key}>
          <label htmlFor={`${idPrefix}-${field.key}`}>{field.label.replace(' (kg)', '')}</label>
          <div className="mini__row">
            <button
              type="button"
              className="mini__btn"
              disabled={disabled}
              onClick={() => onChange(field.key, bumpValue(field, values[field.key], -1))}
              aria-label={`Diminuir ${field.label}`}
            >
              <Minus size={16} />
            </button>
            <input
              id={`${idPrefix}-${field.key}`}
              value={values[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              inputMode={field.mode}
              autoComplete="off"
              disabled={disabled}
            />
            <button
              type="button"
              className="mini__btn"
              disabled={disabled}
              onClick={() => onChange(field.key, bumpValue(field, values[field.key], 1))}
              aria-label={`Aumentar ${field.label}`}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
