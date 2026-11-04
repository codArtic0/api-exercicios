import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../configs/prisma.js', () => ({ default: {} }));
vi.mock('../repositories/exercise.repository.js', () => ({
  findOwnedById: vi.fn(),
  findOwnedByName: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
}));
vi.mock('../repositories/muscleGroup.repository.js', () => ({
  list: vi.fn(),
  findByIds: vi.fn(),
  findByName: vi.fn(),
  create: vi.fn(),
}));

const SECRET = 'segredo-de-teste';
const token = (sub = 'user-1') => `Bearer ${jwt.sign({ sub }, SECRET)}`;
const PERNA = '3f9c1d2e-5b7a-4c8d-9e0f-1a2b3c4d5e6f';
const QUAD = '8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const OMBRO = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

let app;
let exerciseRepository;
let muscleGroupRepository;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET;
  exerciseRepository = await import('../repositories/exercise.repository.js');
  muscleGroupRepository = await import('../repositories/muscleGroup.repository.js');
  ({ default: app } = await import('../app.js'));
});

beforeEach(() => vi.resetAllMocks());

const created = (overrides = {}) => ({
  id: 'ex-9',
  name: 'Cadeira extensora',
  createdById: 'user-1',
  primaryGroup: { id: PERNA, name: 'Perna' },
  related: [{ muscleGroup: { id: QUAD, name: 'Quadríceps' } }],
  entries: [],
  ...overrides,
});

describe('POST /exercises', () => {
  const body = { name: 'Cadeira extensora', primaryGroupId: PERNA, relatedGroupIds: [QUAD] };

  it('401 sem token', async () => {
    const res = await request(app).post('/exercises').send(body);

    expect(res.status).toBe(401);
  });

  it('201 cria o exercício do usuário com os grupos relacionados', async () => {
    muscleGroupRepository.findByIds.mockResolvedValue([{ id: PERNA }, { id: QUAD }]);
    exerciseRepository.findOwnedByName.mockResolvedValue(null);
    exerciseRepository.create.mockResolvedValue(created());

    const res = await request(app).post('/exercises').set('Authorization', token()).send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 'ex-9',
      name: 'Cadeira extensora',
      primaryGroup: { id: PERNA, name: 'Perna' },
      relatedGroups: [{ id: QUAD, name: 'Quadríceps' }],
      lastEntry: null,
    });
    expect(exerciseRepository.create).toHaveBeenCalledWith({
      name: 'Cadeira extensora',
      primaryGroupId: PERNA,
      relatedGroupIds: [QUAD],
      createdById: 'user-1',
    });
  });

  it('o dono vem do token, nunca do body', async () => {
    muscleGroupRepository.findByIds.mockResolvedValue([{ id: PERNA }]);
    exerciseRepository.findOwnedByName.mockResolvedValue(null);
    exerciseRepository.create.mockResolvedValue(created());

    await request(app)
      .post('/exercises')
      .set('Authorization', token('user-1'))
      .send({ name: 'X', primaryGroupId: PERNA, createdById: null });

    expect(exerciseRepository.create.mock.calls[0][0].createdById).toBe('user-1');
  });

  it('relatedGroupIds é opcional', async () => {
    muscleGroupRepository.findByIds.mockResolvedValue([{ id: PERNA }]);
    exerciseRepository.findOwnedByName.mockResolvedValue(null);
    exerciseRepository.create.mockResolvedValue(created({ related: [] }));

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', token())
      .send({ name: 'Leg Press', primaryGroupId: PERNA });

    expect(res.status).toBe(201);
    expect(exerciseRepository.create.mock.calls[0][0].relatedGroupIds).toEqual([]);
  });

  it('remove repetidos e o grupo principal dos relacionados', async () => {
    muscleGroupRepository.findByIds.mockResolvedValue([{ id: PERNA }, { id: QUAD }, { id: OMBRO }]);
    exerciseRepository.findOwnedByName.mockResolvedValue(null);
    exerciseRepository.create.mockResolvedValue(created());

    await request(app)
      .post('/exercises')
      .set('Authorization', token())
      .send({ name: 'X', primaryGroupId: PERNA, relatedGroupIds: [QUAD, QUAD, PERNA, OMBRO] });

    expect(muscleGroupRepository.findByIds).toHaveBeenCalledWith([PERNA, QUAD, OMBRO]);
    expect(exerciseRepository.create.mock.calls[0][0].relatedGroupIds).toEqual([QUAD, OMBRO]);
  });

  it('400 GROUP_NOT_FOUND quando algum grupo não existe', async () => {
    muscleGroupRepository.findByIds.mockResolvedValue([{ id: PERNA }]);

    const res = await request(app).post('/exercises').set('Authorization', token()).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('GROUP_NOT_FOUND');
    expect(exerciseRepository.create).not.toHaveBeenCalled();
  });

  it('409 EXERCISE_EXISTS quando o nome já existe para o usuário', async () => {
    muscleGroupRepository.findByIds.mockResolvedValue([{ id: PERNA }, { id: QUAD }]);
    exerciseRepository.findOwnedByName.mockResolvedValue({ id: 'ex-1' });

    const res = await request(app).post('/exercises').set('Authorization', token()).send(body);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EXERCISE_EXISTS');
    expect(exerciseRepository.create).not.toHaveBeenCalled();
  });

  it.each([
    ['sem nome', { primaryGroupId: PERNA }],
    ['nome só com espaços', { name: '   ', primaryGroupId: PERNA }],
    ['sem grupo principal', { name: 'X' }],
    ['grupo principal que não é UUID', { name: 'X', primaryGroupId: '123' }],
    ['relacionado que não é UUID', { name: 'X', primaryGroupId: PERNA, relatedGroupIds: ['abc'] }],
    ['relacionados demais', { name: 'X', primaryGroupId: PERNA, relatedGroupIds: Array(11).fill(QUAD) }],
  ])('400 %s', async (_nome, payload) => {
    const res = await request(app).post('/exercises').set('Authorization', token()).send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(exerciseRepository.create).not.toHaveBeenCalled();
  });
});
