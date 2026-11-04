// Catálogo inicial, compartilhado por todos os usuários.
// Fonte: https://www.hipertrofia.org/blog/exercicios-de-musculacao/ (uma página por grupo muscular).
//
// - Exercício que aparece em mais de uma página entra uma vez só: o grupo da primeira página vira o
//   principal e os outros viram relacionados.
// - A página de pernas não separa por músculo. Os relacionados dela (Quadríceps, Posterior de coxa
//   e Glúteos) são uma classificação nossa.

export const GROUPS = [
  'Perna',
  'Quadríceps',
  'Posterior de coxa',
  'Glúteos',
  'Panturrilha',
  'Peito',
  'Costas',
  'Ombro',
  'Trapézio',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Abdômen',
];

// [nome, grupo principal, grupos relacionados]
export const EXERCISES = [
  // Bíceps
  ['Rosca direta com barra reta ou W', 'Bíceps', ['Antebraço']],
  ['Rosca simultânea', 'Bíceps', []],
  ['Rosca direta na polia', 'Bíceps', []],
  ['Rosca concentrada', 'Bíceps', []],
  ['Rosca inclinada', 'Bíceps', []],
  ['Rosca spider', 'Bíceps', []],
  ['Rosca alternada', 'Bíceps', []],
  ['Barra fixa supinada (chin up)', 'Costas', ['Bíceps']],
  ['Rosca scott', 'Bíceps', []],
  ['Rosca martelo', 'Bíceps', ['Antebraço']],
  ['Rosca arrastada (drag curl)', 'Bíceps', []],
  ['Rosca Zottman', 'Bíceps', ['Antebraço']],

  // Tríceps
  ['Tríceps corda', 'Tríceps', []],
  ['Tríceps francês', 'Tríceps', []],
  ['Tríceps com barra reta ou W', 'Tríceps', []],
  ['Supino fechado', 'Tríceps', []],
  ['Tríceps invertido', 'Tríceps', []],
  ['Paralelas', 'Tríceps', ['Peito']],
  ['Flexão diamante', 'Tríceps', []],
  ['Tríceps banco', 'Tríceps', []],
  ['Tríceps coice', 'Tríceps', []],
  ['Rosca testa', 'Tríceps', []],

  // Peito
  ['Supino inclinado', 'Peito', []],
  ['Supino reto', 'Peito', []],
  ['Supino declinado (canadense)', 'Peito', []],
  ['Crucifixo', 'Peito', []],
  ['Supino máquina', 'Peito', []],
  ['Pullover com halteres', 'Peito', []],
  ['Voador (peck deck)', 'Peito', []],
  ['Flexão de braço', 'Peito', []],

  // Ombro (deltoides)
  ['Desenvolvimento com barra', 'Ombro', []],
  ['Desenvolvimento com halteres', 'Ombro', []],
  ['Desenvolvimento Arnold', 'Ombro', []],
  ['Elevação lateral com halteres', 'Ombro', []],
  ['Elevação lateral na polia', 'Ombro', []],
  ['Elevação frontal com halteres', 'Ombro', []],
  ['Elevação frontal com barra', 'Ombro', []],
  ['Elevação lateral inclinada', 'Ombro', []],
  ['Remada alta com barra', 'Ombro', []],
  ['Remada alta com halteres', 'Ombro', []],
  ['Face pull', 'Ombro', ['Trapézio']],
  ['Voador invertido', 'Ombro', ['Costas']],
  ['Crucifixo invertido com halteres', 'Ombro', []],

  // Trapézio
  ['Encolhimento', 'Trapézio', ['Costas']],
  ['Encolhimento com halteres', 'Trapézio', []],
  ['Encolhimento no smith', 'Trapézio', []],
  ['Encolhimento na máquina articulada', 'Trapézio', []],
  ['Encolhimento na polia baixa', 'Trapézio', []],
  ['Encolhimento com elástico de treino', 'Trapézio', []],
  ['Encolhimento por trás do corpo', 'Trapézio', []],
  ['Encolhimento por trás do corpo no smith', 'Trapézio', []],
  ['Encolhimento por trás do corpo na polia baixa', 'Trapézio', []],
  ['Remada alta', 'Trapézio', []],
  ['Remada em pé com halteres', 'Trapézio', []],
  ['Remada em pé na polia baixa', 'Trapézio', []],
  ['Levantamento terra', 'Trapézio', ['Costas']],
  ['Levantamento terra com halteres', 'Trapézio', []],
  ['Levantamento terra com trap bar (barra hexagonal)', 'Trapézio', []],
  ['Levantamento terra no smith', 'Trapézio', []],
  ['Face pull com elástico', 'Trapézio', []],
  ['Face pull no banco inclinado', 'Trapézio', []],
  ['Face pull na polia alta', 'Trapézio', []],
  ['Elevação em Y', 'Trapézio', []],
  ['Elevação em Y na polia baixa', 'Trapézio', []],
  ['Elevação em Y curvada (sem banco)', 'Trapézio', []],
  ['Depressão escapular na polia alta', 'Trapézio', []],
  ['Depressão escapular com elástico', 'Trapézio', []],
  ['Depressão escapular na polia com pegada neutra (fechada)', 'Trapézio', []],

  // Costas
  ['Barra fixa', 'Costas', []],
  ['Pulley costas', 'Costas', []],
  ['Remada curvada', 'Costas', ['Trapézio']],
  ['Remada serrote', 'Costas', ['Trapézio']],
  ['Pull down', 'Costas', []],
  ['Remada baixa', 'Costas', []],
  ['Remada cavalinho', 'Costas', []],

  // Antebraço
  ['Rosca punho', 'Antebraço', []],
  ['Rosca punho invertida', 'Antebraço', []],
  ['Suspensão na barra (dead hang)', 'Antebraço', []],
  ['Rosca inversa', 'Antebraço', []],
  ['Rolo de punho', 'Antebraço', []],
  ['Rosca punho com halteres', 'Antebraço', []],
  ['Rosca invertida com barra ou halteres', 'Antebraço', []],

  // Abdômen
  ['Abdominal reto (tradicional)', 'Abdômen', []],
  ['Abdominal na polia', 'Abdômen', []],
  ['Abdominal infra paralelas', 'Abdômen', []],
  ['Prancha abdominal', 'Abdômen', []],
  ['Abdominal na máquina', 'Abdômen', []],
  ['Abdominal tesoura', 'Abdômen', []],
  ['Abdominal remador', 'Abdômen', []],
  ['Abdominal infra solo (abdominal inverso)', 'Abdômen', []],
  ['Abdominal cruzado', 'Abdômen', []],
  ['Roda abdominal', 'Abdômen', []],
  ['Abdominal declinado', 'Abdômen', []],
  ['Abdominal lateral', 'Abdômen', []],

  // Pernas
  ['Agachamento livre', 'Perna', ['Quadríceps', 'Glúteos']],
  ['Agachamento frontal', 'Perna', ['Quadríceps']],
  ['Agachamento búlgaro', 'Perna', ['Quadríceps', 'Glúteos']],
  ['Leg press', 'Perna', ['Quadríceps', 'Glúteos']],
  ['Agachamento hack', 'Perna', ['Quadríceps']],
  ['Stiff', 'Perna', ['Posterior de coxa', 'Glúteos']],
  ['Levantamento terra romeno', 'Perna', ['Posterior de coxa', 'Glúteos']],
  ['Agachamento goblet', 'Perna', ['Quadríceps']],
  ['Afundo', 'Perna', ['Quadríceps', 'Glúteos']],
  ['Cadeira extensora', 'Perna', ['Quadríceps']],
  ['Mesa flexora', 'Perna', ['Posterior de coxa']],
  ['Levantamento terra sumô', 'Perna', ['Posterior de coxa', 'Glúteos']],
  ['Flexão nórdica', 'Perna', ['Posterior de coxa']],
  ['Good morning', 'Perna', ['Posterior de coxa', 'Glúteos']],
  ['Agachamento sumô', 'Perna', ['Quadríceps', 'Glúteos']],

  // Panturrilhas
  ['Elevação de panturrilhas em pé na máquina', 'Panturrilha', []],
  ['Elevação de panturrilhas no leg press', 'Panturrilha', []],
  ['Elevação de panturrilhas em pé com o peso do corpo', 'Panturrilha', []],
  ['Elevação de panturrilhas com barra livre', 'Panturrilha', []],
  ['Elevação de panturrilhas sentado na máquina', 'Panturrilha', []],
  ['Elevação de panturrilhas sentado com halteres', 'Panturrilha', []],

  // Glúteos
  ['Elevação pélvica com barra', 'Glúteos', []],
  ['Passada', 'Glúteos', ['Quadríceps']],
  ['Extensão do quadril usando a polia', 'Glúteos', []],
];
