import { useCallback, useEffect, useState } from 'react'
import AddExercise from './components/AddExercise.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import BottomNav from './components/BottomNav.jsx'
import ExerciseDetail from './components/ExerciseDetail.jsx'
import Header from './components/Header.jsx'
import Home from './components/Home.jsx'
import SessionSummary from './components/SessionSummary.jsx'
import WorkoutEditor from './components/WorkoutEditor.jsx'
import WorkoutRunner from './components/WorkoutRunner.jsx'
import WorkoutsScreen from './components/WorkoutsScreen.jsx'
import { api, setUnauthorizedHandler, tokenStorage } from './lib/api.js'

const LIST = { name: 'list' }

export default function App() {
  const [token, setToken] = useState(() => tokenStorage.get())
  const [user, setUser] = useState(null)
  const [groups, setGroups] = useState([])
  const [tab, setTab] = useState('exercises')
  const [group, setGroup] = useState(null) // filtro da home, preservado ao voltar do detalhe
  const [exercise, setExercise] = useState(null)
  const [adding, setAdding] = useState(false)
  const [wView, setWView] = useState(LIST) // tela dentro da aba Treinos

  const logout = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
    setGroups([])
    setGroup(null)
    setExercise(null)
    setAdding(false)
    setTab('exercises')
    setWView(LIST)
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
  }, [exercise, adding, wView, tab])

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

  const inWorkouts = tab === 'workouts'
  const showNav = inWorkouts ? wView.name === 'list' : !exercise && !adding

  let onBack
  let title
  if (!inWorkouts && exercise) {
    onBack = () => setExercise(null)
    title = 'Exercício'
  } else if (inWorkouts && wView.name !== 'list') {
    onBack = () => {
      if (wView.name === 'run' && !window.confirm('Sair sem finalizar? O treino de hoje não será salvo.')) return
      setWView(LIST)
    }
    title = { edit: wView.workout ? 'Editar treino' : 'Novo treino', run: 'Treinando', summary: 'Resultado' }[wView.name]
  }

  let screen
  if (!inWorkouts) {
    screen = exercise ? (
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
    )
  } else if (wView.name === 'edit') {
    screen = (
      <WorkoutEditor
        key={wView.workout?.id ?? 'new'}
        workout={wView.workout}
        suggestedName={wView.suggestedName}
        groups={groups}
        onSaved={() => setWView(LIST)}
        onDeleted={() => setWView(LIST)}
      />
    )
  } else if (wView.name === 'run') {
    screen = (
      <WorkoutRunner
        key={wView.workout.id}
        workout={wView.workout}
        groups={groups}
        onFinished={(session) => setWView({ name: 'summary', session, justFinished: true })}
      />
    )
  } else if (wView.name === 'summary') {
    screen = (
      <SessionSummary
        key={wView.session.id}
        session={wView.session}
        justFinished={wView.justFinished}
        onClose={() => setWView(LIST)}
        onDeleted={() => setWView(LIST)}
      />
    )
  } else {
    screen = (
      <WorkoutsScreen
        onNew={(suggestedName) => setWView({ name: 'edit', workout: null, suggestedName })}
        onEdit={(workout) => setWView({ name: 'edit', workout })}
        onRun={(workout) => setWView({ name: 'run', workout })}
        onOpenSession={(session) => setWView({ name: 'summary', session, justFinished: false })}
      />
    )
  }

  return (
    <div className="app">
      <Header onLogout={logout} onBack={onBack} title={title} />
      <main className={showNav ? 'app__main app__main--nav' : 'app__main'}>{screen}</main>
      {showNav && <BottomNav tab={tab} onChange={setTab} />}
    </div>
  )
}
