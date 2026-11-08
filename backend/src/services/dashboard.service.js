import * as sessionRepository from '../repositories/session.repository.js';
import * as workoutRepository from '../repositories/workout.repository.js';
import * as sessionService from './session.service.js';
import { toWorkoutResponse } from './workout.service.js';
import { computeSessionStats } from './workoutStats.service.js';
import { pickNextWorkout, safeTimeZone, weekSummary, weekWindowStart } from './week.service.js';

// Tudo o que o painel "Hoje" mostra, numa chamada só: próximo treino, semana e último treino.
// O fuso vem do aparelho do usuário, para "hoje" ser o dia dele e não o do servidor.
export async function get(userId, { timeZone, now = new Date() } = {}) {
  const zone = safeTimeZone(timeZone);

  const [workouts, lastWorkoutId, recent, [lastSession = null]] = await Promise.all([
    workoutRepository.list(userId),
    sessionRepository.findLastWorkoutId(userId),
    sessionRepository.listSince(userId, weekWindowStart(now)),
    sessionService.list(userId, 1),
  ]);

  const next = pickNextWorkout(workouts, lastWorkoutId);
  const sessions = recent.map((s) => ({
    finishedAt: s.finishedAt,
    stats: computeSessionStats(sessionService.toStatsItems(s.entries)),
  }));

  return {
    nextWorkout: next ? toWorkoutResponse(next) : null,
    week: weekSummary(sessions, now, zone),
    lastSession,
  };
}
