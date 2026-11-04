import * as sessionService from '../services/session.service.js';
import * as workoutService from '../services/workout.service.js';

export async function list(req, res) {
  res.json(await workoutService.list(req.user.id));
}

export async function get(req, res) {
  res.json(await workoutService.get(req.user.id, req.params.id));
}

export async function create(req, res) {
  res.status(201).json(await workoutService.create(req.user.id, req.body));
}

export async function update(req, res) {
  res.json(await workoutService.update(req.user.id, req.params.id, req.body));
}

export async function remove(req, res) {
  await workoutService.remove(req.user.id, req.params.id);
  res.status(204).end();
}

export async function finish(req, res) {
  res.status(201).json(await sessionService.finish(req.user.id, req.params.id, req.body));
}
