import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
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
const EX1 = '8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const EX2 = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

let app;
let exerciseRepository;
let workoutRepository;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET;
  exerciseRepository = await import('../repositories/exercise.repository.js');
  workoutRepository = await import('../repositories/workout.repository.js');
  ({ default: app } = await import('../app.js'));
});

beforeEach(() => vi.resetAllMocks());

const row = (overrides = {}) => ({
  id: WID,
  name: 'Treino A',
  sessions: [],
  items: [
    {
      id: 'i-1',
      position: 0,
      sets: 3,
      reps: 12,
      weightKg: 60,
      exercise: { id: EX1, name: 'Agachamento livre', primaryGroup: { id: 'g-1', name: 'Perna' } },
    },
  ],
  ...overrides,
});

const body = {
  name: 'Treino A',
  items: [
    { exerciseId: EX1, sets: 3, reps: 12, weightKg: 60 },
    { exerciseId: EX2, sets: 3, reps: 10, weightKg: 120 },
  ],
};

describe('GET /workouts', () => {
  it('401 sem token', async () => {
    expect((await request(app).get('/workouts')).status).toBe(401);
  });

  it('200 lista os treinos do usuário com os exercícios e a data do último treino feito', async () => {
    const finishedAt = new Date('2026-11-03T10:00:00Z');
    workoutRepository.list.mockResolvedValue([row({ sessions: [{ finishedAt }] })]);

    const res = await request(app).get('/workouts').set('Authorization', token('user-1'));

    expect(res.status).toBe(200);
    expect(workoutRepository.list).toHaveBeenCalledWith('user-1');
    expect(res.body).toEqual([
      {
        id: WID,
        name: 'Treino A',
        exerciseCount: 1,
        plannedSets: 3,
        plannedVolume: 2160,
        items: [
          {
            id: 'i-1',
            exercise: { id: EX1, name: 'Agachamento livre', primaryGroup: { id: 'g-1', name: 'Perna' } },
            sets: 3,
            reps: 12,
            weightKg: 60,
          },
        ],
        lastSessionAt: finishedAt.toISOString(),
      },
    ]);
  });

  it('lastSessionAt é null quando o treino nunca foi feito', async () => {
    workoutRepository.list.mockResolvedValue([row()]);

    const res = await request(app).get('/workouts').set('Authorization', token());

    expect(res.body[0].lastSessionAt).toBeNull();
  });
});

describe('POST /workouts', () => {
  it('201 cria o modelo para o usuário do token', async () => {
    workoutRepository.findByName.mockResolvedValue(null);
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }, { id: EX2 }]);
    workoutRepository.create.mockResolvedValue(row());

    const res = await request(app).post('/workouts').set('Authorization', token('user-1')).send(body);

    expect(res.status).toBe(201);
    expect(workoutRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Treino A',
      items: body.items,
    });
    expect(exerciseRepository.findVisibleByIds).toHaveBeenCalledWith([EX1, EX2], 'user-1');
  });

  it('201 aceita o mesmo exercício em blocos com pesos diferentes, na ordem enviada', async () => {
    const items = [
      { exerciseId: EX1, sets: 1, reps: 12, weightKg: 20 },
      { exerciseId: EX1, sets: 3, reps: 8, weightKg: 40 },
    ];
    workoutRepository.findByName.mockResolvedValue(null);
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }]);
    workoutRepository.create.mockResolvedValue(row());

    const res = await request(app).post('/workouts').set('Authorization', token()).send({ name: 'A', items });

    expect(res.status).toBe(201);
    expect(workoutRepository.create.mock.calls[0][0].items).toEqual(items);
    expect(exerciseRepository.findVisibleByIds).toHaveBeenCalledWith([EX1], 'user-1');
  });

  it('o dono vem do token, nunca do corpo', async () => {
    workoutRepository.findByName.mockResolvedValue(null);
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }, { id: EX2 }]);
    workoutRepository.create.mockResolvedValue(row());

    await request(app)
      .post('/workouts')
      .set('Authorization', token('user-1'))
      .send({ ...body, userId: 'invasor' });

    expect(workoutRepository.create.mock.calls[0][0].userId).toBe('user-1');
  });

  it('409 WORKOUT_EXISTS quando o nome já existe', async () => {
    workoutRepository.findByName.mockResolvedValue({ id: 'outro' });

    const res = await request(app).post('/workouts').set('Authorization', token()).send(body);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('WORKOUT_EXISTS');
    expect(workoutRepository.create).not.toHaveBeenCalled();
  });

  it('409 quando o banco recusa por nome duplicado (cadastro simultâneo)', async () => {
    workoutRepository.findByName.mockResolvedValue(null);
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }, { id: EX2 }]);
    workoutRepository.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));

    const res = await request(app).post('/workouts').set('Authorization', token()).send(body);

    expect(res.status).toBe(409);
  });

  it('400 EXERCISE_NOT_FOUND quando algum exercício não é visível ao usuário', async () => {
    workoutRepository.findByName.mockResolvedValue(null);
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }]);

    const res = await request(app).post('/workouts').set('Authorization', token()).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EXERCISE_NOT_FOUND');
    expect(workoutRepository.create).not.toHaveBeenCalled();
  });

  it.each([
    ['sem nome', { items: body.items }],
    ['nome só com espaços', { ...body, name: '   ' }],
    ['sem exercícios', { name: 'A', items: [] }],
    ['peso com duas casas', { name: 'A', items: [{ exerciseId: EX1, sets: 3, reps: 12, weightKg: 60.55 }] }],
    ['séries zero', { name: 'A', items: [{ exerciseId: EX1, sets: 0, reps: 12, weightKg: 60 }] }],
    ['exerciseId que não é UUID', { name: 'A', items: [{ exerciseId: '1', sets: 3, reps: 12, weightKg: 60 }] }],
    ['treino com exercícios demais', { name: 'A', items: Array(61).fill(body.items[0]) }],
  ])('400 com %s', async (_nome, payload) => {
    const res = await request(app).post('/workouts').set('Authorization', token()).send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(workoutRepository.create).not.toHaveBeenCalled();
  });
});

describe('GET /workouts/:id', () => {
  it('200 devolve o modelo do usuário', async () => {
    workoutRepository.findById.mockResolvedValue(row());

    const res = await request(app).get(`/workouts/${WID}`).set('Authorization', token('user-1'));

    expect(res.status).toBe(200);
    expect(workoutRepository.findById).toHaveBeenCalledWith(WID, 'user-1');
    expect(res.body.name).toBe('Treino A');
  });

  it('404 quando o treino não existe ou é de outro usuário', async () => {
    workoutRepository.findById.mockResolvedValue(null);

    const res = await request(app).get(`/workouts/${WID}`).set('Authorization', token('user-2'));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('WORKOUT_NOT_FOUND');
  });

  it('400 com id que não é UUID', async () => {
    expect((await request(app).get('/workouts/123').set('Authorization', token())).status).toBe(400);
  });
});

describe('PUT /workouts/:id (editar o modelo)', () => {
  it('200 troca nome e exercícios', async () => {
    workoutRepository.findById.mockResolvedValue(row());
    workoutRepository.findByName.mockResolvedValue(null);
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }]);
    workoutRepository.update.mockResolvedValue(row({ name: 'Treino A+' }));
    const edited = { name: 'Treino A+', items: [{ exerciseId: EX1, sets: 4, reps: 10, weightKg: 70 }] };

    const res = await request(app).put(`/workouts/${WID}`).set('Authorization', token()).send(edited);

    expect(res.status).toBe(200);
    expect(workoutRepository.update).toHaveBeenCalledWith(WID, edited);
    expect(res.body.name).toBe('Treino A+');
  });

  it('manter o próprio nome não é conflito', async () => {
    workoutRepository.findById.mockResolvedValue(row());
    workoutRepository.findByName.mockResolvedValue({ id: WID });
    exerciseRepository.findVisibleByIds.mockResolvedValue([{ id: EX1 }, { id: EX2 }]);
    workoutRepository.update.mockResolvedValue(row());

    const res = await request(app).put(`/workouts/${WID}`).set('Authorization', token()).send(body);

    expect(res.status).toBe(200);
  });

  it('409 quando o novo nome é de outro treino do usuário', async () => {
    workoutRepository.findById.mockResolvedValue(row());
    workoutRepository.findByName.mockResolvedValue({ id: 'outro-treino' });

    const res = await request(app).put(`/workouts/${WID}`).set('Authorization', token()).send(body);

    expect(res.status).toBe(409);
    expect(workoutRepository.update).not.toHaveBeenCalled();
  });

  it('404 em treino de outro usuário, sem alterar nada', async () => {
    workoutRepository.findById.mockResolvedValue(null);

    const res = await request(app).put(`/workouts/${WID}`).set('Authorization', token('user-2')).send(body);

    expect(res.status).toBe(404);
    expect(workoutRepository.update).not.toHaveBeenCalled();
  });

  it('400 com corpo inválido', async () => {
    const res = await request(app)
      .put(`/workouts/${WID}`)
      .set('Authorization', token())
      .send({ name: 'A', items: [] });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /workouts/:id', () => {
  it('204 apaga o modelo do usuário', async () => {
    workoutRepository.findById.mockResolvedValue(row());
    workoutRepository.remove.mockResolvedValue({});

    const res = await request(app).delete(`/workouts/${WID}`).set('Authorization', token());

    expect(res.status).toBe(204);
    expect(workoutRepository.remove).toHaveBeenCalledWith(WID);
  });

  it('404 em treino de outro usuário, sem apagar', async () => {
    workoutRepository.findById.mockResolvedValue(null);

    const res = await request(app).delete(`/workouts/${WID}`).set('Authorization', token('user-2'));

    expect(res.status).toBe(404);
    expect(workoutRepository.remove).not.toHaveBeenCalled();
  });

  it('401 sem token', async () => {
    expect((await request(app).delete(`/workouts/${WID}`)).status).toBe(401);
  });
});
