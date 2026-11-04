import { useEffect, useState } from 'react'
import { api, describeError } from '../lib/api.js'
import { DEFAULT_ICON, GROUP_ICONS } from '../lib/groups.js'
import { formatNumber } from '../lib/stats.js'
import { useDebounced } from '../lib/useDebounced.js'
import { ChevronRight, Dumbbell, Plus, Search } from './Icons.jsx'

// Biblioteca de exercícios: catálogo padrão mais os do próprio usuário.
export default function Home({ groups, group, onGroupChange, onOpen, onAdd }) {
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
      <header className="greet">
        <p className="micro">Biblioteca</p>
        <div className="sec sec--title">
          <h1 className="title-xl">Exercícios</h1>
          <button className="btn btn--sm btn--outline" onClick={onAdd}>
            <Plus size={16} />
            Novo
          </button>
        </div>
      </header>

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

      <div className="chips" role="group" aria-label="Grupo muscular">
        <button className="chip" aria-pressed={group === null} onClick={() => onGroupChange(null)}>
          Todos
        </button>
        {groups.map(({ id, name }) => (
          <button
            key={id}
            className="chip"
            aria-pressed={group === name}
            onClick={() => onGroupChange(group === name ? null : name)}
          >
            {name}
          </button>
        ))}
      </div>

      <section aria-live="polite" aria-busy={loading}>
        <header className="sec">
          <h2 className="micro">{group ?? 'Todos os grupos'}</h2>
          {!loading && !result.error && <span className="micro num">{result.items.length} exercícios</span>}
        </header>

        {loading && (
          <ul className="list" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="row row--skeleton" />
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
            <Dumbbell size={36} />
            <p>
              Nenhum exercício {group ? `em ${group}` : 'encontrado'}
              {q ? ` para “${q}”` : ''}.
            </p>
            <small>Toque em Novo para adicionar um exercício.</small>
          </div>
        )}

        {!loading && !result.error && result.items.length > 0 && (
          <ul className="list">
            {result.items.map((ex, i) => {
              const Icon = GROUP_ICONS[ex.primaryGroup.name] ?? DEFAULT_ICON
              const groupsLabel = [ex.primaryGroup.name, ...ex.relatedGroups.map((g) => g.name)].join(' · ')
              return (
                <li key={ex.id} style={{ '--i': Math.min(i, 8) }}>
                  <button className="row" onClick={() => onOpen(ex)}>
                    <span className="row__icon">
                      <Icon size={22} />
                    </span>
                    <span className="row__main">
                      <strong>
                        {ex.name}
                        {!ex.isCatalog && <span className="tag">Meu</span>}
                      </strong>
                      <span className={ex.lastEntry ? 'num row__meta' : 'num row__meta row__meta--none'}>
                        {ex.lastEntry
                          ? `${formatNumber(ex.lastEntry.weightKg)} kg · ${ex.lastEntry.sets}×${ex.lastEntry.reps}`
                          : 'Sem registros'}
                      </span>
                      <span className="micro">{groupsLabel}</span>
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
