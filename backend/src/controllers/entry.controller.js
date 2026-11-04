import * as entryService from '../services/entry.service.js';

const toResponse = ({ id, exerciseId, sets, reps, weightKg, performedAt }) => ({
  id,
  exerciseId,
  sets,
  reps,
  weightKg,
  performedAt,
});

export async function create(req, res) {
  const entry = await entryService.create(req.user.id, req.params.id, req.body);
  res.status(201).json(toResponse(entry));
}

export async function listByExercise(req, res) {
  const entries = await entryService.listByExercise(req.user.id, req.params.id);
  res.json(entries.map(toResponse));
}
