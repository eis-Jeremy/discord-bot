const mongoose = require('mongoose')
const client = require('./client')

const connect = async () => {
  try {
    // mongoose.connect(process.env.DATABASE_URL)
    console.log('DB connected')
    return client.login(process.env.DISCORD_TOKEN)
  } catch (error) {
    console.error(error)
  }
}

module.exports = connect
