import { useState } from 'react'
import { api, describeError, tokenStorage } from '../lib/api.js'
import { Barbell, Bolt, Dumbbell, Kettlebell, Plate } from './Icons.jsx'

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
        <div className="auth__deco" aria-hidden="true">
          <Plate size={140} className="deco deco--plate" />
          <Dumbbell size={72} className="deco deco--dumbbell" />
          <Kettlebell size={64} className="deco deco--kettle" />
          <Barbell size={90} className="deco deco--barbell" />
        </div>
        <div className="brand brand--lg">
          <Bolt size={30} />
          <span>IRONLOG</span>
        </div>
        <h1 className="auth__title">
          Cada série <em>conta.</em>
        </h1>
        <p className="auth__lead">Registre peso, repetições e séries e veja sua carga evoluir.</p>
      </section>

      <section className="auth__card" aria-labelledby="auth-heading">
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
