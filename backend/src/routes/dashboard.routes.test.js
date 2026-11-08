import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../configs/prisma.js', () => ({ default: {} }));
vi.mock('../repositories/workout.repository.js', () => ({ list: vi.fn() }));
vi.mock('../repositories/session.repository.js', () => ({
  list: vi.fn(),
  listSince: vi.fn(),
  findLastWorkoutId: vi.fn(),
  findPrevious: vi.fn(),
}));

const SECRET = 'segredo-de-teste';
const token = (sub = 'user-1') => `Bearer ${jwt.sign({ sub }, SECRET)}`;
const EX = '8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

let app;
let workoutRepository;
let sessionRepository;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET;
  workoutRepository = await import('../repositories/workout.repository.js');
  sessionRepository = await import('../repositories/session.repository.js');
  ({ default: app } = await import('../app.js'));
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-04T15:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const workout = (id, name) => ({
  id,
  name,
  sessions: [],
  items: [
    {
      id: `i-${id}`,
      sets: 3,
      reps: 10,
      weightKg: 50,
      exercise: { id: EX, name: 'Supino', primaryGroup: { id: 'g-1', name: 'Peito' } },
    },
  ],
});

const session = (id, workoutId, finishedAt) => ({
  id,
  workoutId,
  workoutName: workoutId ? `Treino ${workoutId.toUpperCase()}` : 'Avulso',
  startedAt: null,
  finishedAt: new Date(finishedAt),
  entries: [{ exerciseId: EX, sets: 3, reps: 10, weightKg: 50, exercise: { id: EX, name: 'Supino' } }],
});

describe('GET /dashboard', () => {
  it('401 sem token', async () => {
    expect((await request(app).get('/dashboard')).status).toBe(401);
  });

  it('200 devolve próximo treino, semana e último treino numa chamada só', async () => {
    const recent = [session('s-2', 'a', '2026-11-04T12:00:00Z'), session('s-1', 'b', '2026-11-02T12:00:00Z')];
    workoutRepository.list.mockResolvedValue([workout('a', 'Treino A'), workout('b', 'Treino B'), workout('c', 'Treino C')]);
    sessionRepository.findLastWorkoutId.mockResolvedValue('a');
    sessionRepository.listSince.mockResolvedValue(recent);
    sessionRepository.list.mockResolvedValue([recent[0]]);
    sessionRepository.findPrevious.mockResolvedValue(null);

    const res = await request(app).get('/dashboard?tz=UTC').set('Authorization', token('user-1'));

    expect(res.status).toBe(200);
    // depois do A vem o B
    expect(res.body.nextWorkout).toMatchObject({ id: 'b', exerciseCount: 1, plannedSets: 3, plannedVolume: 1500 });
    // cada sessão: 3 × 10 × 50 = 1500
    expect(res.body.week.totals).toEqual({ workouts: 2, volume: 3000, sets: 6 });
    expect(res.body.week.days).toHaveLength(7);
    expect(res.body.week.days.at(-1)).toEqual({ date: '2026-11-04', volume: 1500, count: 1, isToday: true });
    expect(res.body.lastSession).toMatchObject({ id: 's-2', workoutName: 'Treino A' });
    expect(workoutRepository.list).toHaveBeenCalledWith('user-1');
    expect(sessionRepository.findLastWorkoutId).toHaveBeenCalledWith('user-1');
  });

  it('200 sem treinos nem histórico', async () => {
    workoutRepository.list.mockResolvedValue([]);
    sessionRepository.findLastWorkoutId.mockResolvedValue(null);
    sessionRepository.listSince.mockResolvedValue([]);
    sessionRepository.list.mockResolvedValue([]);

    const res = await request(app).get('/dashboard').set('Authorization', token());

    expect(res.status).toBe(200);
    expect(res.body.nextWorkout).toBeNull();
    expect(res.body.lastSession).toBeNull();
    expect(res.body.week.totals).toEqual({ workouts: 0, volume: 0, sets: 0 });
  });

  it('fuso inválido não derruba a rota', async () => {
    workoutRepository.list.mockResolvedValue([]);
    sessionRepository.findLastWorkoutId.mockResolvedValue(null);
    sessionRepository.listSince.mockResolvedValue([]);
    sessionRepository.list.mockResolvedValue([]);

    const res = await request(app).get('/dashboard?tz=Nao/Existe').set('Authorization', token());

    expect(res.status).toBe(200);
  });
});
