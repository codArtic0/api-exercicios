import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware.js';

const unauthorized = () => new AppError(401, 'UNAUTHORIZED', 'Token ausente ou inválido');

export const auth = (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não definido');

  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    req.user = { id: payload.sub };
  } catch {
    throw unauthorized();
  }

  next();
};
