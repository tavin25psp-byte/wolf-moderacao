const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares essenciais
app.use(express.json());
app.use(cors());

// 2. Servir os arquivos estáticos (index.html, style.css, etc.) da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// 3. Rate Limiter (Proteção contra abusos na API de denúncias)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { sucesso: false, mensagem: 'Muitas requisições originadas deste IP. Tente novamente em 15 minutos.' }
});
app.use('/api/denuncias', limiter);

// 4. Fila de processamento em memória
const filaProcessamento = [];

// Rota de verificação de status da API (Health Check)
app.get('/api/health', (req, res) =>
