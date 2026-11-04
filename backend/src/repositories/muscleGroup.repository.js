import prisma from '../configs/prisma.js';

export const list = () => prisma.muscleGroup.findMany({ orderBy: { name: 'asc' } });

export const findByIds = (ids) => prisma.muscleGroup.findMany({ where: { id: { in: ids } } });

export const findByName = (name) =>
  prisma.muscleGroup.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });

export const create = (name) => prisma.muscleGroup.create({ data: { name } });
