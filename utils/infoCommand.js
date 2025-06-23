// Steam API !info <nomedojogo> para buscar os jogos na steam
const steamAppCache = new Map();

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/gi, '');
}

function extrairNomeBase(nome) {
  return nome.split('-')[0].trim();
}

async function obterAppId(jogoNome, jogoOriginal = null) {
  if (steamAppCache.has(jogoNome)) {
    return steamAppCache.get(jogoNome);
  }

  if (jogoOriginal?.appid) {
    steamAppCache.set(jogoNome, jogoOriginal.appid);
    return jogoOriginal.appid;
  }

  const res = await fetch('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
  if (!res.ok) throw new Error('Falha ao buscar lista de apps da Steam.');

  const data = await res.json();
  const appList = data.applist.apps;

  const normalizedBusca = normalize(jogoNome);

  // Filtra apps que provavelmente não são jogos principais
  const filteredAppList = appList.filter(app => {
    const name = app.name.toLowerCase();
    return !(
      name.includes('dlc') ||
      name.includes('soundtrack') ||
      name.includes('demo') ||
      name.includes('beta') ||
      name.includes('trailer') ||
      name.includes('guide') ||
      name.includes('collector') ||
      name.includes('compilation') ||
      name.includes('bundle') ||
      name.includes('vr') ||
      name.includes('season pass') ||
      name.includes('free weekend')
    );
  });

  let match = filteredAppList.find(app => normalize(app.name) === normalizedBusca);

  if (!match) {
    match = filteredAppList.find(app => normalize(app.name).startsWith(normalizedBusca));
  }

  if (!match) {
    match = filteredAppList.find(app => normalize(app.name).includes(normalizedBusca));
  }

  if (match) {
   const appDetailsRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${match.appid}`);
   const appDetailsData = await appDetailsRes.json();
   const appInfo = appDetailsData[match.appid.toString()]?.data;

  if (!appInfo || appInfo.type !== 'game') {
     return null; // Não é jogo principal
   }

   steamAppCache.set(jogoNome, match.appid);
   return match.appid;
}

  return null;
}

async function handleInfoCommand(msg, args, jogos, encontrarJogoPorNome) {
    console.log(`[COMANDO] !info ${args.join(' ')} usado por ${msg.author?.tag || 'Desconhecido'}` );
  if (!args.length) return msg.reply('⚠️ Use `!info <nome do jogo>`')
        .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });

  const nomeBusca = args.join(' ');
  const jogosEncontrados = encontrarJogoPorNome(nomeBusca, jogos);

  if (!jogosEncontrados || jogosEncontrados.length === 0) {
    return msg.reply(`❌ Jogo "${nomeBusca}" não encontrado na lista.`)
        .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
  }

  const jogo = jogosEncontrados[0];

  try {
    const nomeBase = extrairNomeBase(jogo.nome);
    const appid = await obterAppId(nomeBase, jogo);
    if (!appid) {
      return msg.reply(`⚠️ Não consegui encontrar esse jogo na Steam.`)
        .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
    }

    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}`);
    if (!res.ok) throw new Error('Falha ao obter detalhes do jogo.');

    const data = await res.json();
    const info = data[appid.toString()]?.data;

    if (!info) {
      return msg.reply('❌ Não consegui obter informações sobre esse jogo.')
        .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
    }

    return msg.reply(`🎮 **${info.name}**
📝 ${info.short_description}
📅 Lançado em: ${info.release_date?.date || 'Desconhecido'}
💵 Preço: ${info.is_free ? 'Gratuito' : (info.price_overview?.final_formatted || 'Indisponível')}
🔗 https://store.steampowered.com/app/${appid}`)
        .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 30 * 60 * 1000);
      });
  } catch (error) {
    console.error('Erro no comando !info:', error);
    return msg.reply('<:X_:1377013402098208778> Ocorreu um erro ao buscar as informações. Tente novamente mais tarde.')
        .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
  }
}

module.exports = { handleInfoCommand };