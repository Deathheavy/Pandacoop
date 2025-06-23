require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  ActivityType,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');

// import dos .json
const caminhoJogos = path.join(__dirname, 'jogos.json');
const caminhoLancamentos = path.join(__dirname, 'lancamentos.json');

// Cooldown aplicado no comando !lista
const cooldowns = new Map();
const COOLDOWN_TEMPO = 6 * 60 * 60 * 1000; // 6 horas de cooldown

// utils/busca.js para o comando !<nomedojogo>
const { encontrarJogoPorNome } = require('./utils/busca');

// para o comando !info <nomedojogo> busca na steam
const { handleInfoCommand } = require('./utils/infoCommand');

// !sobre o bot
const { handleSobreCommand } = require('./utils/sobreCommand');

// adicionar jogos direto do discord
const { adicionarJogo } = require('./utils/adicionarJogo');

// limpar chat
const { handleLimparCommand } = require('./utils/limparCommand');

// gameplay YT
const { handleGameplayCommand } = require('./utils/gameplayCommand');

// Atualiza o cache da lista de jogos
let cacheJogos = null;
let ultimaAtualizacao = 0;
const INTERVALO_RELOAD = 30 * 60 * 1000; // 30 minutos para recarregar o cache do .json

Object.defineProperty(global, 'jogos', {
  get() {
    const agora = Date.now();
    if (!cacheJogos || (agora - ultimaAtualizacao > INTERVALO_RELOAD)) {
      try {
        const data = fs.readFileSync(caminhoJogos, 'utf-8');
        cacheJogos = JSON.parse(data);
        ultimaAtualizacao = agora;
        console.log('♻️ Recarregando jogos.json...');
      } catch (err) {
        console.error('❌ Erro ao recarregar jogos.json:', err.message);
        cacheJogos = {};
      }
    }
    return cacheJogos;
  }
});

// Função para remover caracteres especiais, minúsculas etc
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();
}

// Função para carregar lançamentos
function carregarLancamentos() {
  try {
    const data = fs.readFileSync(caminhoLancamentos, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('❌ Erro ao ler o arquivo lancamentos.json:', err.message);
    return [];
  }
}
// discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// discord
client.once('ready', async () => {
  console.log(`
░░░░░░▒░░░░░░░░░░░░░░░░░░░░░▒░░░░▒▓█████████████▓▒▒░░░░░░░░░░░░░░░░░░░░░░░░
░░▒░░░░░░░░░░░░░░░░░░░░░░░░░░▒▓███▓▓▓███████████▓███▓▒░░░░░░░░░░░░░░▒░░░░░░
░░░░░░░░░░░░░▒▒▒▒▒▒░░░░░▒░▒▒███▓███████████████████▓▓██▒░░░░░░░░▒▒░░░░░░░░▒
░░░░░░░░▒▒▓█████████▓░░░▒▓██▓█████████▓▒▒░░░▒░▒███████▓█▓▒░░░░░░░░▒▒░░░░░░░
░░░░░░▒░▓█████████████▒▓██▓█████▒▒██▓░░░░░░░░░░░▓█████████▒░░░░░▒░░░▒░░▒░░░
░░░░░░▒█████████████████▓██████▒▒░▒█▒░▒▓▓▒░░░▒▒░░▓█▓░████▓█▓░▒▓▓▓▓▒░░░░░░▒░
░░░░░▒████████████████▓█████████████░▓████▒░▓███▓▒▓▓▓▓████▓█████████▓▒░░░░░
░░░░░▓██████████████▓███████████████▓▒▓██▓▒▒▓███▒▓█████████▓██████████▒░▒░░
░░░░░▓███████████▓▓███████████████████▒░░▒██▒░░▒████████████▓██████████▒░░░
░░░░░▓█████████▓███████████████████▓▒▓▓░░▒░░▒░▒▓▒██████████████████████▓░░░
░▒▒▒▒▓██████▓████████████████████▒░▒███▒▒▓▒▒▓▒▒██▒░▒███████████▓████████░░░
░▓███████████████████████████████████████████████▓▓████████████████████▓░░░
░▒█████████████████████████████████████████████████████████████████████▒░░░
░░▒███████████████████████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████████████████████████████▓▒
░░░▒██████████████████▓▓▓▒▒▓▓░░░▒░▒░░▒░▒▒▒░░▒▒▓▓▓▓▓▓▓█████████████████████▒
░░▒▒░▒█████████████▓▓▓▒░▒██████▓░░░░░░░▒░░░░░░░░░░▒▒░▒▒▓▓████████████████▒░
░░░░░░░▒▓█████████▓▒░░░░░▓████████▒░▒▒░░▓▓▒░▒▒▒░▒░░░▒█████▓████████████▒░░▒
░░░░▒░░▒░░▒▒▓███▓▒▒░░░░░▓██▓▒▓██████▓▒░░▒█▓░▒▓▒░░▒▓██████▓▓▓███████▓▒▒░░▒░░
░░░░░░░░░░░▓████▓▒▒▒░░░▒███▒░████▓▒███████▒▒▒█▓▓███▓█▓▓██▓░▒██▒▒░░▒░░▒░░░░░
░░░░░░░░▒▒▓████▓▓▒▒░░░▒▒███▓░▒██████▓██▓▓▒▒▒▒▓███████▒▒██▓░▒▒█▓░░░░░░░░░░░░
░░░░░░░░░░░▒████▓▒▒▒░░░▒█████▓▒░░░▒██▓▒▒░░░░░░▓█▓███▒▒███▓░▒███▓░░░░░░░░▒░░
░░░░░░▒░░░░▓████▓▒▒▒▒▒░░░▓█████████▓░░░░░░░░░░░▒██▓▓█████▒░░▓█▓▒▒░▒░░░░░░░░
░░░░░░░░▒▒▒░░▓██▓▓▒▒▒░░░░░░▒▓▓▓▓▓▒░░░▒░▓███████▒▒██████▒░░▒▓▒█▓░░▒░░░░░░░▒░
░░░▒░░░░▒▒░▒▓█████▓▓▒▒░▒░░░░░░░▒░░░░░░░░▒█████▓░░▒▓░▒▒░░░░▒▓██▓░░▒░░░░░░░░░
░░░░░░░░░▓█████████▓▓▓▒▒▒░░░░░░░░▒░░░░░░░░▒▓░░░░░░▒░░░▒▒▒▒██▓▓▒░▒░▒▒░▒░░▒░░
░░░░░░░▒██████████████▓▓▓▒▒░░░░░░░▒▓▓▓▒▒▒▒█▓▒░░░░░░░░░▒▓▓███▒░▒░░░░░░░░░░░░
░░░░░░▒███████████████████▓▓▓▒▒░░░▒░░░░░░░░░▒▓█░░░░▒▒▓████████▒░░░▒░▒▒░░░░▒
░▒░░▒▒▒███████████████████████▓█▓▒▒░░░░░▒▒░░░░░▒▓▓▓████████████▓▒░▒▒▒▒░░▒░░
░░░░░▒██████████████████████████████▓▓▒▒▒▒▒▒▓▓████████████████████▓▒▒░▒░░░░
░░░░▒███████████████████████████████████████████████████████████████▓▒░░▒▒░
`);
  client.user.setActivity({
    name: '!sobre | !ajuda',
    type: ActivityType.Playing
  });

  console.log('🧪 Iniciando checagem dos comandos e arquivos...');

  // Verificar arquivos essenciais
  try {
    const jogosData = fs.readFileSync(caminhoJogos, 'utf-8');
    const lancamentosData = fs.readFileSync(caminhoLancamentos, 'utf-8');
    JSON.parse(jogosData);
    JSON.parse(lancamentosData);
    console.log('📂 Arquivos jogos.json e lancamentos.json carregados com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao carregar arquivos JSON:', err.message);
  }

  // Verificar se comandos principais estão definidos
  const comandos = ['!jogo', '!nomedojogo', '!lista', '!info', '!gameplay', '!sobre', '!limpar', '!ajuda', '!status', '!lançamentos'];
  console.log(`📋 Comandos principais registrados: ${comandos.join(', ')}`);

  // Checar permissão de envio de mensagens em pelo menos um canal
  let permissaoOK = false;
  client.guilds.cache.forEach(guild => {
    guild.channels.cache.forEach(channel => {
      if (
        channel.isTextBased?.() &&
        channel.viewable &&
        channel.permissionsFor(client.user)?.has('SendMessages')
      ) {
        permissaoOK = true;
      }
    });
  });

  if (permissaoOK) {
    console.log('✅ O bot tem permissão para enviar mensagens em pelo menos um canal.');
  } else {
    console.warn('⚠️ O bot não tem permissão para enviar mensagens em nenhum canal visível.');
  }
  
  console.log(`✅ Inicialização completa. Todos os testes foram executados. Bot online como ${client.user.tag}`);
  await verificarLancamentos(); // load da função abaixo
});

// Função para anunciar no chat os lançamentos do dia e remover o jogo da lista de lançamentos
async function verificarLancamentos() {
  const hoje = new Date();
  const diaHoje = hoje.getDate().toString().padStart(2, '0');
  const mesHoje = (hoje.getMonth() + 1).toString().padStart(2, '0');
  const anoHoje = hoje.getFullYear();
  const dataHoje = `${diaHoje}/${mesHoje}/${anoHoje}`;

  const lancamentos = carregarLancamentos();
  const lancamentosHoje = lancamentos.filter(jogo => jogo.data === dataHoje);

  if (lancamentosHoje.length === 0) return;

  const mensagem = `<a:clap:1377384175987855513> **Lançamentos de hoje (${dataHoje})**:\n` + lancamentosHoje.map(j => `${j.nome}`).join('\n');

  // Enviar em todos os canais
  client.guilds.cache.forEach(guild => {
    guild.channels.cache.forEach(channel => {
      console.log(`Verificando canal: ${channel.id}, Tipo: ${channel.type}`);
      if (channel.isTextBased() && channel.viewable && channel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)) {
        console.log(`Enviando mensagem no canal: ${channel.id}`);
        channel.send(mensagem).catch(console.error);
      }
    });
  });

  const novosLancamentos = lancamentos.filter(jogo => jogo.data !== dataHoje);
  fs.writeFileSync(path.join(__dirname, 'lancamentos.json'), JSON.stringify(novosLancamentos, null, 2), 'utf-8');

  console.log(`✅ Lançamentos de ${dataHoje} anunciados e removidos.`);
}

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const msg = message.content.trim();
 // add jogo + !info - Mostra informações do jogo na Steam em utils
   if (!msg.startsWith('!')) {
       adicionarJogo(message, msg, jogos);
    return;
  }

  const args = msg.slice(1).split(' ');
  const comando = args.shift().toLowerCase();

  if (comando === 'info') {
      console.log(`[COMANDO] !info usado por ${message.author.tag}`);
    return handleInfoCommand(message, args, global.jogos, encontrarJogoPorNome);
  }

 // !gameplay <nomedojogo> em utils
 if (comando === 'gameplay') {
    console.log(`[COMANDO] !gameplay usado por ${message.author.tag}: "${msg.substring(1)}"`);
  return handleGameplayCommand(message, args);
 }

 // !sobre em utils
  if (comando === 'sobre') {
      console.log(`[COMANDO] !sobre usado por ${message.author.tag}`);
  return handleSobreCommand(message);
  }

 // !limpar em utils
  if (comando === 'limpar') {
      console.log(`[COMANDO] !limpar usado por ${message.author.tag}`);
  return handleLimparCommand(message);
  }

  // !jogo – sorteia um aleatório
if (msg.toLowerCase() === '!jogo') {
  console.log(`[COMANDO] !jogo usado por ${message.author.tag}`);
  const chaves = Object.keys(jogos);
  const chaveSorteada = chaves[Math.floor(Math.random() * chaves.length)];
  const jogo = jogos[chaveSorteada];

  message.reply(`<:sorteado:1377014290846060739> Jogo sorteado: **${jogo.nome}**\n<a:link:1378756510053830676> Download: ${jogo.link} <a:Dance:1377385456672702566>`)
    .then(botMsg => {
      setTimeout(() => {
        message.delete().catch(() => {});
        botMsg.delete().catch(() => {});
      }, 30 * 60 * 1000);
    });
}

  // !lista – mostra todos os jogos
  else if (msg.toLowerCase() === '!lista') {
    const agora = Date.now();
    const ultimoUso = cooldowns.get(message.author.id);

  if (ultimoUso && (agora - ultimoUso) < COOLDOWN_TEMPO) {
    const restanteMs = COOLDOWN_TEMPO - (agora - ultimoUso);
    const horas = Math.floor(restanteMs / (1000 * 60 * 60));
    const minutos = Math.floor((restanteMs % (1000 * 60 * 60)) / (1000 * 60));
    return message.reply(`<:Calma:1377011131109085335> Calma ae o ligeirinho! Use esse comando novamente em ${horas}h ${minutos}m.`)
      .then(botMsg => {
        setTimeout(() => {
          message.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
 }

  cooldowns.set(message.author.id, agora);

  console.log(`[COMANDO] !lista usado por ${message.author.tag}`);
  const linhas = ['<:Lista:1377015811713011833> **Jogos disponíveis:**\n', ...Object.values(jogos).map(j => `• ${j.nome}`)];

  let bloco = '';
  for (const linha of linhas) {
    if (bloco.length + linha.length + 1 > 2000) {
      message.channel.send(bloco);
      bloco = '';
    }
    bloco += linha + '\n';
  }

  if (bloco.length > 0) {
    message.channel.send(bloco);
  }
}

  // !ajuda – mostra os comandos disponíveis
else if (msg.toLowerCase() === '!ajuda') {
  console.log(`[COMANDO] !ajuda usado por ${message.author.tag}`);
  const embed = new EmbedBuilder()
    .setTitle('<a:about:1378756920063692883> Comandos do Bot')
    .setColor(0xae6800)
    .setDescription(`
• \`!jogo\` — Sorteia um jogo aleatório
• \`!lista\` — Lista todos os jogos disponíveis
• \`!<nomedojogo>\` — Busca e envia o link do jogo
• \`!status\` — Mostra status e número de jogos
• \`!lançamentos\` — Lista os jogos com data de lançamento
• \`!info <nomedojogo>\` — Informações do jogo da lista na Steam
• \`!gameplay <nomedojogo>\` — Busca uma gameplay no YT
• \`!limpar\` — Limpa as ultimas 24 horas do chat do bot
• \`!sobre\` — Informações sobre o bot e fontes
• \`!ajuda\` — Mostra esta mensagem com os comandos disponíveis
• **[World of Warcraft](https://deathheavy.github.io)** — Lista de servidores privados de WoW
• **[Twitch AD's](https://pastebin.com/raw/s1yki08r)** — Guia para remover as propagandas
• **[Recomendações e Programas](https://pastebin.com/raw/H0A8cnp6)** — Lista de programas
• **[Stremio](https://pastebin.com/raw/DMp9MUma)** — Assistir séries e filmes\n
<:Sailors:1377016721139040296> **Greetings: 0xdeadc0de, RUNE, TENOKE, Fitgirl & DODI**
Se comprar não é possuir, piratear não é roubar!
`)
    .setThumbnail('https://i.imgur.com/3Dg9XI9.png');

  message.channel.send({ embeds: [embed] });
}

// !lançamentos – informa os próximos lançamentos de jogos
else if (msg.toLowerCase() === '!lançamentos') {
  console.log(`[COMANDO] !lancamentos usado por ${message.author.tag}`);

  const lancamentos = carregarLancamentos();

  const embed = new EmbedBuilder()
    .setTitle('<a:loading:1378759937710358698> Próximos Lançamentos de Jogos')
    .setColor(0xae6800)
    .setDescription(
      Object.values(lancamentos)
        .map(j => `**${j.nome}**\n⏳ ${j.data}`)
        .join('\n\n')
    )
    .setThumbnail('https://i.imgur.com/RReoZNc.png');

  return message.channel.send({ embeds: [embed] }).then(botMsg => {
    setTimeout(() => {
      message.delete().catch(() => {});
      botMsg.delete().catch(() => {});
    }, 2 * 60 * 60 * 1000);
  });
}

  // !status – informa o status e número de jogos
else if (msg.toLowerCase() === '!status') {
  console.log(`[COMANDO] !status usado por ${message.author.tag}`);
  const uptime = process.uptime();
  const minutos = Math.floor(uptime / 60);
  message.channel.send(`<:status:1377012004308648036> Estou online e tenho ${Object.keys(jogos).length} jogos cadastrados <a:pO:1377384885710225680>`)
      .then(botMsg => {
        setTimeout(() => {
          message.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 2 * 60 * 60 * 1000);
      });
}

// !nomedojogo – busca aproximada e envia o link
else if (msg.startsWith('!')) {
  const jogosEncontrados = encontrarJogoPorNome(msg.substring(1), jogos);

  console.log(`[COMANDO] !<nomedojogo> usado por ${message.author.tag}: "${msg.substring(1)}"`);

  if (jogosEncontrados.length === 0) {
    return message.reply(`<:X_:1377013402098208778> Nenhum jogo encontrado para: "${msg.substring(1)}" <a:Homer:1377386205879996497>`) // nome errado ou fora da lista
      .then(botMsg => {
        setTimeout(() => {
          message.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
  }

  if (jogosEncontrados.length === 1) {
    const jogo = jogosEncontrados[0];
    return message.reply(`<:Download:1377005613481070704> Download **${jogo.nome}**:\n${jogo.link}`)
      .then(botMsg => {
        setTimeout(() => {
          message.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 2 * 60 * 60 * 1000);
      });
  }

  const embed = new EmbedBuilder()
    .setTitle(`<:jogos:1377016515366223872> Jogos encontrados com "${msg.substring(1)}"`)
    .setColor(0xae6800)
    .setDescription(jogosEncontrados.map(j => `**${j.nome}**\n${j.link}`).join('\n\n'))
    .setThumbnail('https://i.imgur.com/6qHSsph.png');

  return message.reply({ embeds: [embed] }).then(botMsg => {
    setTimeout(() => {
      message.delete().catch(() => {});
      botMsg.delete().catch(() => {});
    }, 2 * 60 * 60 * 1000);
  });
}
});
// .env
client.login(process.env.DISCORD_TOKEN);