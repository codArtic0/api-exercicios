import prisma from '../configs/prisma.js';

export const create = (data) => prisma.workoutEntry.create({ data });

export const listByUserAndExercise = (userId, exerciseId) =>
  prisma.workoutEntry.findMany({
    where: { userId, exerciseId },
    orderBy: { performedAt: 'asc' },
  });
