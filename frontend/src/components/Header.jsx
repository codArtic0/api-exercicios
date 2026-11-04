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
          <div className="wordmark">
            <Bolt size={18} />
            <span>IRONLOG</span>
          </div>
        )}
        {title && <p className="topbar__title micro">{title}</p>}
        <button className="icon-btn" onClick={onLogout} aria-label="Sair">
          <LogOut />
        </button>
      </div>
    </header>
  )
}
