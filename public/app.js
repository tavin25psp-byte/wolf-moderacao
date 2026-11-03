const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais de segurança e formatação
app.use(express.json());
app.use(cors()); // Permite requisições do seu front-end (GitHub Pages, Netlify, etc.)

// Proteção contra abuso (Rate Limiter: máximo de 10 requisições por IP a cada 15 minutos)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas requisições originadas deste IP. Tente novamente mais tarde.' }
});
app.use('/api/denuncias', limiter);

// Simulação de banco de dados ou fila de processamento assíncrono
const filaProcessamento = [];

// Rota POST para receber o lote de denúncias
app.post('/api/denuncias', async (req, res) => {
  try {
    const { numero, categoria, quantidade } = req.body;

    // 1. Validação estrita de dados
    if (!numero || !categoria || !quantidade) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Parâmetros obrigatórios ausentes: numero, categoria e quantidade.' 
      });
    }

    // Validação de limites seguros (ex: máximo de 20 por lote)
    const qtdeNumerica = parseInt(quantidade, 10);
    if (isNaN(qtdeNumerica) || qtdeNumerica < 1 || qtdeNumerica > 20) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'A quantidade deve ser um número inteiro entre 1 e 20.' 
      });
    }

    // 2. Criação do ID único para a tarefa
    const jobId = 'job_' + Date.now();
    
    const novaTarefa = {
      id: jobId,
      numero,
      categoria,
      quantidade: qtdeNumerica,
      status: 'PROCESSANDO',
      criadoEm: new Date()
    };

    // Adiciona na fila (em produção, aqui você usaria Redis + BullMQ ou RabbitMQ)
    filaProcessamento.push(novaTarefa);

    // 3. Processamento assíncrono simulado em background
    processarLoteEmBackground(novaTarefa);

    // 4. Retorna a resposta imediata de sucesso ao cliente (Assíncrono)
    return res.status(202).json({
      sucesso: true,
      mensagem: `Lote aceito para processamento.`,
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

// Função que simula o trabalho pesado em background (trabalho assíncrono)
function processarLoteEmBackground(tarefa) {
  let concluidos = 0;
  
  const intervalo = setInterval(() => {
    concluidos++;
    console.log(`[Job ${tarefa.id}] Processando item ${concluidos} de ${tarefa.quantidade} para o número ${tarefa.numero}...`);

    if (concluidos >= tarefa.quantidade) {
      clearInterval(intervalo);
      tarefa.status = 'CONCLUIDO';
      console.log(`[Job ${tarefa.id}] Lote finalizado com sucesso.`);
    }
  }, 500); // 500ms por item simulado
}

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em produção na porta ${PORT}`);
});
