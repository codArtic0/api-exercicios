import { useCallback, useEffect, useState } from 'react'
import AuthScreen from './components/AuthScreen.jsx'
import ExerciseDetail from './components/ExerciseDetail.jsx'
import Header from './components/Header.jsx'
import Home from './components/Home.jsx'
import { api, setUnauthorizedHandler, tokenStorage } from './lib/api.js'

export default function App() {
  const [token, setToken] = useState(() => tokenStorage.get())
  const [user, setUser] = useState(null)
  const [exercise, setExercise] = useState(null)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
    setExercise(null)
  }, [])

  // Qualquer 401 em rota protegida (token expirado) devolve o usuário para o login.
  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    api
      .me()
      .then((me) => !cancelled && setUser(me))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [exercise])

  if (!token) return <AuthScreen onAuthed={setToken} />

  return (
    <div className="app">
      <Header
        onLogout={logout}
        onBack={exercise ? () => setExercise(null) : undefined}
        title={exercise ? 'Exercício' : undefined}
      />
      <main className="app__main">
        {exercise ? (
          <ExerciseDetail exercise={exercise} />
        ) : (
          <Home user={user} onOpen={setExercise} />
        )}
      </main>
    </div>
  )
}
