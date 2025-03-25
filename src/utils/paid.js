const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js')
const client = require('./client')
const { maxOptionsPerPage } = require('./data')

async function Paid(interaction, membersInRole) {
  try {
    const selectMenuNP = createSelectMenuPaid(0, membersInRole)
    const actionRowNP = new ActionRowBuilder().addComponents(selectMenuNP)

    await interaction.reply({
      content: 'Wer hat bezahlt?',
      components: [actionRowNP],
      flags: MessageFlags.Ephemeral,
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = Paid

function createSelectMenuPaid(page, membersInRole) {
  const totalPages = Math.ceil(membersInRole.length / maxOptionsPerPage)
  const startIndex = page * maxOptionsPerPage
  const options = membersInRole
    .slice(startIndex, startIndex + maxOptionsPerPage)
    .map((member) => ({
      label:
        member.label.length > 100
          ? member.label.substring(0, 97) + '...'
          : member.label,
      value: `user_${member.value}`,
      description: `ID: ${member.value}`,
    }))

  // Steuerungsoptionen für Pagination
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
