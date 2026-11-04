import 'dotenv/config';
import prisma from '../configs/prisma.js';

const groups = ['Perna', 'Quadríceps', 'Ombro', 'Bíceps', 'Costas', 'Peito', 'Tríceps'];

const catalog = [
  { name: 'Cadeira extensora', primary: 'Perna', related: ['Quadríceps'] },
  { name: 'Agachamento Hack', primary: 'Perna', related: ['Quadríceps'] },
  { name: 'Leg Press', primary: 'Perna', related: ['Quadríceps'] },
];

async function main() {
  const byName = {};
  for (const name of groups) {
    byName[name] = await prisma.muscleGroup.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const { name, primary, related } of catalog) {
    // Exercício do catálogo = createdById nulo. Não há unicidade por nome, então busca antes de criar.
    const existing = await prisma.exercise.findFirst({ where: { name, createdById: null } });
    if (existing) continue;

    await prisma.exercise.create({
      data: {
        name,
        primaryGroupId: byName[primary].id,
        related: { create: related.map((r) => ({ muscleGroupId: byName[r].id })) },
      },
    });
  }

  console.log(`Seed ok: ${groups.length} grupos, ${catalog.length} exercícios do catálogo.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
