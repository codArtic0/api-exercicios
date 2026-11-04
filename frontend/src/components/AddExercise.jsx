import { useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { DEFAULT_VALUES, validateEntry } from '../lib/entry.js'
import GroupPicker from './GroupPicker.jsx'
import { Check, ChevronLeft, ChevronRight } from './Icons.jsx'
import Steppers from './Steppers.jsx'

const TOTAL_STEPS = 3

export default function AddExercise({ groups, initialGroup, onGroupCreated, onClose, onCreated }) {
  const [step, setStep] = useState(1)
  const [primaryId, setPrimaryId] = useState(() => groups.find((g) => g.name === initialGroup)?.id ?? null)
  const [relatedIds, setRelatedIds] = useState([])
  const [name, setName] = useState('')
  const [withSeries, setWithSeries] = useState(true)
  const [series, setSeries] = useState(DEFAULT_VALUES)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null) // exercício criado cuja primeira série falhou

  const primary = groups.find((g) => g.id === primaryId)
  const relatedOptions = groups.filter((g) => g.id !== primaryId)

  const goBack = () => {
    setError('')
    if (step === 1) onClose()
    else setStep(step - 1)
  }

  const goNext = () => {
    if (step === 1 && !primaryId) {
      setError('Escolha o grupo muscular dominante.')
      return
    }
    setError('')
    setStep(step + 1)
  }

  const choosePrimary = (id) => {
    setPrimaryId(id)
    setRelatedIds((ids) => ids.filter((x) => x !== id))
    setError('')
  }

  const toggleRelated = (id) =>
    setRelatedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  // "Outro? Digite aqui": cria (ou reaproveita) o grupo e já o seleciona.
  async function createGroup(groupName, onDone) {
    const group = await api.createGroup({ name: groupName })
    onGroupCreated(group)
    onDone(group.id)
  }

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Informe o nome do exercício.')
      return
    }
    let entry = null
    if (withSeries) {
      const parsed = validateEntry(series)
      if (typeof parsed === 'string') {
        setError(parsed)
        return
      }
      entry = parsed
    }

    setError('')
    setBusy(true)

    let exercise
    try {
      exercise = await api.createExercise({
        name: name.trim(),
        primaryGroupId: primaryId,
        relatedGroupIds: relatedIds,
      })
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
      return
    }

    if (entry) {
      try {
        await api.createEntry(exercise.id, entry)
      } catch (err) {
        setPending(exercise)
        setError(`O exercício foi criado, mas a série não foi registrada. ${describeError(err)}`)
        setBusy(false)
        return
      }
    }
    onCreated(exercise)
  }

  return (
    <section className="wizard">
      <div className="wizard__top">
        <button className="back" onClick={goBack} type="button">
          <ChevronLeft size={20} />
          Voltar
        </button>
        <div className="steps" role="img" aria-label={`Passo ${step} de ${TOTAL_STEPS}`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= step ? 'steps__bar steps__bar--on' : 'steps__bar'} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <>
          <h1 className="wizard__title">Qual grupamento muscular dominante?</h1>
          <GroupPicker
            label="Grupamento muscular dominante"
            groups={groups}
            selected={primaryId ? [primaryId] : []}
            onToggle={choosePrimary}
            onCreate={(n) => createGroup(n, choosePrimary)}
          />
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="wizard__title">Selecione mais grupos relacionados:</h1>
          <p className="wizard__hint">Opcional. Dominante: {primary?.name}.</p>
          <GroupPicker
            multiple
            label="Grupos musculares relacionados"
            groups={relatedOptions}
            selected={relatedIds}
            onToggle={toggleRelated}
            onCreate={(n) => createGroup(n, (id) => setRelatedIds((ids) => [...new Set([...ids, id])]))}
          />
        </>
      )}

      {step === 3 && (
        <form className="wizard__form" onSubmit={submit} noValidate>
          <h1 className="wizard__title">Adicione o exercício:</h1>

          <label className="field">
            <span>Nome do exercício</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoComplete="off"
              autoFocus
              disabled={!!pending}
            />
          </label>

          <label className="switch">
            <input
              type="checkbox"
              checked={withSeries}
              onChange={(e) => setWithSeries(e.target.checked)}
              disabled={!!pending}
            />
            <span>Registrar a primeira série agora</span>
          </label>

          {withSeries && <Steppers idPrefix="new" values={series} onChange={(k, v) => setSeries((s) => ({ ...s, [k]: v }))} />}

          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}

          {pending ? (
            <button type="button" className="btn btn--accent" onClick={() => onCreated(pending)}>
              Abrir exercício
            </button>
          ) : (
            <button className="btn btn--accent btn--icon" disabled={busy}>
              <Check size={22} />
              {busy ? 'Salvando…' : 'Adicionar exercício'}
            </button>
          )}
        </form>
      )}

      {step < TOTAL_STEPS && (
        <>
          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn--primary btn--icon" type="button" onClick={goNext}>
            Continuar
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </section>
  )
}
