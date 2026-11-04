import prisma from '../configs/prisma.js';

const withEntries = {
  entries: { orderBy: { position: 'asc' }, include: { exercise: true } },
};

// Cria a sessão e todos os registros de série na mesma operação: ou grava tudo, ou nada.
export const create = ({ userId, workoutId, workoutName, startedAt, finishedAt, items }) =>
  prisma.workoutSession.create({
    data: {
      userId,
      workoutId,
      workoutName,
      startedAt,
      finishedAt,
      entries: {
        create: items.map(({ exerciseId, sets, reps, weightKg }, position) => ({
          userId,
          exerciseId,
          sets,
          reps,
          weightKg,
          position,
          performedAt: finishedAt,
        })),
      },
    },
    include: withEntries,
  });

export const list = (userId, limit) =>
  prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { finishedAt: 'desc' },
    take: limit,
    include: withEntries,
  });

export const findById = (id, userId) =>
  prisma.workoutSession.findFirst({ where: { id, userId }, include: withEntries });

// Treino anterior do mesmo modelo, para comparar o volume.
export const findPrevious = (userId, workoutId, before) =>
  prisma.workoutSession.findFirst({
    where: { userId, workoutId, finishedAt: { lt: before } },
    orderBy: { finishedAt: 'desc' },
    include: withEntries,
  });

// Os registros de série da sessão saem junto (onDelete: Cascade).
export const remove = (id) => prisma.workoutSession.delete({ where: { id } });
