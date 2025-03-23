require('dotenv').config()
const fs = require('fs')
const { Events, ActivityType, Collection } = require('discord.js')
const { connectDB } = require('./connectDB')

const client = require('./utils/client.js')

client.commands = new Collection()

const commandFiles = fs
  .readdirSync('./src/commands')
  .filter((file) => file.endsWith('.js'))

commandFiles.forEach((commandFile) => {
  const command = require(`./commands/${commandFile}`)
  client.commands.set(command.data.name, command)
})

connectDB()

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

client.once('ready', (client) => {
  console.log(`Ready! Logged in as: ${client.user.tag}!`)
  client.user.setPresence({
    activities: [{ name: `/abgaben`, type: ActivityType.Watching }],
    status: 'online',
  })
})
