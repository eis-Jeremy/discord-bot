const { SlashCommandBuilder, MessageFlags } = require('discord.js')
const { ROLE_ID } = require('../utils/data')
const { notPaid, replyOnSelectNP } = require('../utils/notPaid')
const { paid, replyOnSelectP } = require('../utils/paid')
const { createModal, createEmbed } = require('../utils/setup')

let membersInRole = null

module.exports = {
  data: new SlashCommandBuilder()
    .setName('taxes')
    .setNameLocalization('de', 'abgaben')
    .setDescription('Manages GTA RP taxes')
    .setDescriptionLocalization('de', 'Verwaltet GTA RP Abgaben')
    .addSubcommand((subcmd) =>
      subcmd
        .setName('setup')
        .setDescription('Sets up taxes (One time use)')
        .setDescriptionLocalization('de', 'Setzt Abgaben (Einmalige Nutzung)')
    )
    .addSubcommand((subcmd) =>
      subcmd
        .setName('update')
        .setDescription('Updates taxes (multiple uses)')
        .setDescriptionLocalization(
          'de',
          'Aktualisiert Abgaben (Mehrfachnutzung)'
        )
    )
    .addSubcommand((subcmd) =>
      subcmd
        .setName('paid')
        .setNameLocalization('de', 'bezahlt')
        .setDescription('Moves user from column **Not paid** to **Paid**')
        .setDescriptionLocalization(
          'de',
          'Verschiebt Nutzer von der Spalte **Nicht bezahlt** zu **Bezahlt**'
        )
    )
    .addSubcommand((subcmd) =>
      subcmd
        .setName('not-paid')
        .setNameLocalization('de', 'nicht-bezahlt')
        .setDescription('Moves user from column **Paid** to **Not paid**')
        .setDescriptionLocalization(
          'de',
          'Verschiebt Nutzer von der Spalte **Bezahlt** zu **Nicht bezahlt**'
        )
    ),

  async execute(interaction) {
    try {
      if (!interaction.isChatInputCommand()) return

      const guild = interaction.guild

      const [_, role] = await Promise.all([
        guild.members.fetch({ withPresences: false }),
        guild.roles.fetch(ROLE_ID),
      ])

      if (!role)
        return interaction.reply({
          content: 'Role not found!',
          flags: MessageFlags.Ephemeral,
        })

      membersInRole = role.members.map((m) => {
        return {
          label: m.nickname ?? m.user.displayName,
          value: m.id,
        }
      })

      switch (interaction.options._subcommand) {
        case 'setup':
          console.log('SETUP')
          createModal(interaction)
          createEmbed(membersInRole)
          break

        case 'update':
          console.log('UPDATE')
          interaction.reply('UPDATE')
          break

        case 'paid':
          // console.log('PAID')
          paid(interaction, membersInRole)
          replyOnSelectP(membersInRole)
          break

        case 'not-paid':
          console.log('NOT-PAID')

          notPaid(interaction, membersInRole)
          replyOnSelectNP(membersInRole)

          // interaction.reply('NOT-PAID')

          break
      }
    } catch (error) {
      console.log(error)
    }
  },
}
