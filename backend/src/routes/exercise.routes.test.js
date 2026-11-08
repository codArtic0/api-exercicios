import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../configs/prisma.js', () => ({ default: {} }));
vi.mock('../repositories/exercise.repository.js', () => ({
  findVisibleById: vi.fn(),
  list: vi.fn(),
}));
vi.mock('../repositories/entry.repository.js', () => ({
  create: vi.fn(),
  listByUserAndExercise: vi.fn(),
}));

const SECRET = 'segredo-de-teste';
const exerciseId = '3f9c1d2e-5b7a-4c8d-9e0f-1a2b3c4d5e6f';
const url = `/exercises/${exerciseId}/entries`;
const token = (sub = 'user-1') => `Bearer ${jwt.sign({ sub }, SECRET)}`;

let app;
let exerciseRepository;
let entryRepository;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET;
  exerciseRepository = await import('../repositories/exercise.repository.js');
  entryRepository = await import('../repositories/entry.repository.js');
  ({ default: app } = await import('../app.js'));
});

beforeEach(() => vi.resetAllMocks());

describe('POST /exercises/:id/entries', () => {
  const body = { sets: 3, reps: 12, weightKg: 90 };

  it('401 sem token', async () => {
    const res = await request(app).post(url).send(body);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('201 registra a série e não devolve o userId', async () => {
    const performedAt = new Date('2026-11-03T18:30:00Z');
    exerciseRepository.findVisibleById.mockResolvedValue({ id: exerciseId });
    entryRepository.create.mockResolvedValue({
      id: 'e-1',
      userId: 'user-1',
      exerciseId,
      ...body,
      performedAt,
    });

    const res = await request(app).post(url).set('Authorization', token()).send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 'e-1',
      exerciseId,
      ...body,
      performedAt: performedAt.toISOString(),
      volume: body.sets * body.reps * body.weightKg,
      oneRepMax: expect.any(Number),
    });
    expect(res.body).not.toHaveProperty('userId');
  });

  it('o userId vem do token, nunca do body', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue({ id: exerciseId });
    entryRepository.create.mockResolvedValue({ id: 'e-1', exerciseId, ...body });

    await request(app)
      .post(url)
      .set('Authorization', token('user-1'))
      .send({ ...body, userId: 'invasor' });

    expect(entryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', exerciseId }),
    );
  });

  it('404 quando o exercício não é visível ao usuário', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue(null);

    const res = await request(app).post(url).set('Authorization', token()).send(body);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('EXERCISE_NOT_FOUND');
    expect(entryRepository.create).not.toHaveBeenCalled();
  });

  it.each([
    ['reps zero', { ...body, reps: 0 }],
    ['peso negativo', { ...body, weightKg: -5 }],
    ['peso com duas casas', { ...body, weightKg: 60.55 }],
    ['sem sets', { reps: 12, weightKg: 90 }],
    ['data no futuro', { ...body, performedAt: '2999-01-01T00:00:00Z' }],
  ])('400 com %s', async (_nome, payload) => {
    const res = await request(app).post(url).set('Authorization', token()).send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(entryRepository.create).not.toHaveBeenCalled();
  });

  it('400 com id que não é UUID', async () => {
    const res = await request(app)
      .post('/exercises/123/entries')
      .set('Authorization', token())
      .send(body);

    expect(res.status).toBe(400);
  });
});

describe('GET /exercises/:id/entries', () => {
  it('401 sem token', async () => {
    const res = await request(app).get(url);

    expect(res.status).toBe(401);
  });

  it('200 devolve o histórico do usuário na ordem do repository', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue({ id: exerciseId });
    entryRepository.listByUserAndExercise.mockResolvedValue([
      { id: 'e-1', userId: 'user-1', exerciseId, sets: 3, reps: 12, weightKg: 80, performedAt: new Date('2026-11-01') },
      { id: 'e-2', userId: 'user-1', exerciseId, sets: 3, reps: 10, weightKg: 90, performedAt: new Date('2026-11-03') },
    ]);

    const res = await request(app).get(url).set('Authorization', token('user-1'));

    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.id)).toEqual(['e-1', 'e-2']);
    expect(res.body[0]).not.toHaveProperty('userId');
    expect(entryRepository.listByUserAndExercise).toHaveBeenCalledWith('user-1', exerciseId);
  });

  it('200 com lista vazia quando não há registros', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue({ id: exerciseId });
    entryRepository.listByUserAndExercise.mockResolvedValue([]);

    const res = await request(app).get(url).set('Authorization', token());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('404 quando o exercício não é visível ao usuário', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue(null);

    const res = await request(app).get(url).set('Authorization', token());

    expect(res.status).toBe(404);
    expect(entryRepository.listByUserAndExercise).not.toHaveBeenCalled();
  });
});

describe('GET /exercises', () => {
  const squat = {
    id: 'ex-1',
    name: 'Leg Press',
    createdById: null,
    primaryGroup: { id: 'g-1', name: 'Perna' },
    related: [{ muscleGroup: { id: 'g-2', name: 'Quadríceps' } }],
    entries: [],
  };

  it('401 sem token', async () => {
    const res = await request(app).get('/exercises');

    expect(res.status).toBe(401);
  });

  it('200 lista com os filtros group e q repassados ao repository', async () => {
    exerciseRepository.list.mockResolvedValue([squat]);

    const res = await request(app)
      .get('/exercises?group=Perna&q=leg')
      .set('Authorization', token('user-1'));

    expect(res.status).toBe(200);
    expect(exerciseRepository.list).toHaveBeenCalledWith('user-1', { group: 'Perna', q: 'leg' });
    expect(res.body).toEqual([
      {
        id: 'ex-1',
        name: 'Leg Press',
        primaryGroup: { id: 'g-1', name: 'Perna' },
        relatedGroups: [{ id: 'g-2', name: 'Quadríceps' }],
        lastEntry: null,
        isCatalog: true,
      },
    ]);
  });

  it('a listagem é pedida com o usuário do token, e a resposta não expõe o dono', async () => {
    exerciseRepository.list.mockResolvedValue([{ ...squat, createdById: 'user-1' }]);

    const res = await request(app).get('/exercises').set('Authorization', token('user-1'));

    expect(exerciseRepository.list).toHaveBeenCalledWith('user-1', { group: undefined, q: undefined });
    expect(res.body[0]).not.toHaveProperty('createdById');
  });

  it('isCatalog separa o exercício padrão do exercício próprio', async () => {
    exerciseRepository.list.mockResolvedValue([
      squat,
      { ...squat, id: 'ex-2', name: 'Minha rosca', createdById: 'user-1' },
    ]);

    const res = await request(app).get('/exercises').set('Authorization', token('user-1'));

    expect(res.body.map((e) => [e.name, e.isCatalog])).toEqual([
      ['Leg Press', true],
      ['Minha rosca', false],
    ]);
  });

  it('exercício de outro usuário: 404 ao registrar e ao consultar o histórico', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue(null);

    const post = await request(app)
      .post(url)
      .set('Authorization', token('user-2'))
      .send({ sets: 3, reps: 12, weightKg: 80 });
    const get = await request(app).get(url).set('Authorization', token('user-2'));

    expect(post.status).toBe(404);
    expect(get.status).toBe(404);
    expect(exerciseRepository.findVisibleById).toHaveBeenCalledWith(exerciseId, 'user-2');
    expect(entryRepository.create).not.toHaveBeenCalled();
  });

  it('devolve a última série do usuário em lastEntry', async () => {
    const performedAt = new Date('2026-11-03T18:30:00Z');
    exerciseRepository.list.mockResolvedValue([
      { ...squat, entries: [{ id: 'e-1', userId: 'user-1', sets: 3, reps: 12, weightKg: 90, performedAt }] },
    ]);

    const res = await request(app).get('/exercises').set('Authorization', token('user-1'));

    expect(res.body[0].lastEntry).toEqual({
      sets: 3,
      reps: 12,
      weightKg: 90,
      performedAt: performedAt.toISOString(),
    });
  });

  it('400 com filtro vazio', async () => {
    const res = await request(app).get('/exercises?q=').set('Authorization', token());

    expect(res.status).toBe(400);
  });
});

describe('GET /exercises/:id/stats', () => {
  const statsUrl = `/exercises/${exerciseId}/stats`;

  it('401 sem token', async () => {
    expect((await request(app).get(statsUrl)).status).toBe(401);
  });

  it('200 devolve recordes e 1RM calculados no servidor', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue({ id: exerciseId });
    entryRepository.listByUserAndExercise.mockResolvedValue([
      { id: 'e-1', sets: 3, reps: 8, weightKg: 80, performedAt: new Date('2026-11-01') },
      { id: 'e-2', sets: 3, reps: 8, weightKg: 85, performedAt: new Date('2026-11-03') },
    ]);

    const res = await request(app).get(statsUrl).set('Authorization', token('user-1'));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ entryCount: 2, maxWeight: 85, maxReps: 8, maxVolume: 2040 });
    expect(res.body.oneRepMax).toMatchObject({ value: 107.7, change: 6.4 });
    expect(res.body.oneRepMax.loadTable[0]).toEqual({ pct: 95, reps: 2, weightKg: 102.5 });
    expect(entryRepository.listByUserAndExercise).toHaveBeenCalledWith('user-1', exerciseId);
  });

  it('200 sem registros: tudo nulo', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue({ id: exerciseId });
    entryRepository.listByUserAndExercise.mockResolvedValue([]);

    const res = await request(app).get(statsUrl).set('Authorization', token());

    expect(res.body).toEqual({
      entryCount: 0,
      maxWeight: null,
      maxReps: null,
      maxVolume: null,
      oneRepMax: null,
      oneRepMaxRepLimit: 20,
    });
  });

  it('404 quando o exercício não é visível ao usuário', async () => {
    exerciseRepository.findVisibleById.mockResolvedValue(null);

    const res = await request(app).get(statsUrl).set('Authorization', token());

    expect(res.status).toBe(404);
    expect(entryRepository.listByUserAndExercise).not.toHaveBeenCalled();
  });
});
