import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/error.middleware.js';
import * as userRepository from '../repositories/user.repository.js';

const SALT_ROUNDS = 10;
// Hash descartável: login com email inexistente gasta o mesmo tempo de um com senha errada.
const DUMMY_HASH = bcrypt.hashSync('senha-descartavel', SALT_ROUNDS);

const toPublic = ({ id, name, email, createdAt }) => ({ id, name, email, createdAt });

export async function register({ name, email, password }) {
  if (await userRepository.findByEmail(email)) {
    throw new AppError(409, 'EMAIL_IN_USE', 'Email já cadastrado');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return toPublic(await userRepository.create({ name, email, passwordHash }));
  } catch (err) {
    // Dois cadastros simultâneos com o mesmo email: o banco recusa o segundo.
    if (err.code === 'P2002') throw new AppError(409, 'EMAIL_IN_USE', 'Email já cadastrado');
    throw err;
  }
}

export async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou senha incorretos');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não definido');

  return jwt.sign({}, secret, {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function me(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Token ausente ou inválido');
  return toPublic(user);
}
