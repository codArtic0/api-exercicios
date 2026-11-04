import { Bolt, ChevronLeft, LogOut } from './Icons.jsx'

export default function Header({ onBack, title, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="Voltar">
            <ChevronLeft />
          </button>
        ) : (
          <div className="brand">
            <Bolt size={22} />
            <span>IRONLOG</span>
          </div>
        )}
        {title && <p className="topbar__title">{title}</p>}
        <button className="icon-btn" onClick={onLogout} aria-label="Sair">
          <LogOut />
        </button>
      </div>
    </header>
  )
}
