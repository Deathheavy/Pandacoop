const fs = require('fs');
const path = require('path');

const caminhoJogos = path.join(__dirname, '..', 'jogos.json'); // caminho do arquivo

// Função para salvar jogos — recebe o objeto jogos como parâmetro!
function salvarJogos(jogos) {
  fs.writeFileSync(caminhoJogos, JSON.stringify(jogos, null, 2), 'utf-8');
}

// Função para normalizar texto
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();
}

// Função para adicionar jogo direto do Discord
function adicionarJogo(message, msg, jogos) {
  const canalPermitido = 'IDCANAL'; // ADICIONAR ID DO CANAL ONDE OS ARQUIVOS SÃO ENVIADOS!
  if (message.channel.id !== canalPermitido) return;

  const arquivos = message.attachments;

  if (arquivos && arquivos.size > 0) {
    const nome = msg || `Jogo ${Date.now()}`;
    const chave = normalize(nome);
    const arquivo = arquivos.first();
    const link = arquivo.url;

    if (!jogos[chave]) {
      jogos[chave] = { nome, link };
      salvarJogos(jogos);
      console.log(`Jogo adicionado: ${nome}`);
    } else {
      console.log(`Jogo já existe: ${nome}`);
    }
  }
}

module.exports = { adicionarJogo };
