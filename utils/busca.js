function normalize(texto) {
  return texto.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();
}

function encontrarJogoPorNome(nomeBuscado, jogos) {
  const buscaNormalizada = normalize(nomeBuscado);
  return Object.values(jogos).filter(jogo =>
    normalize(jogo.nome).includes(buscaNormalizada)
  );
}

module.exports = { encontrarJogoPorNome };