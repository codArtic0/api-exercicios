import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../configs/prisma.js', () => ({ default: {} }));
vi.mock('../repositories/user.repository.js', () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
}));

let app;
let userRepository;

beforeAll(async () => {
  process.env.JWT_SECRET = 'segredo-de-teste';
  process.env.RATE_LIMIT_TEST = '1';
  process.env.AUTH_RATE_LIMIT_MAX = '3';
  userRepository = await import('../repositories/user.repository.js');
  ({ default: app } = await import('../app.js'));
});

beforeEach(() => {
  userRepository.findByEmail.mockResolvedValue(null);
});

describe('rate limit de autenticação', () => {
  it('bloqueia com 429 depois do teto de tentativas por IP', async () => {
    const credentials = { email: 'raul@teste.com', password: 'senha-errada' };
    const ip = '203.0.113.7';

    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/auth/login').set('X-Forwarded-For', ip).send(credentials);
      expect(res.status).toBe(401);
    }

    const blocked = await request(app).post('/auth/login').set('X-Forwarded-For', ip).send(credentials);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.headers['ratelimit']).toBeDefined();
  });

  it('conta por IP: outro IP não é afetado', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '198.51.100.9')
      .send({ email: 'ana@teste.com', password: 'senha-errada' });

    expect(res.status).toBe(401);
  });

  it('o cadastro compartilha o mesmo limite do login', async () => {
    const ip = '203.0.113.7';
    const res = await request(app)
      .post('/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ name: 'Raul', email: 'raul@teste.com', password: '12345678' });

    expect(res.status).toBe(429);
  });
});
