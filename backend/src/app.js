import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
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

app.get('/health', (req, res) => {
  return res.status(200).json({
    message: "Saudável"
  })
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;