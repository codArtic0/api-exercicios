import { Clipboard, Dumbbell } from './Icons.jsx'

const TABS = [
  { id: 'exercises', label: 'Exercícios', Icon: Dumbbell },
  { id: 'workouts', label: 'Treinos', Icon: Clipboard },
]

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Seções">
      <div className="bottom-nav__inner">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className="bottom-nav__tab"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
