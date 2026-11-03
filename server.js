const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Proteção contra abuso (Rate Limiter)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { sucesso: false, mensagem: 'Muitas requisições. Tente novamente mais tarde.' }
});
app.use('/api/denuncias', limiter);

// Rota POST para processar e gerar os links de direcionamento em lote
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

    // Limpa o número para conter apenas dígitos (essencial para o wa.me)
    const numeroLimpo = numero.replace(/\D/g, '');
    const mensagemBase = encodeURIComponent(`Denúncia por violação de diretrizes - Categoria: ${categoria}`);
    
    const linksGerados = [];
    for (let i = 1; i <= qtdeNumerica; i++) {
      linksGerados.push({
        id: i,
        url: `https://wa.me/${numeroLimpo}?text=${mensagemBase}%20(Protocolo%20${i})`
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Lote processado com sucesso.',
      total: linksGerados.length,
      links: linksGerados
    });

  } catch (erro) {
    console.error('Erro interno:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
