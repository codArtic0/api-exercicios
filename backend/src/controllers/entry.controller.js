import * as entryService from '../services/entry.service.js';
import { withDerived } from '../services/exerciseStats.service.js';

const toResponse = (entry) => {
  const { id, exerciseId, sets, reps, weightKg, performedAt, volume, oneRepMax } = withDerived(entry);
  return { id, exerciseId, sets, reps, weightKg, performedAt, volume, oneRepMax };
};

export async function create(req, res) {
  const entry = await entryService.create(req.user.id, req.params.id, req.body);
  res.status(201).json(toResponse(entry));
}

export async function listByExercise(req, res) {
  const entries = await entryService.listByExercise(req.user.id, req.params.id);
  res.json(entries.map(toResponse));
}

export async function stats(req, res) {
  res.json(await entryService.statsByExercise(req.user.id, req.params.id));
}
