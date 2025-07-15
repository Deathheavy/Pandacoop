const { EmbedBuilder } = require('discord.js');

async function handleSobreCommand(msg) {
  const botAvatar = msg.client?.user?.displayAvatarURL?.() || null;
  
  const embed = new EmbedBuilder()
    .setTitle('Sobre o BOT')
    .setColor(0xae6800)
    .setDescription(`Este bot foi criado para gerenciar jogos de forma prática e facilitar o compartilhamento e organização no servidor`)
    .addFields(
      {
        name: 'Fontes',
        value: `• [**Online-Fix**](https://online-fix.me)\n• [**Fitgirl**](https://fitgirl-repacks.site)\n• [**DODI**](https://dodi-repacks.site)`,
      },
      {
        name: 'Recursos',
        value: `• Node.js\n• Discord.js\n• Steam Web API\n• Youtube API\n• Cache em memória (Map)`,
      },
      {
        name: '',
        value: `Feito por [Deathheavy](https://github.com/Deathheavy/Pandacoop)`,
      },
    )
    .setFooter({
      text: 'Versão 1.0 • Atualizações frequentes!',
      iconURL: botAvatar,
    })
    .setTimestamp();

  await msg.channel.send({ embeds: [embed] });
}

module.exports = { handleSobreCommand };
