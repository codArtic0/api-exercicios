import { Barbell, Dumbbell, Kettlebell, Plate } from '../components/Icons.jsx'

// Só decoração: os grupos em si vêm da API (GET /muscle-groups). Grupos sem ícone usam o halter.
export const GROUP_ICONS = {
  Perna: Barbell,
  Quadríceps: Plate,
  'Posterior de coxa': Plate,
  Glúteos: Plate,
  Panturrilha: Kettlebell,
  Peito: Barbell,
  Costas: Kettlebell,
  Ombro: Dumbbell,
  Trapézio: Kettlebell,
  Bíceps: Dumbbell,
  Tríceps: Kettlebell,
  Antebraço: Dumbbell,
  Abdômen: Plate,
}

export const DEFAULT_ICON = Dumbbell
