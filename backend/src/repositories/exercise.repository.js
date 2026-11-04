import prisma from '../configs/prisma.js';

// Visível = do catálogo (createdById nulo) ou criado pelo próprio usuário.
export const findVisibleById = (id, userId) =>
  prisma.exercise.findFirst({
    where: { id, OR: [{ createdById: null }, { createdById: userId }] },
  });

export const list = (userId, { group, q } = {}) =>
  prisma.exercise.findMany({
    where: {
      AND: [
        { OR: [{ createdById: null }, { createdById: userId }] },
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
    include: { primaryGroup: true },
    orderBy: { name: 'asc' },
  });
