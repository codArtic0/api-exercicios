import rateLimit from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;

// Limita tentativas por IP nas rotas de autenticação (força bruta de senha).
// AUTH_RATE_LIMIT_MAX permite ajustar o teto sem mexer no código (padrão: 10 a cada 15 min).
// Nos testes o limite fica desligado, exceto quando RATE_LIMIT_TEST=1.
export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: () => Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_TEST !== '1',
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Muitas tentativas. Tente novamente em alguns minutos.',
        details: null,
      },
    });
  },
});
