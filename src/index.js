require('dotenv').config()
const fs = require('fs')
const { Collection } = require('discord.js')
const connect = require('./utils/connectDB.js')
const interact = require('./utils/interact')
const botLogin = require('./utils/botLogin')
const client = require('./utils/client.js')

client.commands = new Collection()

const commandFiles = fs
  .readdirSync('./src/commands')
  .filter((file) => file.endsWith('.js'))

commandFiles.forEach((commandFile) => {
  const command = require(`./commands/${commandFile}`)
  client.commands.set(command.data.name, command)
})

interact(client)
botLogin(client)
