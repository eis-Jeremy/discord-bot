const { SlashCommandBuilder } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder().setName('test').setDescription('test'),

  async execute(interaction) {
    try {
      if (!interaction.isChatInputCommand()) return
      interaction.reply('test erfolgreich!')

    } catch (error) {
      console.log(error)
    }
  },
}
