const { Events } = require('discord.js')

function interact(client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand) return

    const command = client.commands.get(interaction.commandName)
    if (command) {
      try {
        await command.execute(interaction)
      } catch (error) {
        if (interaction.deferred || interaction.replied) {
          interaction.editReply('Fehler beim Ausführen')
        } else {
          interaction.reply('Fehler beim Ausführen')
        }
      }
    }
  })
}

module.exports = interact
