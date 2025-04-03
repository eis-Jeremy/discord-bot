const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  Events,
} = require('discord.js')
const client = require('./client')
const { maxOptionsPerPage } = require('./data')

async function paid(interaction, membersInRole) {
  try {
    const selectMenuP = createSelectMenuPaid(0, membersInRole)
    const actionRowP = new ActionRowBuilder().addComponents(selectMenuP)

    await interaction.reply({
      content: 'Wer hat bezahlt?',
      components: [actionRowP],
      flags: MessageFlags.Ephemeral,
    })
  } catch (error) {
    console.log(error)
  }
}

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

  // Steuerung für Pagination
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
    .setCustomId(`selectPaid_${page}`)
    .setPlaceholder(`Nutzer auswählen (Seite ${page + 1}/${totalPages})`)
    .addOptions(options)
}

function replyOnSelectP(membersInRole) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isStringSelectMenu()) return
    const [type, page] = interaction.values[0].split('_')

    if (type === 'page') {
      // Benutzer hat "Weiter" oder "Zurück" gewählt
      const newPage = parseInt(page, 10)

      const selectMenuPaid = createSelectMenuPaid(newPage, membersInRole)
      const actionRow = new ActionRowBuilder().addComponents(selectMenuPaid)

      await interaction.update({ components: [actionRow] })
    } else if (type === 'user') {
      // Benutzer hat Benutzer gewählt
      const targetMember = await interaction.guild.client.users.fetch(page)

      const embed = {
        color: 0x00ff00,
        title: 'Bezahlt',
        thumbnail: {
          url: targetMember.displayAvatarURL(),
        },
        fields: [
          {
            name: 'Wer?',
            value: `<@${page}>`,
            inline: false,
          },
        ],
      }

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      })
    }
  })
}

module.exports = { paid, replyOnSelectP }
