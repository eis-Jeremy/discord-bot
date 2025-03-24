const { ActivityType } = require('discord.js')

function botLogin(client) {
  client.once('ready', (client) => {
    console.log(`Ready! Logged in as: ${client.user.tag}!`)
    client.user.setPresence({
      activities: [{ name: `/abgaben`, type: ActivityType.Watching }],
      status: 'online',
    })
  })
}

module.exports = botLogin
