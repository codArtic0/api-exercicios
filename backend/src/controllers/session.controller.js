import * as sessionService from '../services/session.service.js';

export async function list(req, res) {
  // req.query é somente leitura no Express 5 e não passa pelo validate: o limite é lido aqui.
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  res.json(await sessionService.list(req.user.id, limit));
}

export async function get(req, res) {
  res.json(await sessionService.get(req.user.id, req.params.id));
}

export async function remove(req, res) {
  await sessionService.remove(req.user.id, req.params.id);
  res.status(204).end();
}
