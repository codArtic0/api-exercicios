import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { DEFAULT_ICON, GROUP_ICONS } from '../lib/groups.js'
import { useDebounced } from '../lib/useDebounced.js'
import { Close, Plus, Search } from './Icons.jsx'

// Tela cheia para escolher um exercício (busca + grupo). Os que já estão no treino ficam desativados.
export default function ExercisePicker({ groups, excludeIds, onPick, onClose }) {
  const [group, setGroup] = useState(null)
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim(), 250)

  const key = `${group ?? ''}|${q}`
  const [result, setResult] = useState({ key: null, items: [], error: '' })

  useEffect(() => {
    let cancelled = false
    api
      .listExercises({ group, q })
      .then((items) => !cancelled && setResult({ key, items, error: '' }))
      .catch((err) => !cancelled && setResult({ key, items: [], error: describeError(err) }))
    return () => {
      cancelled = true
    }
  }, [group, q, key])

  const loading = result.key !== key

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Adicionar exercício">
      <div className="sheet__bar">
        <h2 className="sheet__title">Adicionar exercício</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Close />
        </button>
      </div>

      <div className="sheet__body">
        <label className="search">
          <Search />
          <input
            type="search"
            placeholder="Buscar exercício"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar exercício"
            autoFocus
          />
        </label>

        <div className="chips" role="group" aria-label="Grupo muscular">
          {groups.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              className="chip"
              aria-pressed={group === name}
              onClick={() => setGroup(group === name ? null : name)}
            >
              {name}
            </button>
          ))}
        </div>

        {result.error && (
          <p className="alert" role="alert">
            {result.error}
          </p>
        )}

        {loading ? (
          <ul className="list" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="pick pick--skeleton" />
            ))}
          </ul>
        ) : (
          <ul className="list">
            {result.items.map((ex) => {
              const Icon = GROUP_ICONS[ex.primaryGroup.name] ?? DEFAULT_ICON
              const already = excludeIds.includes(ex.id)
              return (
                <li key={ex.id}>
                  <button type="button" className="pick" disabled={already} onClick={() => onPick(ex)}>
                    <span className="card__icon">
                      <Icon size={22} />
                    </span>
                    <span className="card__body">
                      <strong>{ex.name}</strong>
                      <small>{already ? 'Já está no treino' : ex.primaryGroup.name}</small>
                    </span>
                    {!already && <Plus size={20} />}
                  </button>
                </li>
              )
            })}
            {result.items.length === 0 && !result.error && (
              <li className="empty">
                <p>Nenhum exercício encontrado.</p>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
