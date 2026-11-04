import 'dotenv/config';
import prisma from '../configs/prisma.js';
import { EXERCISES, GROUPS } from './catalog.js';

// Catálogo = exercícios com createdById nulo, visíveis para todos. Os exercícios que cada usuário
// cria ficam só dele e não são tocados por este seed. Pode rodar mais de uma vez sem duplicar.
async function main() {
  const byName = {};
  for (const name of GROUPS) {
    byName[name] = await prisma.muscleGroup.upsert({ where: { name }, update: {}, create: { name } });
  }

  let created = 0;
  for (const [name, primary, related] of EXERCISES) {
    for (const g of [primary, ...related]) {
      if (!byName[g]) throw new Error(`Grupo "${g}" do exercício "${name}" não está em GROUPS`);
    }

    // Não há unicidade por nome no banco: procura antes (sem diferenciar maiúsculas).
    const existing = await prisma.exercise.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, createdById: null },
    });
    if (existing) continue;

    await prisma.exercise.create({
      data: {
        name,
        primaryGroupId: byName[primary].id,
        related: { create: related.map((r) => ({ muscleGroupId: byName[r].id })) },
      },
    });
    created += 1;
  }

  console.log(
    `Seed ok: ${GROUPS.length} grupos, ${EXERCISES.length} exercícios no catálogo (${created} novos).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
