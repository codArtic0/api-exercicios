import { AppError } from '../middlewares/error.middleware.js';
import * as exerciseRepository from '../repositories/exercise.repository.js';
import * as entryRepository from '../repositories/entry.repository.js';
import { computeExerciseStats } from './exerciseStats.service.js';

async function assertExerciseVisible(userId, exerciseId) {
  const exercise = await exerciseRepository.findVisibleById(exerciseId, userId);
  if (!exercise) {
    throw new AppError(404, 'EXERCISE_NOT_FOUND', 'Exercício não encontrado');
  }
}

export async function create(userId, exerciseId, data) {
  await assertExerciseVisible(userId, exerciseId);
  return entryRepository.create({ ...data, userId, exerciseId });
}

export async function listByExercise(userId, exerciseId) {
  await assertExerciseVisible(userId, exerciseId);
  return entryRepository.listByUserAndExercise(userId, exerciseId);
}

export async function statsByExercise(userId, exerciseId) {
  await assertExerciseVisible(userId, exerciseId);
  return computeExerciseStats(await entryRepository.listByUserAndExercise(userId, exerciseId));
}
