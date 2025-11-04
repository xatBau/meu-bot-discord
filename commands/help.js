const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra todos os comandos disponíveis'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle(' Lista de Comandos')
      .setDescription('Aqui estão os comandos disponíveis:')
      .addFields(
        { name: '/ping', value: 'Mostra a latência do bot' },
        { name: '/info', value: 'Mostra informações sobre um usuário' },
        { name: '/avatar', value: 'Mostra o avatar de um usuário' }
      )
      .setColor(0x5865F2)
      .setFooter({ text: 'SeuBot © 2025' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};