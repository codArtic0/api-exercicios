import { useCallback, useEffect, useState } from 'react'
import AddExercise from './components/AddExercise.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import ExerciseDetail from './components/ExerciseDetail.jsx'
import Header from './components/Header.jsx'
import Home from './components/Home.jsx'
import { api, setUnauthorizedHandler, tokenStorage } from './lib/api.js'

export default function App() {
  const [token, setToken] = useState(() => tokenStorage.get())
  const [user, setUser] = useState(null)
  const [groups, setGroups] = useState([])
  const [group, setGroup] = useState(null) // filtro da home, preservado ao voltar do detalhe
  const [exercise, setExercise] = useState(null)
  const [adding, setAdding] = useState(false)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
    setGroups([])
    setGroup(null)
    setExercise(null)
    setAdding(false)
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
    api
      .listGroups()
      .then((list) => !cancelled && setGroups(list))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [exercise, adding])

  // Grupo criado em "Outro? Digite aqui": entra na lista sem recarregar (a API não duplica nomes).
  const addGroup = useCallback(
    (created) =>
      setGroups((list) =>
        list.some((g) => g.id === created.id)
          ? list
          : [...list, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      ),
    [],
  )

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
        ) : adding ? (
          <AddExercise
            groups={groups}
            initialGroup={group}
            onGroupCreated={addGroup}
            onClose={() => setAdding(false)}
            onCreated={(created) => {
              setAdding(false)
              setExercise(created)
            }}
          />
        ) : (
          <Home
            user={user}
            groups={groups}
            group={group}
            onGroupChange={setGroup}
            onOpen={setExercise}
            onAdd={() => setAdding(true)}
          />
        )}
      </main>
    </div>
  )
}
