const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  Events,
} = require('discord.js')
const client = require('./client')
const pag = require('./pag')
const { maxOptionsPerPage } = require('./infos')

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

module.exports = notPaid

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

  pag(membersInRole, page, options)

  return new StringSelectMenuBuilder()
    .setCustomId(`selectNotPaid_${page}`)
    .setPlaceholder(`Nutzer auswählen (Seite ${page + 1}/${totalPages})`)
    .addOptions(options)
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return
  const [type, page] = interaction.values[0].split('_')

  if (type === 'page') {
    // Benutzer hat "Weiter" oder "Zurück" gewählt
    const newPage = parseInt(page, 10)

    const selectMenuNotPaid = createSelectMenuNotPaid(newPage, membersInRole)
    const actionRow = new ActionRowBuilder().addComponents(selectMenuNotPaid)

    await interaction.update({ components: [actionRow] })
  } else if (type === 'user') {
    await interaction.reply({
      content: `<@${page}> hat nicht bezahlt!`,
      flags: MessageFlags.Ephemeral,
    })
  }
})
