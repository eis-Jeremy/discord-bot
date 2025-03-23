const mongoose = require('mongoose')
const client = require('./utils/client')

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL)
    console.log('DB connected')
    return client.login(process.env.DISCORD_TOKEN)
  } catch (error) {
    console.error(error)
  }
}

module.exports = { connectDB: connectDB }
