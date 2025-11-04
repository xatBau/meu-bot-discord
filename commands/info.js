const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informações sobre você ou outro usuário')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário que você quer ver as informações')
        .setRequired(false)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`👤 Informações de ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: ' ID', value: user.id, inline: true },
        { name: ' Conta criada em', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true }
      )
      .setColor(0x00AE86);

    await interaction.reply({ embeds: [embed] });
  },
};