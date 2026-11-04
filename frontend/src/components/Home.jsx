import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { DEFAULT_ICON, GROUP_ICONS } from '../lib/groups.js'
import { formatNumber } from '../lib/stats.js'
import { useDebounced } from '../lib/useDebounced.js'
import { ChevronRight, Dumbbell, Plus, Search } from './Icons.jsx'

export default function Home({ user, groups, group, onGroupChange, onOpen, onAdd }) {
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim(), 300)

  // O resultado carrega a chave da busca que o gerou: enquanto a chave não bate, está carregando.
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
    <>
      <section className="hero">
        <p className="hero__hello">Bora treinar{user ? `, ${user.name.split(' ')[0]}` : ''}?</p>
        <h1 className="hero__title">Escolha o grupo muscular</h1>
      </section>

      <div className="chips" role="group" aria-label="Grupo muscular">
        <button className="chip" aria-pressed={group === null} onClick={() => onGroupChange(null)}>
          <Dumbbell size={18} />
          Todos
        </button>
        {groups.map(({ id, name }) => {
          const Icon = GROUP_ICONS[name] ?? DEFAULT_ICON
          return (
            <button
              key={id}
              className="chip"
              aria-pressed={group === name}
              onClick={() => onGroupChange(group === name ? null : name)}
            >
              <Icon size={18} />
              {name}
            </button>
          )
        })}
      </div>

      <label className="search">
        <Search />
        <input
          type="search"
          placeholder="Buscar exercício"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar exercício"
        />
      </label>

      <section aria-live="polite" aria-busy={loading}>
        <h2 className="section-title">
          {group ?? 'Todos os exercícios'}
          {!loading && !result.error && <span className="count">{result.items.length}</span>}
        </h2>

        {loading && (
          <ul className="list" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="card card--skeleton" />
            ))}
          </ul>
        )}

        {!loading && result.error && (
          <p className="alert" role="alert">
            {result.error}
          </p>
        )}

        {!loading && !result.error && result.items.length === 0 && (
          <div className="empty">
            <Dumbbell size={40} />
            <p>
              Nenhum exercício {group ? `em ${group}` : 'encontrado'}
              {q ? ` para “${q}”` : ''}.
            </p>
            <small>Toque no + para adicionar um exercício.</small>
          </div>
        )}

        {!loading && !result.error && result.items.length > 0 && (
          <ul className="list">
            {result.items.map((ex, i) => {
              const Icon = GROUP_ICONS[ex.primaryGroup.name] ?? DEFAULT_ICON
              const groupsLabel = [ex.primaryGroup.name, ...ex.relatedGroups.map((g) => g.name)].join(' · ')
              return (
                <li key={ex.id} style={{ '--i': Math.min(i, 8) }}>
                  <button className="card" onClick={() => onOpen(ex)}>
                    <span className="card__icon">
                      <Icon size={26} />
                    </span>
                    <span className="card__body">
                      <strong>{ex.name}</strong>
                      <span className="card__last">
                        {ex.lastEntry
                          ? `${formatNumber(ex.lastEntry.weightKg)} kg · ${ex.lastEntry.sets} séries de ${ex.lastEntry.reps} repetições`
                          : 'Sem registros ainda'}
                      </span>
                      <small>{groupsLabel}</small>
                    </span>
                    <ChevronRight />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <button className="fab" onClick={() => onAdd(group)} aria-label="Adicionar exercício">
        <Plus size={30} />
      </button>
    </>
  )
}
