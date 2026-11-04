import prisma from '../configs/prisma.js';

const withItems = {
  items: {
    orderBy: { position: 'asc' },
    include: { exercise: { include: { primaryGroup: true } } },
  },
};

const toItemData = (items) =>
  items.map(({ exerciseId, sets, reps, weightKg }, position) => ({
    exerciseId,
    position,
    sets,
    reps,
    weightKg,
  }));

// Na ordem de criação (Treino A, B, C), com a data do último treino feito.
export const list = (userId) =>
  prisma.workout.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      ...withItems,
      sessions: { orderBy: { finishedAt: 'desc' }, take: 1, select: { finishedAt: true } },
    },
  });

export const findById = (id, userId) =>
  prisma.workout.findFirst({
    where: { id, userId },
    include: {
      ...withItems,
      sessions: { orderBy: { finishedAt: 'desc' }, take: 1, select: { finishedAt: true } },
    },
  });

export const findByName = (name, userId) =>
  prisma.workout.findFirst({
    where: { userId, name: { equals: name, mode: 'insensitive' } },
  });

export const create = ({ userId, name, items }) =>
  prisma.workout.create({
    data: { userId, name, items: { create: toItemData(items) } },
    include: { ...withItems, sessions: { select: { finishedAt: true }, take: 1 } },
  });

// Troca nome e exercícios numa única operação: ou muda tudo, ou nada.
export const update = (id, { name, items }) =>
  prisma.workout.update({
    where: { id },
    data: { name, items: { deleteMany: {}, create: toItemData(items) } },
    include: {
      ...withItems,
      sessions: { orderBy: { finishedAt: 'desc' }, take: 1, select: { finishedAt: true } },
    },
  });

export const remove = (id) => prisma.workout.delete({ where: { id } });
