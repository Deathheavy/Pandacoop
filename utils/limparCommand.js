const { PermissionsBitField } = require('discord.js');

async function handleLimparCommand(msg) {
  if (!msg.guild || !msg.channel) return;

  const canal = msg.channel;

  // Verifica se o bot tem permissão para gerenciar mensagens
  if (!canal.permissionsFor(msg.client.user).has(PermissionsBitField.Flags.ManageMessages)) {
    return msg.reply('Não tenho permissão para deletar mensagens neste canal.')
        .then(botMsg => {
        setTimeout(() => {
          message.delete().catch(() => {});
          botMsg.delete().catch(() => {});
        }, 10000);
      });
  }

  try {
    const now = Date.now();

    // Busca mensagens (limite padrão do Discord é 100 por chamada)
    const mensagens = await canal.messages.fetch({ limit: 100 });

    const mensagensDeHoje = mensagens.filter(m => now - m.createdTimestamp <= 24 * 60 * 60 * 1000);

    if (mensagensDeHoje.size === 0) {
      return msg.reply('Nenhuma mensagem das últimas 24 horas foi encontrada para deletar.');
    }

    // Deleta em massa (bulkDelete ignora mensagens com mais de 14 dias)
    await canal.bulkDelete(mensagensDeHoje, true);

    const aviso = await canal.send(`🧹 ${mensagensDeHoje.size} mensagens das últimas 24 horas foram apagadas.`);
    setTimeout(() => aviso.delete().catch(() => {}), 5000);
  } catch (erro) {
    console.error('Erro ao limpar mensagens:', erro);
    msg.reply('Ocorreu um erro ao tentar limpar as mensagens.');
  }
}

module.exports = { handleLimparCommand };
