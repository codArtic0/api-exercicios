import prisma from '../configs/prisma.js';

// Visível = do catálogo (createdById nulo, igual para todos) ou criado pelo próprio usuário.
// Exercício criado por outro usuário nunca é devolvido.
const visibleTo = (userId) => ({ OR: [{ createdById: null }, { createdById: userId }] });

// Tudo que a tela precisa de um exercício: grupo principal, relacionados e a última série do usuário.
const withDetails = (userId) => ({
  primaryGroup: true,
  related: { include: { muscleGroup: true } },
  entries: { where: { userId }, orderBy: { performedAt: 'desc' }, take: 1 },
});

export const findVisibleById = (id, userId) =>
  prisma.exercise.findFirst({ where: { id, ...visibleTo(userId) } });

export const findVisibleByIds = (ids, userId) =>
  prisma.exercise.findMany({ where: { id: { in: ids }, ...visibleTo(userId) } });

export const findVisibleByName = (name, userId) =>
  prisma.exercise.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, ...visibleTo(userId) },
  });

export const list = (userId, { group, q } = {}) =>
  prisma.exercise.findMany({
    where: {
      AND: [
        visibleTo(userId),
        group
          ? {
              OR: [
                { primaryGroup: { name: { equals: group, mode: 'insensitive' } } },
                { related: { some: { muscleGroup: { name: { equals: group, mode: 'insensitive' } } } } },
              ],
            }
          : {},
        q ? { name: { contains: q, mode: 'insensitive' } } : {},
      ],
    },
    include: withDetails(userId),
    orderBy: { name: 'asc' },
  });

export const create = ({ name, primaryGroupId, relatedGroupIds, createdById }) =>
  prisma.exercise.create({
    data: {
      name,
      primaryGroupId,
      createdById,
      related: { create: relatedGroupIds.map((muscleGroupId) => ({ muscleGroupId })) },
    },
    include: withDetails(createdById),
  });
