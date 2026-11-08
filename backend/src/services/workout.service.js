import { AppError } from '../middlewares/error.middleware.js';
import * as exerciseRepository from '../repositories/exercise.repository.js';
import * as workoutRepository from '../repositories/workout.repository.js';
import { plannedTotals } from './workoutStats.service.js';

export const toWorkoutResponse = ({ id, name, items, sessions }) => {
  const planned = plannedTotals(items);
  return {
    id,
    name,
    exerciseCount: planned.exerciseCount,
    plannedSets: planned.sets,
    plannedVolume: planned.volume,
  items: items.map(({ id: itemId, exercise, sets, reps, weightKg }) => ({
    id: itemId,
    exercise: {
      id: exercise.id,
      name: exercise.name,
      primaryGroup: { id: exercise.primaryGroup.id, name: exercise.primaryGroup.name },
    },
    sets,
    reps,
    weightKg,
  })),
  lastSessionAt: sessions?.[0]?.finishedAt ?? null,
  };
};

// Todo exercício do treino precisa ser visível ao usuário (do catálogo ou dele).
export async function assertExercisesVisible(userId, items) {
  const ids = [...new Set(items.map((i) => i.exerciseId))];
  const found = await exerciseRepository.findVisibleByIds(ids, userId);
  if (found.length !== ids.length) {
    throw new AppError(400, 'EXERCISE_NOT_FOUND', 'Exercício não encontrado');
  }
}

async function assertNameFree(userId, name, exceptId = null) {
  const same = await workoutRepository.findByName(name, userId);
  if (same && same.id !== exceptId) {
    throw new AppError(409, 'WORKOUT_EXISTS', 'Você já tem um treino com esse nome');
  }
}

async function getOwned(userId, id) {
  const workout = await workoutRepository.findById(id, userId);
  if (!workout) throw new AppError(404, 'WORKOUT_NOT_FOUND', 'Treino não encontrado');
  return workout;
}

export async function list(userId) {
  return (await workoutRepository.list(userId)).map(toWorkoutResponse);
}

export async function get(userId, id) {
  return toWorkoutResponse(await getOwned(userId, id));
}

export async function create(userId, { name, items }) {
  await assertNameFree(userId, name);
  await assertExercisesVisible(userId, items);

  try {
    return toWorkoutResponse(await workoutRepository.create({ userId, name, items }));
  } catch (err) {
    // Dois pedidos simultâneos com o mesmo nome: o banco recusa o segundo (unique).
    if (err.code === 'P2002') throw new AppError(409, 'WORKOUT_EXISTS', 'Você já tem um treino com esse nome');
    throw err;
  }
}

export async function update(userId, id, { name, items }) {
  await getOwned(userId, id);
  await assertNameFree(userId, name, id);
  await assertExercisesVisible(userId, items);

  try {
    return toWorkoutResponse(await workoutRepository.update(id, { name, items }));
  } catch (err) {
    if (err.code === 'P2002') throw new AppError(409, 'WORKOUT_EXISTS', 'Você já tem um treino com esse nome');
    throw err;
  }
}

// O histórico de treinos já feitos é mantido (workoutId vira nulo, workoutName fica).
export async function remove(userId, id) {
  await getOwned(userId, id);
  await workoutRepository.remove(id);
}
