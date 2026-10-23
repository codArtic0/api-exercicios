import express from 'express';
import helmet from 'helmet';
import cors from 'cors'

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/health', (req, res) => {
  return res.status(200).json({
    message: "Saudável"
  })
});

export default app;