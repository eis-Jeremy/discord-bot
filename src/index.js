require('dotenv').config()
const fs = require('fs')
const { Collection } = require('discord.js')
const connectDB = require('./utils/connectDB.js')
const interact = require('./utils/interact.js')
const botLogin = require('./utils/botLogin.js')

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
interact(client)
botLogin(client)
