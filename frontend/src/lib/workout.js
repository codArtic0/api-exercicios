import { DEFAULT_VALUES, parseNumber, toText, validateEntry } from './entry.js'

let counter = 0
const nextKey = () => `item-${++counter}`

const toBlockValues = ({ sets, reps, weightKg }) => ({
  sets: String(sets),
  reps: String(reps),
  weightKg: toText(weightKg),
})

// Um exercício pode ter vários blocos de séries (ex.: 1 × 12 com 20 kg e 3 × 8 com 40 kg).
// "planned" guarda o número do modelo de cada bloco para comparar.
const newBlock = (values, planned = null) => ({ key: nextKey(), values, planned })

// Itens de um modelo salvo (um por bloco, na ordem) -> itens de edição, um por exercício.
export function fromWorkoutItems(apiItems) {
  const items = []
  for (const { exercise, sets, reps, weightKg } of apiItems) {
    const planned = { sets, reps, weightKg }
    const last = items[items.length - 1]
    if (last && last.exerciseId === exercise.id) {
      last.blocks.push(newBlock(toBlockValues(planned), planned))
      last.plannedCount += 1
    } else {
      items.push({
        key: nextKey(),
        exerciseId: exercise.id,
        name: exercise.name,
        groupName: exercise.primaryGroup.name,
        blocks: [newBlock(toBlockValues(planned), planned)],
        plannedCount: 1,
        included: true,
      })
    }
  }
  return items
}

// Exercício escolhido no seletor -> item novo (sem número planejado).
export const fromExercise = (exercise) => ({
  key: nextKey(),
  exerciseId: exercise.id,
  name: exercise.name,
  groupName: exercise.primaryGroup.name,
  blocks: [newBlock({ ...DEFAULT_VALUES })],
  plannedCount: 0,
  included: true,
})

export const MAX_BLOCKS = 6

// Novo bloco começa igual ao último, para só ajustar o que muda (peso ou repetições).
export const addBlock = (item) => ({
  ...item,
  blocks: [...item.blocks, newBlock({ ...item.blocks[item.blocks.length - 1].values })],
})

export const removeBlock = (item, blockKey) => ({
  ...item,
  blocks: item.blocks.length > 1 ? item.blocks.filter((b) => b.key !== blockKey) : item.blocks,
})

export const setBlockValue = (item, blockKey, field, text) => ({
  ...item,
  blocks: item.blocks.map((b) => (b.key === blockKey ? { ...b, values: { ...b.values, [field]: text } } : b)),
})

// Os números do item diferem do que o modelo previa?
export function isChanged(item) {
  if (item.plannedCount === 0) return false
  if (item.blocks.length !== item.plannedCount) return true
  return item.blocks.some(
    (b) =>
      !b.planned ||
      parseNumber(b.values.sets) !== b.planned.sets ||
      parseNumber(b.values.reps) !== b.planned.reps ||
      parseNumber(b.values.weightKg) !== b.planned.weightKg,
  )
}

// Texto do que o modelo previa: "3 × 12 · 60 kg" ou "1 × 12 · 20 kg + 3 × 8 · 40 kg".
export const describePlan = (item, formatNumber) =>
  item.blocks
    .filter((b) => b.planned)
    .map((b) => `${b.planned.sets} × ${b.planned.reps} · ${formatNumber(b.planned.weightKg)} kg`)
    .join(' + ')

// Devolve a mensagem de erro (string) ou a lista pronta para enviar à API (um item por bloco).
export function validateItems(items) {
  const payload = []
  for (const item of items) {
    for (const [index, block] of item.blocks.entries()) {
      const parsed = validateEntry(block.values)
      if (typeof parsed === 'string') {
        const where = item.blocks.length > 1 ? `${item.name} (bloco ${index + 1})` : item.name
        return `${where}: ${parsed}`
      }
      payload.push({ exerciseId: item.exerciseId, ...parsed })
    }
  }
  return payload
}

// Volume ao vivo (peso × repetições × séries). Blocos com número inválido ainda não contam.
export function sumVolume(items) {
  const total = items.reduce(
    (sum, item) =>
      sum +
      item.blocks.reduce((blockSum, block) => {
        const parsed = validateEntry(block.values)
        return typeof parsed === 'string' ? blockSum : blockSum + parsed.sets * parsed.reps * parsed.weightKg
      }, 0),
    0,
  )
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
