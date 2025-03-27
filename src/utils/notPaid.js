const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  Events,
  StringSelectMenuInteraction,
} = require('discord.js')
const client = require('./client')
const { maxOptionsPerPage } = require('./data')

async function notPaid(interaction, membersInRole) {
  try {
    const selectMenuNP = createSelectMenuNotPaid(0, membersInRole)
    const actionRowNP = new ActionRowBuilder().addComponents(selectMenuNP)

    await interaction.reply({
      content: 'Wer hat nicht bezahlt?',
      components: [actionRowNP],
      flags: MessageFlags.Ephemeral,
    })
  } catch (error) {
    console.log(error)
  }
}

function createSelectMenuNotPaid(page, membersInRole) {
  const totalPages = Math.ceil(membersInRole.length / maxOptionsPerPage)
  const startIndex = page * maxOptionsPerPage
  let options = membersInRole
    .slice(startIndex, startIndex + maxOptionsPerPage)
    .map((member) => ({
      label:
        member.label.length > 100
          ? member.label.substring(0, 97) + '...'
          : member.label,
      value: `user_${member.value}`,
      description: `ID: ${member.value}`,
    }))

  if (totalPages > 1) {
    if (page > 0) {
      options.push({
        label: '⬅️ Vorherige Seite',
        value: `page_${page - 1}`,
        description: `Gehe zu Seite ${page}`,
      })
    }
    if (page < totalPages - 1) {
      options.push({
        label: '➡️ Nächste Seite',
        value: `page_${page + 1}`,
        description: `Gehe zu Seite ${page + 2}`,
      })
    }
  }

  return new StringSelectMenuBuilder()
    .setCustomId(`selectNotPaid_${page}`)
    .setPlaceholder(`Nutzer auswählen (Seite ${page + 1}/${totalPages})`)
    .addOptions(options)
}

function replyOnSelectNP(membersInRole) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isStringSelectMenu()) return
    const [type, page] = interaction.values[0].split('_')

    console.log(interaction.values[0].split('_'))

    if (type === 'page') {
      // Benutzer hat "Weiter" oder "Zurück" gewählt
      const newPage = parseInt(page, 10)

      const selectMenuPaid = createSelectMenuNotPaid(newPage, membersInRole)
      const actionRow = new ActionRowBuilder().addComponents(selectMenuPaid)

      await interaction.update({ components: [actionRow] })
    } else if (type === 'user') {
      // Benutzer hat Benutzer gewählt
      await interaction.reply({
        content: `<@${page}> hat nicht bezahlt!`,
        flags: MessageFlags.Ephemeral,
      })
    }
  })
}

module.exports = { notPaid, replyOnSelectNP }
