import { DEFAULT_VALUES, parseNumber, toText, validateEntry } from './entry.js'

let counter = 0
const nextKey = () => `item-${++counter}`

// Exercício de um modelo salvo -> item de edição. "planned" guarda o número do modelo para comparar.
export const fromWorkoutItem = ({ exercise, sets, reps, weightKg }) => ({
  key: nextKey(),
  exerciseId: exercise.id,
  name: exercise.name,
  groupName: exercise.primaryGroup.name,
  values: { sets: String(sets), reps: String(reps), weightKg: toText(weightKg) },
  planned: { sets, reps, weightKg },
  included: true,
})

// Exercício escolhido no seletor -> item novo (sem número planejado).
export const fromExercise = (exercise) => ({
  key: nextKey(),
  exerciseId: exercise.id,
  name: exercise.name,
  groupName: exercise.primaryGroup.name,
  values: { ...DEFAULT_VALUES },
  planned: null,
  included: true,
})

// Os números do item diferem do que o modelo previa?
export function isChanged(item) {
  if (!item.planned) return false
  return (
    parseNumber(item.values.sets) !== item.planned.sets ||
    parseNumber(item.values.reps) !== item.planned.reps ||
    parseNumber(item.values.weightKg) !== item.planned.weightKg
  )
}

// Devolve a mensagem de erro (string) ou a lista pronta para enviar à API.
export function validateItems(items) {
  const payload = []
  for (const item of items) {
    const parsed = validateEntry(item.values)
    if (typeof parsed === 'string') return `${item.name}: ${parsed}`
    payload.push({ exerciseId: item.exerciseId, ...parsed })
  }
  return payload
}

// Volume ao vivo (peso × repetições × séries). Itens com número inválido ainda não contam.
export function sumVolume(items) {
  const total = items.reduce((sum, item) => {
    const parsed = validateEntry(item.values)
    return typeof parsed === 'string' ? sum : sum + parsed.sets * parsed.reps * parsed.weightKg
  }, 0)
  return Math.round(total * 10) / 10
}

// Próximo nome livre da sequência: Treino A, Treino B, Treino C...
export function suggestWorkoutName(workouts) {
  const taken = new Set(workouts.map((w) => w.name.trim().toLowerCase()))
  for (let i = 0; i < 26; i += 1) {
    const name = `Treino ${String.fromCharCode(65 + i)}`
    if (!taken.has(name.toLowerCase())) return name
  }
  return ''
}
