import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError, notFound, errorHandler } from './error.middleware.js';
import { validate } from './validate.middleware.js';
import { auth } from './auth.middleware.js';

const SECRET = 'segredo-de-teste';

const makeApp = (setup) => {
  const app = express();
  app.use(express.json());
  setup(app);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};

describe('error.middleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('AppError vira a resposta padrão com status, code, message e details', async () => {
    const app = makeApp((a) =>
      a.get('/x', () => {
        throw new AppError(409, 'EMAIL_IN_USE', 'Email já cadastrado', [{ field: 'email' }]);
      }),
    );

    const res = await request(app).get('/x');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'EMAIL_IN_USE', message: 'Email já cadastrado', details: [{ field: 'email' }] },
    });
  });

  it('erro assíncrono também cai no handler (Express 5)', async () => {
    const app = makeApp((a) =>
      a.get('/x', async () => {
        throw new AppError(404, 'X', 'não achei');
      }),
    );

    const res = await request(app).get('/x');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('X');
  });

  it('erro inesperado em desenvolvimento vira 500 com o stack em details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');
    const app = makeApp((a) =>
      a.get('/x', () => {
        throw new Error('boom');
      }),
    );

    const res = await request(app).get('/x');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.details).toContain('boom');
  });

  it('erro inesperado em produção não vaza stack nem a mensagem original', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    const app = makeApp((a) =>
      a.get('/x', () => {
        throw new Error('senha do banco: 123');
      }),
    );

    const res = await request(app).get('/x');

    expect(res.status).toBe(500);
    expect(res.body.error.details).toBeNull();
    expect(JSON.stringify(res.body)).not.toContain('senha do banco');
  });
});

describe('validate.middleware', () => {
  const schema = z.object({
    params: z.object({ id: z.uuid() }),
    body: z.object({ n: z.number().int() }),
  });

  const app = makeApp((a) =>
    a.post('/items/:id', validate(schema), (req, res) => res.json({ body: req.body })),
  );
  const id = '3f9c1d2e-5b7a-4c8d-9e0f-1a2b3c4d5e6f';

  it('deixa passar entrada válida', async () => {
    const res = await request(app).post(`/items/${id}`).send({ n: 2 });

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ n: 2 });
  });

  it('remove campos que o schema não conhece', async () => {
    const res = await request(app).post(`/items/${id}`).send({ n: 2, userId: 'invasor' });

    expect(res.body.body).toEqual({ n: 2 });
  });

  it('entrada inválida responde 400 VALIDATION_ERROR com a lista de problemas', async () => {
    const res = await request(app).post(`/items/${id}`).send({ n: 'x' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toEqual(['body', 'n']);
  });

  it('params inválido responde 400', async () => {
    const res = await request(app).post('/items/123').send({ n: 2 });

    expect(res.status).toBe(400);
  });

  it('requisição sem corpo responde 400, não 500', async () => {
    const res = await request(app).post(`/items/${id}`);

    expect(res.status).toBe(400);
  });
});

describe('auth.middleware', () => {
  const app = makeApp((a) => a.get('/me', auth, (req, res) => res.json(req.user)));
  const sign = (payload = { sub: 'user-1' }, secret = SECRET, options = {}) =>
    jwt.sign(payload, secret, options);

  beforeEach(() => vi.stubEnv('JWT_SECRET', SECRET));
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('token válido preenche req.user com o sub', async () => {
    const res = await request(app).get('/me').set('Authorization', `Bearer ${sign()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'user-1' });
  });

  it.each([
    ['sem cabeçalho', undefined],
    ['esquema errado', 'Basic abc'],
    ['Bearer sem token', 'Bearer'],
    ['token lixo', 'Bearer abc.def.ghi'],
  ])('401 %s', async (_nome, header) => {
    const req = request(app).get('/me');
    if (header) req.set('Authorization', header);

    const res = await req;

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('401 com assinatura de outro segredo', async () => {
    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${sign({ sub: 'user-1' }, 'outro-segredo')}`);

    expect(res.status).toBe(401);
  });

  it('401 com token expirado', async () => {
    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${sign({ sub: 'user-1' }, SECRET, { expiresIn: -10 })}`);

    expect(res.status).toBe(401);
  });

  it('401 com algoritmo diferente de HS256', async () => {
    const token = jwt.sign({ sub: 'user-1' }, SECRET, { algorithm: 'HS512' });

    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('401 para token alg=none', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'user-1' })}.`;

    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('sem JWT_SECRET configurado é erro do servidor (500), não 401', async () => {
    vi.stubEnv('JWT_SECRET', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/me').set('Authorization', `Bearer ${sign()}`);

    expect(res.status).toBe(500);
  });
});
