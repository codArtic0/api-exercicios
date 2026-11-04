import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';

const queryRaw = vi.fn();
vi.mock('./configs/prisma.js', () => ({ default: { $queryRaw: (...args) => queryRaw(...args) } }));

const ORIGIN = 'http://localhost:5173';
let app;

beforeAll(async () => {
  process.env.CORS_ORIGIN = ORIGIN;
  ({ default: app } = await import('./app.js'));
});

describe('GET /health', () => {
  beforeEach(() => queryRaw.mockResolvedValue([{ '?column?': 1 }]));

  it('responde 200 com a mensagem de saúde', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Saudável' });
  });
});

describe('GET /health com o banco fora do ar', () => {
  it('responde 503 no formato padrão sem vazar detalhes', async () => {
    queryRaw.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:5432'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: { code: 'DB_UNAVAILABLE', message: 'Banco de dados indisponível', details: null },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|10\.0\.0\.1/);
    spy.mockRestore();
  });
});

describe('helmet', () => {
  it('define cabeçalhos de segurança e esconde o X-Powered-By', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('cors', () => {
  it('libera a origem configurada', async () => {
    const res = await request(app).get('/health').set('Origin', ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
  });

  it('não libera outra origem', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://outro-site.com');

    expect(res.headers['access-control-allow-origin']).not.toBe('https://outro-site.com');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });

  it('responde o preflight permitindo Authorization', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', ORIGIN)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-headers']).toMatch(/Authorization/i);
  });
});

describe('erros', () => {
  it('rota inexistente responde 404 no formato padrão', async () => {
    const res = await request(app).get('/nao-existe');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada', details: null },
    });
  });

  it('JSON malformado responde 400 no formato padrão', async () => {
    const res = await request(app)
      .post('/exercises/3f9c1d2e-5b7a-4c8d-9e0f-1a2b3c4d5e6f/entries')
      .set('Content-Type', 'application/json')
      .send('{"sets": 3,');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});
