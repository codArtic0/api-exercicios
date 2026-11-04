import { Clipboard, Dumbbell, Target } from './Icons.jsx'

const TABS = [
  { id: 'today', label: 'Hoje', Icon: Target },
  { id: 'workouts', label: 'Treinos', Icon: Clipboard },
  { id: 'exercises', label: 'Exercícios', Icon: Dumbbell },
]

// Dock flutuante. A pílula atrás da aba ativa desliza de uma aba para a outra.
export default function BottomNav({ tab, onChange }) {
  const index = Math.max(0, TABS.findIndex((t) => t.id === tab))

  return (
    <nav className="dock" aria-label="Seções">
      <div className="dock__inner" style={{ '--idx': index }}>
        <span className="dock__pill" aria-hidden="true" />
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className="dock__tab"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
