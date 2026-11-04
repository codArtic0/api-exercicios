import * as exerciseService from '../services/exercise.service.js';

const toResponse = ({ id, name, primaryGroup, related, entries, createdById }) => {
  const last = entries[0];
  return {
    id,
    name,
    primaryGroup: { id: primaryGroup.id, name: primaryGroup.name },
    relatedGroups: related.map(({ muscleGroup }) => ({ id: muscleGroup.id, name: muscleGroup.name })),
    lastEntry: last
      ? { sets: last.sets, reps: last.reps, weightKg: last.weightKg, performedAt: last.performedAt }
      : null,
    // true = exercício padrão (de todos); false = criado pelo próprio usuário (só dele).
    isCatalog: createdById === null,
  };
};

export async function list(req, res) {
  const { group, q } = req.query;
  const exercises = await exerciseService.list(req.user.id, { group, q });
  res.json(exercises.map(toResponse));
}

export async function create(req, res) {
  const exercise = await exerciseService.create(req.user.id, req.body);
  res.status(201).json(toResponse(exercise));
}
