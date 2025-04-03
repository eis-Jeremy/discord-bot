// const mongoose = require('mongoose')
// const client = require('./client')
const { PrismaClient } = require('../../db/')

const prisma = new PrismaClient()

// const connect = async () => {
//   try {
//     mongoose.connect(process.env.DATABASE_URL)
//     console.log('DB connected')
//     main()
//     return client.login(process.env.DISCORD_TOKEN)
//   } catch (error) {
//     console.error(error)
//   }
// }

// async function main() {
//   try {
//     await prisma.$connect()
//     console.log('Prisma connected successfully.')
//   } catch (error) {
//     console.error('Prisma connection error:', error)
//   }
// }

module.exports = prisma
