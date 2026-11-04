const TICKS = 44
const CX = 120
const CY = 118
const R_OUT = 108
const R_IN = 88

// Medidor em meia-lua feito de tracinhos. value de 0 a 100 (acima disso, enche tudo).
// Cada tracinho aceso é um 1/44 do total, e o rótulo mostra o valor real.
export default function Gauge({ value, label, caption }) {
  const filled = Math.round((Math.min(Math.max(value, 0), 100) / 100) * TICKS)

  return (
    <figure className="gauge" role="img" aria-label={`${label}: ${Math.round(value)}%`}>
      <svg viewBox="0 0 240 130" aria-hidden="true">
        {Array.from({ length: TICKS }, (_, i) => {
          const angle = Math.PI + (i / (TICKS - 1)) * Math.PI
          const on = i < filled
          const inner = on ? R_IN - 4 : R_IN
          return (
            <line
              key={i}
              x1={CX + Math.cos(angle) * inner}
              y1={CY + Math.sin(angle) * inner}
              x2={CX + Math.cos(angle) * R_OUT}
              y2={CY + Math.sin(angle) * R_OUT}
              className={on ? 'gauge__tick gauge__tick--on' : 'gauge__tick'}
              style={{ '--i': i }}
            />
          )
        })}
      </svg>
      <figcaption className="gauge__center">
        <strong className="gauge__value">
          {Math.round(value)}
          <span>%</span>
        </strong>
        <span className="micro">{caption}</span>
      </figcaption>
    </figure>
  )
}
