import * as exerciseRepository from '../repositories/exercise.repository.js';

export async function list(userId, filters) {
  return exerciseRepository.list(userId, filters);
}
