import prisma from '../configs/prisma.js';

// Exercício é sempre do usuário que o criou: nenhuma consulta devolve o de outra pessoa.
const ownedBy = (userId) => ({ createdById: userId });

// Tudo que a tela precisa de um exercício: grupo principal, relacionados e a última série do usuário.
const withDetails = (userId) => ({
  primaryGroup: true,
  related: { include: { muscleGroup: true } },
  entries: { where: { userId }, orderBy: { performedAt: 'desc' }, take: 1 },
});

export const findOwnedById = (id, userId) =>
  prisma.exercise.findFirst({ where: { id, ...ownedBy(userId) } });

export const findOwnedByName = (name, userId) =>
  prisma.exercise.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, ...ownedBy(userId) },
  });

export const list = (userId, { group, q } = {}) =>
  prisma.exercise.findMany({
    where: {
      AND: [
        ownedBy(userId),
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
