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
app.get('/api/health', (req, res) => {
  res.json({ status: 'Online', mensagem: 'API do Wolf Moderação operando normalmente.' });
});

// Rota POST principal para recepção de lotes
app.post('/api/denuncias', (req, res) => {
  try {
    const { numero, categoria, quantidade } = req.body;

    if (!numero || !categoria || !quantidade) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Parâmetros obrigatórios ausentes: numero, categoria e quantidade.'
      });
    }

    const qtdeNumerica = parseInt(quantidade, 10);
    if (isNaN(qtdeNumerica) || qtdeNumerica < 1 || qtdeNumerica > 20) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'A quantidade deve ser um número inteiro entre 1 e 20.'
      });
    }

    const jobId = 'job_' + Date.now();
    const novaTarefa = {
      id: jobId,
      numero: String(numero).trim(),
      categoria,
      quantidade: qtdeNumerica,
      status: 'PROCESSANDO',
      criadoEm: new Date()
    };

    filaProcessamento.push(novaTarefa);
    processarLoteEmBackground(novaTarefa);

    return res.status(202).json({
      sucesso: true,
      mensagem: 'Lote aceito para processamento.',
      jobId: jobId,
      status: 'PROCESSANDO'
    });

  } catch (erro) {
    console.error('Erro interno no servidor:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao processar a requisição.'
    });
  }
});

function processarLoteEmBackground(tarefa) {
  let concluidos = 0;
  const intervalo = setInterval(() => {
    concluidos++;
    console.log(`[Job ${tarefa.id}] Processando item ${concluidos} de ${tarefa.quantidade} para ${tarefa.numero}...`);

    if (concluidos >= tarefa.quantidade) {
      clearInterval(intervalo);
      tarefa.status = 'CONCLUIDO';
      console.log(`[Job ${tarefa.id}] Lote finalizado com sucesso.`);
    }
  }, 500);
}

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
