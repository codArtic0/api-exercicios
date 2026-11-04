import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import prisma from './configs/prisma.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Atrás do proxy do Render/Vercel o IP real vem em X-Forwarded-For; sem isso o rate limit
// contaria o IP do proxy (todos os usuários juntos).
app.set('trust proxy', 1);

app.use(express.json());
app.use(helmet());
// CORS_ORIGIN aceita várias origens separadas por vírgula (ex.: localhost e o IP do PC na rede).
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Usado pelo Render para saber se a API está viva: confirma também que o banco responde.
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ message: 'Saudável' });
  } catch (err) {
    console.error('Health check: banco indisponível', err.message);
    return res.status(503).json({
      error: { code: 'DB_UNAVAILABLE', message: 'Banco de dados indisponível', details: null },
    });
  }
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;