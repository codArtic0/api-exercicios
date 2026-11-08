import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../configs/prisma.js', () => ({ default: {} }));
vi.mock('../repositories/exercise.repository.js', () => ({
  findVisibleById: vi.fn(),
  findVisibleByIds: vi.fn(),
  findVisibleByName: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
}));
vi.mock('../repositories/workout.repository.js', () => ({
  list: vi.fn(),
  findById: vi.fn(),
  findByName: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../repositories/session.repository.js', () => ({
  create: vi.fn(),
  list: vi.fn(),
  findById: vi.fn(),
  findPrevious: vi.fn(),
  remove: vi.fn(),
}));

const SECRET = 'segredo-de-teste';
const token = (sub = 'user-1') => `Bearer ${jwt.sign({ sub }, SECRET)}`;
const WID = '3f9c1d2e-5b7a-4c8d-9e0f-1a2b3c4d5e6f';
const SID = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const EX1 = '8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const EX2 = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

let app;
let exerciseRepository;
let workoutRepository;
let sessionRepository;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET;
  exerciseRepository = await import('../repositories/exercise.repository.js');
  workoutRepository = await import('../repositories/workout.repository.js');
  sessionRepository = await import('../repositories/session.repository.js');
  ({ default: app } = await import('../app.js'));
});

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.useRealTimers());

const entry = (exerciseId, name, sets, reps, weightKg) => ({
  exerciseId,
  sets,
  reps,
  weightKg,
  exercise: { id: exerciseId, name },
});

const sessionRow = (overrides = {}) => ({
  id: SID,
  workoutId: WID,
  workoutName: 'Treino A',
  startedAt: null,
  finishedAt: new Date('2026-11-04T12:00:00Z'),
  entries: [entry(EX1, 'Agachamento livre', 3, 8, 70), entry(EX2, 'Leg press', 2, 10, 120)],
  ...overrides,
});

// O que foi feito no dia: menos séries que o modelo (que tinha 3 × 10 no leg press).
const done = {
  items: [
    { exerciseId: EX1, sets: 3, reps: 8, weightKg: 70 },
    { exerciseId: EX2, sets: 2, reps: 10, weightKg: 120 },
  ],
};

describe('POST /workouts/:id/sessions (finalizar o treino)', () => {
  const ready = () => {
    workoutRepository.findById.mockResolvedValue({ id: WID, name: 'Treino A', items: [] });
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }, { id: EX2 }]);
    sessionRepository.findPrevious.mockResolvedValue(null);
  };

  it('401 sem token', async () => {
    expect((await request(app).post(`/workouts/${WID}/sessions`).send(done)).status).toBe(401);
  });

  it('201 grava tudo de uma vez com o que foi feito no dia e devolve as estatísticas', async () => {
    ready();
    sessionRepository.create.mockResolvedValue(sessionRow());

    const res = await request(app)
      .post(`/workouts/${WID}/sessions`)
      .set('Authorization', token('user-1'))
      .send(done);

    expect(res.status).toBe(201);
    expect(sessionRepository.create).toHaveBeenCalledTimes(1);
    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', workoutId: WID, workoutName: 'Treino A', items: done.items }),
    );
    // 3×8×70 = 1680 e 2×10×120 = 2400
    expect(res.body.stats).toMatchObject({
      totalVolume: 4080,
      totalSets: 5,
      exerciseCount: 2,
      bestExercise: { name: 'Leg press', volume: 2400 },
      heaviest: { name: 'Leg press', weightKg: 120 },
      previous: null,
    });
    expect(res.body.items).toEqual([
      { exercise: { id: EX1, name: 'Agachamento livre' }, sets: 3, reps: 8, weightKg: 70, volume: 1680 },
      { exercise: { id: EX2, name: 'Leg press' }, sets: 2, reps: 10, weightKg: 120, volume: 2400 },
    ]);
  });

  it('devolve os exercícios agrupados e o que o modelo previa, para comparar', async () => {
    workoutRepository.findById.mockResolvedValue({
      id: WID,
      name: 'Treino A',
      items: [
        { exercise: { id: EX1 }, sets: 3, reps: 8, weightKg: 60 },
        { exercise: { id: EX2 }, sets: 2, reps: 10, weightKg: 100 },
      ],
    });
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }, { id: EX2 }]);
    sessionRepository.findPrevious.mockResolvedValue(null);
    sessionRepository.create.mockResolvedValue(sessionRow());

    const res = await request(app).post(`/workouts/${WID}/sessions`).set('Authorization', token()).send(done);

    // modelo: 3×8×60 = 1440 e 2×10×100 = 2000
    expect(res.body.planned).toEqual({ volume: 3440, byExercise: { [EX1]: 1440, [EX2]: 2000 } });
    expect(res.body.exercises).toHaveLength(2);
    expect(res.body.exercises[0]).toMatchObject({ exercise: { id: EX1 }, volume: 1680 });
    expect(res.body.exercises[0].blocks).toEqual([{ sets: 3, reps: 8, weightKg: 70, volume: 1680 }]);
  });

  it('usa o nome do modelo na hora e o usuário do token', async () => {
    ready();
    sessionRepository.create.mockResolvedValue(sessionRow());

    await request(app)
      .post(`/workouts/${WID}/sessions`)
      .set('Authorization', token('user-1'))
      .send({ ...done, userId: 'invasor', workoutName: 'Hackeado' });

    const args = sessionRepository.create.mock.calls[0][0];
    expect(args.userId).toBe('user-1');
    expect(args.workoutName).toBe('Treino A');
  });

  it('compara o volume com o treino anterior do mesmo modelo', async () => {
    ready();
    sessionRepository.create.mockResolvedValue(
      sessionRow({ entries: [entry(EX1, 'Agachamento livre', 4, 10, 72.5), entry(EX2, 'Leg press', 3, 10, 130)] }),
    );
    sessionRepository.findPrevious.mockResolvedValue(sessionRow());

    const res = await request(app).post(`/workouts/${WID}/sessions`).set('Authorization', token()).send(done);

    // 2900 + 3900 = 6800 contra 4080
    expect(res.body.stats.totalVolume).toBe(6800);
    expect(res.body.stats.previous).toEqual({ totalVolume: 4080, deltaPct: 66.7 });
    expect(sessionRepository.findPrevious).toHaveBeenCalledWith('user-1', WID, expect.any(Date));
  });

  it('calcula a duração a partir de startedAt', async () => {
    ready();
    sessionRepository.create.mockResolvedValue(
      sessionRow({
        startedAt: new Date('2026-11-04T11:10:00Z'),
        finishedAt: new Date('2026-11-04T12:00:00Z'),
      }),
    );

    const res = await request(app)
      .post(`/workouts/${WID}/sessions`)
      .set('Authorization', token())
      .send({ ...done, startedAt: '2026-11-04T11:10:00Z' });

    expect(res.body.durationMinutes).toBe(50);
  });

  it('descarta a duração quando o treino ficou aberto por mais de 12 horas', async () => {
    ready();
    sessionRepository.create.mockResolvedValue(
      sessionRow({
        startedAt: new Date('2026-11-03T08:00:00Z'),
        finishedAt: new Date('2026-11-04T12:00:00Z'),
      }),
    );

    const res = await request(app)
      .post(`/workouts/${WID}/sessions`)
      .set('Authorization', token())
      .send({ ...done, startedAt: '2026-11-03T08:00:00Z' });

    expect(res.status).toBe(201);
    expect(res.body.durationMinutes).toBeNull();
  });

  it('404 em treino de outro usuário, sem gravar nada', async () => {
    workoutRepository.findById.mockResolvedValue(null);

    const res = await request(app)
      .post(`/workouts/${WID}/sessions`)
      .set('Authorization', token('user-2'))
      .send(done);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('WORKOUT_NOT_FOUND');
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });

  it('400 quando algum exercício não é visível ao usuário, sem gravar nada', async () => {
    workoutRepository.findById.mockResolvedValue({ id: WID, name: 'Treino A' });
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }]);

    const res = await request(app).post(`/workouts/${WID}/sessions`).set('Authorization', token()).send(done);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EXERCISE_NOT_FOUND');
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });

  it.each([
    ['sem exercícios', { items: [] }],
    ['peso com duas casas', { items: [{ exerciseId: EX1, sets: 3, reps: 8, weightKg: 70.25 }] }],
    ['repetições zero', { items: [{ exerciseId: EX1, sets: 3, reps: 0, weightKg: 70 }] }],
    ['séries demais', { items: Array(61).fill(done.items[0]) }],
    ['início no futuro', { ...done, startedAt: '2999-01-01T00:00:00Z' }],
  ])('400 com %s', async (_nome, payload) => {
    const res = await request(app).post(`/workouts/${WID}/sessions`).set('Authorization', token()).send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });
});

describe('GET /sessions (histórico)', () => {
  it('401 sem token', async () => {
    expect((await request(app).get('/sessions')).status).toBe(401);
  });

  it('200 lista os treinos do usuário, do mais recente ao mais antigo, com as estatísticas', async () => {
    sessionRepository.list.mockResolvedValue([
      sessionRow(),
      sessionRow({ id: 'outra', workoutName: 'Treino B', workoutId: null, entries: [entry(EX1, 'Supino', 3, 10, 50)] }),
    ]);

    const res = await request(app).get('/sessions').set('Authorization', token('user-1'));

    expect(res.status).toBe(200);
    expect(sessionRepository.list).toHaveBeenCalledWith('user-1', 20);
    expect(res.body.map((s) => [s.workoutName, s.stats.totalVolume])).toEqual([
      ['Treino A', 4080],
      ['Treino B', 1500],
    ]);
  });

  it('repassa o limite pedido e nunca passa de 50', async () => {
    sessionRepository.list.mockResolvedValue([]);

    await request(app).get('/sessions?limit=5').set('Authorization', token());
    expect(sessionRepository.list).toHaveBeenLastCalledWith('user-1', 5);

    const res = await request(app).get('/sessions?limit=500').set('Authorization', token());
    expect(res.status).toBe(400);
  });

  it('treino cujo modelo foi apagado continua no histórico, sem comparação', async () => {
    sessionRepository.list.mockResolvedValue([sessionRow({ workoutId: null })]);

    const res = await request(app).get('/sessions').set('Authorization', token());

    expect(res.body[0].workoutName).toBe('Treino A');
    expect(res.body[0].stats.previous).toBeNull();
    expect(sessionRepository.findPrevious).not.toHaveBeenCalled();
  });
});

describe('GET e DELETE /sessions/:id', () => {
  it('200 devolve um treino realizado', async () => {
    sessionRepository.findById.mockResolvedValue(sessionRow());
    sessionRepository.findPrevious.mockResolvedValue(null);

    const res = await request(app).get(`/sessions/${SID}`).set('Authorization', token('user-1'));

    expect(res.status).toBe(200);
    expect(sessionRepository.findById).toHaveBeenCalledWith(SID, 'user-1');
    expect(res.body.stats.totalVolume).toBe(4080);
  });

  it('404 em treino realizado de outro usuário', async () => {
    sessionRepository.findById.mockResolvedValue(null);

    const res = await request(app).get(`/sessions/${SID}`).set('Authorization', token('user-2'));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('204 apaga o treino realizado', async () => {
    sessionRepository.findById.mockResolvedValue(sessionRow());
    sessionRepository.remove.mockResolvedValue({});

    const res = await request(app).delete(`/sessions/${SID}`).set('Authorization', token());

    expect(res.status).toBe(204);
    expect(sessionRepository.remove).toHaveBeenCalledWith(SID);
  });

  it('404 ao apagar treino realizado de outro usuário, sem apagar', async () => {
    sessionRepository.findById.mockResolvedValue(null);

    const res = await request(app).delete(`/sessions/${SID}`).set('Authorization', token('user-2'));

    expect(res.status).toBe(404);
    expect(sessionRepository.remove).not.toHaveBeenCalled();
  });
});
