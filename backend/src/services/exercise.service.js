import { AppError } from '../middlewares/error.middleware.js';
import * as exerciseRepository from '../repositories/exercise.repository.js';
import * as muscleGroupRepository from '../repositories/muscleGroup.repository.js';

export async function list(userId, filters) {
  return exerciseRepository.list(userId, filters);
}

export async function create(userId, { name, primaryGroupId, relatedGroupIds }) {
  // O grupo principal não precisa se repetir entre os relacionados.
  const related = [...new Set(relatedGroupIds)].filter((id) => id !== primaryGroupId);
  const wanted = [primaryGroupId, ...related];

  const found = await muscleGroupRepository.findByIds(wanted);
  if (found.length !== wanted.length) {
    throw new AppError(400, 'GROUP_NOT_FOUND', 'Grupo muscular não encontrado');
  }

  if (await exerciseRepository.findVisibleByName(name, userId)) {
    throw new AppError(409, 'EXERCISE_EXISTS', 'Já existe um exercício com esse nome');
  }

  return exerciseRepository.create({
    name,
    primaryGroupId,
    relatedGroupIds: related,
    createdById: userId,
  });
}
