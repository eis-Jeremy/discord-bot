require('dotenv').config()
const fs = require('fs')
const { Events, ActivityType, Collection } = require('discord.js')
const mongoose = require('mongoose')
const client = require('./utils/client.js')

client.commands = new Collection()

const commandFiles = fs
  .readdirSync('./src/commands')
  .filter((file) => file.endsWith('.js'))

commandFiles.forEach((commandFile) => {
  const command = require(`./commands/${commandFile}`)
  client.commands.set(command.data.name, command)
})
;(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL)
    console.log('DB connected')
    return client.login(process.env.DISCORD_TOKEN)
  } catch (error) {
    console.error(error)
  }
})()

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

client.on('guildCreate', async (guild) => {
  console.log(guild.id)
})

client.once('ready', (client) => {
  console.log(`Ready! Logged in as: ${client.user.tag}!`)
  client.user.setPresence({
    activities: [{ name: `/abgaben`, type: ActivityType.Watching }],
    status: 'online',
  })
})
