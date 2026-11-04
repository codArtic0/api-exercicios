import { useState } from 'react'
import { describeError } from '../lib/api.js'
import { Plus } from './Icons.jsx'

// Lista de grupos musculares (escolha única ou múltipla) + campo "Outro? Digite aqui".
export default function GroupPicker({ groups, multiple, selected, onToggle, onCreate, label }) {
  const [other, setOther] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function add() {
    const name = other.trim()
    if (!name) return
    setError('')
    setBusy(true)
    try {
      await onCreate(name)
      setOther('')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="picker">
      <div className="options" role={multiple ? 'group' : 'radiogroup'} aria-label={label}>
        {groups.map((g) => (
          <label key={g.id} className="option">
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name="group"
              checked={selected.includes(g.id)}
              onChange={() => onToggle(g.id)}
            />
            <span>{g.name}</span>
          </label>
        ))}
      </div>

      <div className="other">
        <input
          value={other}
          onChange={(e) => setOther(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Outro? Digite aqui"
          aria-label="Outro grupo muscular"
          maxLength={40}
        />
        <button
          type="button"
          className="other__btn"
          onClick={add}
          disabled={busy || !other.trim()}
          aria-label="Adicionar grupo"
        >
          <Plus />
        </button>
      </div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
