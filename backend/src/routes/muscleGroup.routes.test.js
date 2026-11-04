import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../configs/prisma.js', () => ({ default: {} }));
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
let muscleGroupRepository;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET;
  muscleGroupRepository = await import('../repositories/muscleGroup.repository.js');
  ({ default: app } = await import('../app.js'));
});

beforeEach(() => vi.resetAllMocks());

describe('GET /muscle-groups', () => {
  it('401 sem token', async () => {
    const res = await request(app).get('/muscle-groups');

    expect(res.status).toBe(401);
  });

  it('200 lista os grupos', async () => {
    muscleGroupRepository.list.mockResolvedValue([
      { id: PERNA, name: 'Perna' },
      { id: QUAD, name: 'Quadríceps' },
    ]);

    const res = await request(app).get('/muscle-groups').set('Authorization', token());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: PERNA, name: 'Perna' },
      { id: QUAD, name: 'Quadríceps' },
    ]);
  });
});

describe('POST /muscle-groups', () => {
  it('201 cria um grupo novo', async () => {
    muscleGroupRepository.findByName.mockResolvedValue(null);
    muscleGroupRepository.create.mockResolvedValue({ id: OMBRO, name: 'Trapézio' });

    const res = await request(app)
      .post('/muscle-groups')
      .set('Authorization', token())
      .send({ name: '  Trapézio ' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: OMBRO, name: 'Trapézio' });
    expect(muscleGroupRepository.create).toHaveBeenCalledWith('Trapézio');
  });

  it('200 devolve o grupo existente em vez de duplicar (sem diferenciar maiúsculas)', async () => {
    muscleGroupRepository.findByName.mockResolvedValue({ id: PERNA, name: 'Perna' });

    const res = await request(app)
      .post('/muscle-groups')
      .set('Authorization', token())
      .send({ name: 'perna' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: PERNA, name: 'Perna' });
    expect(muscleGroupRepository.create).not.toHaveBeenCalled();
  });

  it('cadastro simultâneo (P2002) devolve o grupo que venceu a corrida', async () => {
    muscleGroupRepository.findByName
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: OMBRO, name: 'Trapézio' });
    muscleGroupRepository.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));

    const res = await request(app)
      .post('/muscle-groups')
      .set('Authorization', token())
      .send({ name: 'Trapézio' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(OMBRO);
  });

  it.each([
    ['nome vazio', { name: '  ' }],
    ['sem nome', {}],
    ['nome acima de 40 caracteres', { name: 'a'.repeat(41) }],
  ])('400 com %s', async (_nome, payload) => {
    const res = await request(app).post('/muscle-groups').set('Authorization', token()).send(payload);

    expect(res.status).toBe(400);
  });

  it('401 sem token', async () => {
    const res = await request(app).post('/muscle-groups').send({ name: 'X' });

    expect(res.status).toBe(401);
  });
});
