const client = require('./client')
const {
  Events,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Locale,
} = require('discord.js')

async function createModal(interaction) {
  console.log(interaction.user)

  const modalSetup = new ModalBuilder()
    .setCustomId(`abgabenSetup_${interaction.user.id}`)
    .setTitle('Abgaben einrichten')

  const amountSetup = new TextInputBuilder()
    .setCustomId('amountSetup')
    .setLabel('Menge der Abgaben')
    .setStyle(TextInputStyle.Short)

  const dateSetup = new TextInputBuilder()
    .setCustomId('dateSetup')
    .setLabel('Abgabefrist (DD.MM.YYYY)')
    .setStyle(TextInputStyle.Short)

  const actionRow1Setup = new ActionRowBuilder().addComponents(amountSetup)
  const actionRow2Setup = new ActionRowBuilder().addComponents(dateSetup)

  modalSetup.addComponents(actionRow1Setup, actionRow2Setup)

  await interaction.showModal(modalSetup)
}

function createEmbed(membersInRole) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return

    const amountValue = interaction.fields.getTextInputValue('amountSetup')
    const dateValue = interaction.fields.getTextInputValue('dateSetup')

    if (!membersInRole) return

    const notPaid = membersInRole.reduce((acc, curr) => {
      return acc + `- <@${curr.value}>\n`
    }, `>>> `)
    const counterNotPaid = membersInRole.length

    const isAmountString = true
    const styledAmountValue = createStyledValues(amountValue, isAmountString)
    const styledDateValue = createStyledValues(dateValue, !isAmountString)
    const amountHeading = `💵   |   Menge:`
    const dateHeading = `📅   |   Abgabedatum:`
    const hr = createHorizontalRule(amountHeading, dateHeading)

    const embedSetup = new EmbedBuilder()
      .setTitle('Abgaben')
      .setColor('#0099FF')
      .addFields(
        {
          name: amountHeading,
          value: styledAmountValue,
          inline: false,
        },
        { name: dateHeading, value: styledDateValue, inline: false }
      )
      .addFields({ name: '', value: hr })
      .addFields(
        {
          name: `✅   |   Bezahlt (0):`,
          value: '>>> - **Noch nicht eingerichtet**',
          inline: true,
        },
        {
          name: `❌   |   Nicht bezahlt (${counterNotPaid}):`,
          value: notPaid,
          inline: true,
        }
      )
      .addFields({ name: '', value: '' })
      .setFooter({
        text: `Zuletzt aktualisiert: ${createDateTimeString()}\nMade by: RepublicVary0n`,
      })

    interaction.reply({ embeds: [embedSetup] })
  })
}

module.exports = { createModal, createEmbed }

function createDateTimeString() {
  return `${new Date(Date.now()).toLocaleDateString(Locale.German, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} ${new Date(Date.now()).toLocaleTimeString(Locale.German, 'hh:MM:ss')}`
}

function createStyledValues(string, isAmountString) {
  return isAmountString ? `$ ${string}` : `${string}`
}

function createHorizontalRule(amountString, dateString) {
  let calculatedLengthOfHR = amountString.length + dateString.length - 6

  return '\u2500'.repeat(calculatedLengthOfHR)
}
