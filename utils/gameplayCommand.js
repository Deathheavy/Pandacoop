const { EmbedBuilder } = require('discord.js');

const YT_API_KEY = process.env.YOUTUBE_API_KEY;

async function handleGameplayCommand(msg, args) {
  if (!args.length) {
    return msg.reply('⚠️ Use `!gameplay <nome do jogo>`')
        .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
  }

  const query = `${args.join(' ')} gameplay`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&regionCode=BR&key=${YT_API_KEY}`;

  try {
    const res = await fetch(url);
    console.log('Resposta da API:', res.status, res.statusText);
    if (!res.ok) {
     const erroTexto = await res.text();
     console.error('Resposta de erro da API:', erroTexto);
     throw new Error('Falha ao buscar vídeos no YouTube');
    }

    const data = await res.json();
    const videos = data.items;

    if (!videos || videos.length === 0) {
      return msg.reply('<a:Homer:1377386205879996497> Nenhum vídeo de gameplay encontrado.')
        .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
    }

    // Filtrar manualmente por título e descrição
    const video = videos.find(v => {
      const t = v.snippet.title.toLowerCase();
      const d = v.snippet.description.toLowerCase();

      const ehGameplay = (t.includes('gameplay') || d.includes('gameplay'));
      const ehPT = (t.includes('português') || t.includes('pt-br') || t.includes('english') || t.includes('en') || d.includes('português') || d.includes('pt-br') ||  d.includes('english') || d.includes('en'));
      const ignorar = ['trailer', 'notícia', 'cinematic', 'cutscene'].some(palavra =>
        t.includes(palavra) || d.includes(palavra)
      );

      return ehGameplay && ehPT && !ignorar;
    });

    if (!video) return msg.reply('<a:Homer:1377386205879996497> Nenhum vídeo encontrado com foco em gameplay.')
            .then(botMsg => {
        setTimeout(() => {
          msg.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });

    const videoId = video.id.videoId;
    const link = `https://www.youtube.com/watch?v=${videoId}`;

    const embed = new EmbedBuilder()
      .setTitle(video.snippet.title)
      .setURL(link)
      .setThumbnail(video.snippet.thumbnails.high.url)
      .setFooter({ text: `Canal: ${video.snippet.channelTitle}` })
      .setColor('#FF0000');

    return msg.reply({ embeds: [embed] }).then(botMsg => {
    setTimeout(() => {
      msg.delete().catch(() => {});
      botMsg.delete().catch(() => {});
    }, 30 * 60 * 1000);
  });
  } catch (err) {
    console.error('Erro ao buscar gameplay:', err);
    return msg.reply('<:X_:1377013402098208778> Erro ao buscar gameplay. Tente novamente mais tarde.');
  }
}

module.exports = { handleGameplayCommand };