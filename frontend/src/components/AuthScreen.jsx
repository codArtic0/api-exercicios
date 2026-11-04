import { useState } from 'react'
import { api, describeError, tokenStorage } from '../lib/api.js'
import { Bolt } from './Icons.jsx'

// Os três passos do app, em paralelogramos. O do meio é o que o app faz de diferente.
const FLOW = [
  { label: 'Planejar', hint: 'seus modelos' },
  { label: 'Treinar', hint: 'ajuste no dia', on: true },
  { label: 'Evoluir', hint: 'recordes' },
]

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const switchMode = (next) => {
    setMode(next)
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isRegister) {
        await api.register({ name: form.name, email: form.email, password: form.password })
      }
      const { token } = await api.login({ email: form.email, password: form.password })
      tokenStorage.set(token)
      onAuthed(token)
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <section className="auth__hero">
        <div className="wordmark wordmark--lg">
          <Bolt size={22} />
          <span>IRONLOG</span>
        </div>
        <h1 className="auth__title">
          Cada série
          <br />
          <em>conta.</em>
        </h1>
        <p className="auth__lead">Planeje seus treinos, ajuste no dia e veja a carga evoluir.</p>

        <ol className="flow" aria-label="Como funciona">
          {FLOW.map((step, i) => (
            <li key={step.label} className={step.on ? 'flow__step flow__step--on' : 'flow__step'} style={{ '--i': i }}>
              <span className="flow__label">{step.label}</span>
              <span className="micro">{step.hint}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="auth__sheet" aria-labelledby="auth-heading">
        <div className="tabs" role="tablist" aria-label="Acesso">
          <button
            role="tab"
            type="button"
            aria-selected={!isRegister}
            className="tabs__tab"
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={isRegister}
            className="tabs__tab"
            onClick={() => switchMode('register')}
          >
            Criar conta
          </button>
        </div>

        <h2 id="auth-heading" className="sr-only">
          {isRegister ? 'Criar conta' : 'Entrar'}
        </h2>

        <form onSubmit={submit} className="form" noValidate>
          {isRegister && (
            <label className="field">
              <span>Nome</span>
              <input
                value={form.name}
                onChange={update('name')}
                autoComplete="name"
                required
                maxLength={100}
              />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              inputMode="email"
              required
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={72}
            />
            {isRegister && <small>Mínimo de 8 caracteres.</small>}
          </label>

          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn--primary" disabled={busy}>
            {busy ? 'Aguarde…' : isRegister ? 'Criar conta e entrar' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}
