import * as exerciseService from '../services/exercise.service.js';

const toResponse = ({ id, name, primaryGroup, createdById }) => ({
  id,
  name,
  primaryGroup: { id: primaryGroup.id, name: primaryGroup.name },
  isCatalog: createdById === null,
});

export async function list(req, res) {
  const { group, q } = req.query;
  const exercises = await exerciseService.list(req.user.id, { group, q });
  res.json(exercises.map(toResponse));
}
