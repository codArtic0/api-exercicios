import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { DEFAULT_ICON, GROUP_ICONS, GROUPS } from '../lib/groups.js'
import { useDebounced } from '../lib/useDebounced.js'
import { ChevronRight, Dumbbell, Search } from './Icons.jsx'

export default function Home({ user, onOpen }) {
  const [group, setGroup] = useState(null)
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
        <button
          className="chip"
          aria-pressed={group === null}
          onClick={() => setGroup(null)}
        >
          <Dumbbell size={18} />
          Todos
        </button>
        {GROUPS.map(({ name, Icon }) => (
          <button
            key={name}
            className="chip"
            aria-pressed={group === name}
            onClick={() => setGroup(group === name ? null : name)}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
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
            <small>Por enquanto, só o catálogo de Perna está cadastrado.</small>
          </div>
        )}

        {!loading && !result.error && result.items.length > 0 && (
          <ul className="list">
            {result.items.map((ex) => {
              const Icon = GROUP_ICONS[ex.primaryGroup.name] ?? DEFAULT_ICON
              return (
                <li key={ex.id}>
                  <button className="card" onClick={() => onOpen(ex)}>
                    <span className="card__icon">
                      <Icon size={26} />
                    </span>
                    <span className="card__body">
                      <strong>{ex.name}</strong>
                      <small>{ex.primaryGroup.name}</small>
                    </span>
                    <ChevronRight />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
