require('dotenv').config()
const fs = require('fs')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const commands = []

const commandFiles = fs
  .readdirSync('./src/commands')
  .filter((file) => file.endsWith('.js'))

commandFiles.forEach((commandFile) => {
  const command = require(`./commands/${commandFile}`)

  console.log(command)

  commands.push(command.data.toJSON())
})

const restClient = new REST({ version: '9' }).setToken(
  process.env.DISCORD_TOKEN
)
// console.log(Guild.id)
restClient
  .put(Routes.applicationCommands(process.env.BOT_ID), {
    body: commands,
  })
  .then(() => console.log('Successfully registered commands'))
  .catch(console.error)
