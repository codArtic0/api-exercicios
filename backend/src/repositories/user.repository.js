import prisma from '../configs/prisma.js';

export const findByEmail = (email) => prisma.user.findUnique({ where: { email } });

export const findById = (id) => prisma.user.findUnique({ where: { id } });

export const create = (data) => prisma.user.create({ data });
