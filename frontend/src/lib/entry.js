// Campos de uma série e a validação, espelhando o contrato da API.
export const ENTRY_FIELDS = [
  { key: 'sets', label: 'Séries', step: 1, min: 1, max: 50, mode: 'numeric' },
  { key: 'reps', label: 'Repetições', step: 1, min: 1, max: 200, mode: 'numeric' },
  { key: 'weightKg', label: 'Peso (kg)', step: 2.5, min: 0.5, max: 1000, mode: 'decimal' },
]

export const DEFAULT_VALUES = { sets: '3', reps: '12', weightKg: '20' }

export const parseNumber = (text) => Number(String(text).replace(',', '.'))
export const toText = (n) => String(n).replace('.', ',')

const oneDecimal = (n) => Math.abs(n * 10 - Math.round(n * 10)) < 1e-9

// Devolve a mensagem de erro (string) ou os números já convertidos.
export function validateEntry(values) {
  const sets = parseNumber(values.sets)
  const reps = parseNumber(values.reps)
  const weightKg = parseNumber(values.weightKg)

  if (!Number.isInteger(sets) || sets < 1 || sets > 50) return 'Séries: use um número inteiro de 1 a 50.'
  if (!Number.isInteger(reps) || reps < 1 || reps > 200) return 'Repetições: use um número inteiro de 1 a 200.'
  if (!(weightKg > 0) || weightKg > 1000 || !oneDecimal(weightKg)) {
    return 'Peso: use de 0,1 a 1000 kg, com no máximo uma casa decimal.'
  }
  return { sets, reps, weightKg }
}
