import { Barbell, Dumbbell, Kettlebell, Plate } from '../components/Icons.jsx'

// A API ainda não tem GET /muscle-groups: esta lista espelha o seed do backend.
export const GROUPS = [
  { name: 'Perna', Icon: Barbell },
  { name: 'Quadríceps', Icon: Plate },
  { name: 'Ombro', Icon: Dumbbell },
  { name: 'Bíceps', Icon: Dumbbell },
  { name: 'Costas', Icon: Kettlebell },
  { name: 'Peito', Icon: Barbell },
  { name: 'Tríceps', Icon: Kettlebell },
]

export const GROUP_ICONS = Object.fromEntries(GROUPS.map((g) => [g.name, g.Icon]))

export const DEFAULT_ICON = Dumbbell
