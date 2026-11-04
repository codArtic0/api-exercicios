import { useState } from 'react'
import { describeError } from '../lib/api.js'
import { toText, validateEntry } from '../lib/entry.js'
import Steppers from './Steppers.jsx'

export default function EntryForm({ initial, onSubmit }) {
  const [values, setValues] = useState({
    sets: String(initial.sets),
    reps: String(initial.reps),
    weightKg: toText(initial.weightKg),
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const change = (key, text) => {
    setValues((v) => ({ ...v, [key]: text }))
    setSaved(false)
  }

  async function submit(e) {
    e.preventDefault()
    const parsed = validateEntry(values)
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

      <Steppers values={values} onChange={change} />

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
