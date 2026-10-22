import 'dotenv/config';
import express from 'express'
const app = express()
const port = process.env.PORT;


app.get('/', (req, res) => {
  res.send('Servidor rodando com sucesso!');
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

