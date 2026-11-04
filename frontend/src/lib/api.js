const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const TOKEN_KEY = 'ironlog.token'

export class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// localStorage pode falhar (aba privada, dados bloqueados): a app continua funcionando sem ele.
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* sem persistência */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* sem persistência */
    }
  },
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = tokenStorage.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Não consegui falar com a API. Ela está rodando?')
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const error = data?.error
    // 401 em rota protegida = sessão expirada. No login o 401 é só senha errada.
    if (res.status === 401 && auth) onUnauthorized()
    throw new ApiError(
      res.status,
      error?.code ?? 'ERROR',
      error?.message ?? 'Erro inesperado',
      error?.details ?? null,
    )
  }
  return data
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  me: () => request('/auth/me'),
  listGroups: () => request('/muscle-groups'),
  createGroup: (body) => request('/muscle-groups', { method: 'POST', body }),
  createExercise: (body) => request('/exercises', { method: 'POST', body }),
  listExercises: ({ group, q } = {}) => {
    const params = new URLSearchParams()
    if (group) params.set('group', group)
    if (q) params.set('q', q)
    const query = params.toString()
    return request(`/exercises${query ? `?${query}` : ''}`)
  },
  listEntries: (exerciseId) => request(`/exercises/${exerciseId}/entries`),
  createEntry: (exerciseId, body) =>
    request(`/exercises/${exerciseId}/entries`, { method: 'POST', body }),
}

const FIELD_MESSAGES = {
  name: 'Informe seu nome.',
  email: 'Email inválido.',
  password: 'A senha precisa ter de 8 a 72 caracteres.',
  sets: 'Séries: use um número inteiro de 1 a 50.',
  reps: 'Repetições: use um número inteiro de 1 a 200.',
  weightKg: 'Peso: use de 0,1 a 1000 kg, com no máximo uma casa decimal.',
}

// Traduz o erro da API (Zod devolve texto em inglês) para algo que o usuário entenda.
export function describeError(err) {
  if (!(err instanceof ApiError)) return 'Algo deu errado. Tente de novo.'
  if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
    const known = err.details.map((d) => FIELD_MESSAGES[d.path?.at(-1)]).find(Boolean)
    if (known) return known
  }
  return err.message
}
