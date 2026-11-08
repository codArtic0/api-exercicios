import { AppError } from '../middlewares/error.middleware.js';
import * as sessionRepository from '../repositories/session.repository.js';
import * as workoutRepository from '../repositories/workout.repository.js';
import { assertExercisesVisible } from './workout.service.js';
import {
  compareWithPrevious,
  computeSessionStats,
  groupByExercise,
  itemVolume,
  plannedByExercise,
  plannedTotals,
} from './workoutStats.service.js';

// Esquecer o treino aberto não pode gerar uma duração absurda.
const MAX_DURATION_MS = 12 * 60 * 60 * 1000;

export const toStatsItems = (entries) =>
  entries.map((e) => ({
    exerciseId: e.exerciseId,
    exerciseName: e.exercise.name,
    sets: e.sets,
    reps: e.reps,
    weightKg: e.weightKg,
  }));

function durationMinutes(startedAt, finishedAt) {
  if (!startedAt) return null;
  const ms = finishedAt - startedAt;
  if (ms < 0 || ms > MAX_DURATION_MS) return null;
  return Math.round(ms / 60000);
}

async function toSessionResponse(userId, session, planned = null) {
  const stats = computeSessionStats(toStatsItems(session.entries));

  let previous = null;
  if (session.workoutId) {
    const before = await sessionRepository.findPrevious(userId, session.workoutId, session.finishedAt);
    if (before) {
      previous = compareWithPrevious(stats.totalVolume, computeSessionStats(toStatsItems(before.entries)).totalVolume);
    }
  }

  return {
    id: session.id,
    workoutId: session.workoutId,
    workoutName: session.workoutName,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    durationMinutes: durationMinutes(session.startedAt, session.finishedAt),
    items: session.entries.map((e) => ({
      exercise: { id: e.exercise.id, name: e.exercise.name },
      sets: e.sets,
      reps: e.reps,
      weightKg: e.weightKg,
      volume: itemVolume(e),
    })),
    // Os blocos do mesmo exercício já agrupados, com o volume somado: é o que a tela mostra.
    exercises: groupByExercise(
      session.entries.map((e) => ({
        exercise: { id: e.exercise.id, name: e.exercise.name },
        sets: e.sets,
        reps: e.reps,
        weightKg: e.weightKg,
      })),
    ),
    stats: { ...stats, previous },
    planned,
  };
}

// Finaliza o treino: grava a sessão e todos os exercícios de uma vez.
// Os números vêm do que foi feito no dia, não do modelo (que continua como estava).
export async function finish(userId, workoutId, { items, startedAt }) {
  const workout = await workoutRepository.findById(workoutId, userId);
  if (!workout) throw new AppError(404, 'WORKOUT_NOT_FOUND', 'Treino não encontrado');

  await assertExercisesVisible(userId, items);

  const session = await sessionRepository.create({
    userId,
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt: startedAt ?? null,
    finishedAt: new Date(),
    items,
  });
  // O modelo continua como estava: o que ele previa serve de comparação com o que foi feito.
  return toSessionResponse(userId, session, {
    volume: plannedTotals(workout.items).volume,
    byExercise: plannedByExercise(workout.items),
  });
}

export async function list(userId, limit = 20) {
  const sessions = await sessionRepository.list(userId, limit);
  return Promise.all(sessions.map((s) => toSessionResponse(userId, s)));
}

export async function get(userId, id) {
  const session = await sessionRepository.findById(id, userId);
  if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Treino realizado não encontrado');
  return toSessionResponse(userId, session);
}

// Apagar o treino realizado também apaga as séries que ele registrou.
export async function remove(userId, id) {
  const session = await sessionRepository.findById(id, userId);
  if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Treino realizado não encontrado');
  await sessionRepository.remove(id);
}
