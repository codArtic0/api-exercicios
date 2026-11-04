import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../configs/prisma.js', () => ({ default: {} }));
vi.mock('../repositories/user.repository.js', () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
}));

const SECRET = 'segredo-de-teste';
const body = { name: 'Raul', email: 'raul@teste.com', password: '12345678' };

let app;
let userRepository;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET;
  userRepository = await import('../repositories/user.repository.js');
  ({ default: app } = await import('../app.js'));
});

beforeEach(() => vi.resetAllMocks());

describe('POST /auth/register', () => {
  it('201 cria o usuário, grava o hash e nunca devolve a senha nem o hash', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (data) => ({
      id: 'u-1',
      createdAt: new Date('2026-11-03T00:00:00Z'),
      ...data,
    }));

    const res = await request(app).post('/auth/register').send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 'u-1',
      name: 'Raul',
      email: 'raul@teste.com',
      createdAt: '2026-11-03T00:00:00.000Z',
    });
    const saved = userRepository.create.mock.calls[0][0];
    expect(saved.passwordHash).not.toBe(body.password);
    expect(await bcrypt.compare(body.password, saved.passwordHash)).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);
  });

  it('normaliza o email para minúsculas', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({ id: 'u-1', ...body });

    await request(app)
      .post('/auth/register')
      .send({ ...body, email: '  RAUL@Teste.COM ' });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('raul@teste.com');
  });

  it('409 quando o email já existe', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 'u-1' });

    const res = await request(app).post('/auth/register').send(body);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('409 quando o banco recusa por email duplicado (cadastro simultâneo)', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));

    const res = await request(app).post('/auth/register').send(body);

    expect(res.status).toBe(409);
  });

  it.each([
    ['senha curta', { ...body, password: '123' }],
    ['senha acima de 72 caracteres', { ...body, password: 'a'.repeat(73) }],
    ['email inválido', { ...body, email: 'nao-e-email' }],
    ['nome vazio', { ...body, name: '   ' }],
    ['sem senha', { name: 'Raul', email: 'raul@teste.com' }],
  ])('400 com %s', async (_nome, payload) => {
    const res = await request(app).post('/auth/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});

describe('POST /auth/login', () => {
  it('200 devolve um JWT cujo sub é o id do usuário', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'u-1',
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 4),
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: body.email, password: body.password });

    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.token, SECRET);
    expect(payload.sub).toBe('u-1');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('401 com senha errada e 401 com email inexistente têm a mesma resposta', async () => {
    userRepository.findByEmail.mockResolvedValueOnce({
      id: 'u-1',
      passwordHash: await bcrypt.hash(body.password, 4),
    });
    const wrongPassword = await request(app)
      .post('/auth/login')
      .send({ email: body.email, password: 'senha-errada' });

    userRepository.findByEmail.mockResolvedValueOnce(null);
    const unknownEmail = await request(app)
      .post('/auth/login')
      .send({ email: 'ninguem@teste.com', password: body.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('400 sem senha', async () => {
    const res = await request(app).post('/auth/login').send({ email: body.email });

    expect(res.status).toBe(400);
  });
});

describe('GET /auth/me', () => {
  it('401 sem token', async () => {
    const res = await request(app).get('/auth/me');

    expect(res.status).toBe(401);
  });

  it('200 com o usuário do token, sem hash', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'u-1',
      name: 'Raul',
      email: body.email,
      passwordHash: 'segredo',
      createdAt: new Date('2026-11-03T00:00:00Z'),
    });
    const token = jwt.sign({}, SECRET, { subject: 'u-1' });

    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('u-1');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('401 quando o usuário do token não existe mais', async () => {
    userRepository.findById.mockResolvedValue(null);
    const token = jwt.sign({}, SECRET, { subject: 'apagado' });

    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
