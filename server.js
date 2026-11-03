const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// 👇 ADICIONE ISSO: Faz o Express servir os arquivos da pasta 'public' (HTML, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// O restante das suas rotas de API continua aqui...
app.post('/api/denuncias', (req, res) => {
  // sua lógica de denúncias...
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
