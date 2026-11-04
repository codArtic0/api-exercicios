import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const user = await authService.register(req.body);
  res.status(201).json(user);
}

export async function login(req, res) {
  const token = await authService.login(req.body);
  res.json({ token });
}

export async function me(req, res) {
  res.json(await authService.me(req.user.id));
}
