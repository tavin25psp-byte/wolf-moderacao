const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// 👇 ADICIONE ESTA ROTA PARA EVITAR O ERRO "Cannot GET /"
app.get('/', (req, res) => {
  res.json({ 
    status: 'Online', 
    mensagem: 'API do Wolf Moderação rodando com sucesso!' 
  });
});

// O restante das suas rotas continua aqui...
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { sucesso: false, mensagem: 'Muitas requisições. Tente novamente mais tarde.' }
});
app.use('/api/denuncias', limiter);

app.post('/api/denuncias', (req, res) => {
  // ... sua lógica de denúncias ...
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
