import { formatNumber } from '../lib/stats.js'
import { MAX_REPS, bestOneRepMax, lastOneRepMaxChange, loadTable } from '../lib/oneRepMax.js'
import { ArrowDown, ArrowUp } from './Icons.jsx'

// 1RM estimado do exercício, recalculado a cada série registrada, e as cargas de treino
// sugeridas a partir dele.
export default function OneRepMax({ entries }) {
  const best = bestOneRepMax(entries)
  const change = lastOneRepMaxChange(entries)

  return (
    <section className="panel orm">
      <header className="sec">
        <h2 className="micro">1RM estimado</h2>
        <span className="micro">Fórmula de Epley</span>
      </header>

      {best === null ? (
        <p className="orm__empty">
          Registre uma série de até {MAX_REPS} repetições para estimar a sua carga máxima.
        </p>
      ) : (
        <>
          <div className="orm__main">
            <strong className="orm__value num">
              {formatNumber(best)}
              <small> kg</small>
            </strong>
            {change !== null && change !== 0 && (
              <span className={change > 0 ? 'orm__delta orm__delta--up' : 'orm__delta orm__delta--down'}>
                {change > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                <span className="num">
                  {change > 0 ? '+' : ''}
                  {formatNumber(change)} kg no último registro
                </span>
              </span>
            )}
          </div>

          <ul className="orm__table" aria-label="Cargas sugeridas a partir do 1RM">
            {loadTable(best).map((row) => (
              <li key={row.pct}>
                <span className="micro num">{row.pct}%</span>
                <strong className="num">{formatNumber(row.weightKg)} kg</strong>
                <span className="micro num">~{row.reps} reps</span>
              </li>
            ))}
          </ul>
          <p className="orm__note micro">
            Estimativa: 1RM = peso × (1 + reps ÷ 30). Ignora séries com mais de {MAX_REPS} repetições.
          </p>
        </>
      )}
    </section>
  )
}
