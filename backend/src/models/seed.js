import 'dotenv/config';
import prisma from '../configs/prisma.js';

// Só os grupos musculares são compartilhados. Exercícios são sempre do usuário que os cria.
const groups = ['Perna', 'Quadríceps', 'Ombro', 'Bíceps', 'Costas', 'Peito', 'Tríceps'];

async function main() {
  for (const name of groups) {
    await prisma.muscleGroup.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log(`Seed ok: ${groups.length} grupos musculares.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
