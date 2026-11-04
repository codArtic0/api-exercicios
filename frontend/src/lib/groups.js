import { Barbell, Dumbbell, Kettlebell, Plate } from '../components/Icons.jsx'

// Só decoração: os grupos em si vêm da API (GET /muscle-groups). Grupos novos usam o halter.
export const GROUP_ICONS = {
  Perna: Barbell,
  Quadríceps: Plate,
  Ombro: Dumbbell,
  Bíceps: Dumbbell,
  Costas: Kettlebell,
  Peito: Barbell,
  Tríceps: Kettlebell,
}

export const DEFAULT_ICON = Dumbbell
