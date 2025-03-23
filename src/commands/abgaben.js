const {
  TextInputBuilder,
  StringSelectMenuBuilder,
} = require('@discordjs/builders')

const {
  SlashCommandBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
  EmbedBuilder,
  Events,
  ModalBuilder,
  Locale,
} = require('discord.js')
const client = require('../utils/client.js')

const ROLE_ID_PROD = '1331268928885882981' //CDC
const ROLE_ID_DEV = '1344362890274279484' //TEST
const ROLE_ID = process.env.DEV === 'true' ? ROLE_ID_DEV : ROLE_ID_PROD
let membersInRole = null

const maxOptionsPerPage = 23

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abgaben')
    .setDescription('Zuständig für Abgaben')
    .addSubcommand((subcmd) =>
      subcmd
        .setName('bezahlt')
        .setDescription('Setzt den Nutzer auf die Liste der bezahlten Abgaben')
    )
    .addSubcommand((subcmd) =>
      subcmd
        .setName('nicht-bezahlt')
        .setDescription(
          'Setzt den Nutzer auf die Liste der nicht bezahlten Abgaben'
        )
    )
    .addSubcommand((subcmd) =>
      subcmd
        .setName('setup')
        .setDescription(
          'Setzt den Text, der Angezeigt wird, um die Abgaben anzuzeigen'
        )
    )
    .addSubcommand((subcmd) =>
      subcmd.setName('update').setDescription('Aktualisiert die Abgaben')
    ),
  // ------------------------------------------------------------------------------------

  async execute(interaction) {
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

    // ------------------------------------------------------------------------------

    switch (interaction.options.getSubcommand()) {
      case 'setup':
        console.log('SETUP')
        // MODAL
        const modalSetup = new ModalBuilder()
          .setCustomId(`abgabenSetup_${interaction.user.id}`)
          .setTitle('Abgaben einrichten')

        const amountSetup = new TextInputBuilder()
          .setCustomId('amountSetup')
          .setLabel('Menge der Abgaben')
          .setStyle(TextInputStyle.Short)
        const dateSetup = new TextInputBuilder()
          .setCustomId('dateSetup')
          .setLabel('Abgabefrist')
          .setStyle(TextInputStyle.Short)

        const actionRow1Setup = new ActionRowBuilder().addComponents(
          amountSetup
        )
        const actionRow2Setup = new ActionRowBuilder().addComponents(dateSetup)

        modalSetup.addComponents(actionRow1Setup, actionRow2Setup)

        await interaction.showModal(modalSetup)
        break

      // -------------------------------------------------------------

      case 'bezahlt':
        console.log('BEZAHLT')

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

        break

      // -------------------------------------------------------------

      case 'nicht-bezahlt':
        console.log('NICHT-BEZAHLT')

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

        break
      // -------------------------------------------------------------

      case 'update':
        console.log('UPDATE')

        break
    }
  },
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return

  getDataAndCreateEmbed(interaction)
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return
  const [type, page] = interaction.values[0].split('_')

  if (type === 'page') {
    // Benutzer hat "Weiter" oder "Zurück" gewählt
    const newPage = parseInt(page, 10)

    switch (interaction.) {
      case 'bezahlt':
        const selectMenuPaid = createSelectMenuPaid(newPage, membersInRole)
        break

      case 'nicht-bezahlt':
        const selectMenuNotPaid = createSelectMenuNotPaid(
          newPage,
          membersInRole
        )
        break
    }

    const actionRow = new ActionRowBuilder().addComponents(
      selectMenuPaid ? selectMenuPaid : selectMenuNotPaid
    )

    await interaction.update({ components: [actionRow] })
  } else if (type === 'user') {
    switch (interaction.getSubcommand) {
      case 'bezahlt':
        await interaction.reply({
          content: `<@${page}> hat bezahlt!`,
          flags: MessageFlags.Ephemeral,
        })
        break

      case 'nicht-bezahlt':
        await interaction.reply({
          content: `<@${page}> hat nicht bezahlt!`,
          flags: MessageFlags.Ephemeral,
        })
    }
  }
})

function getDataAndCreateEmbed(interaction) {
  // EMBED
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

  // Made by: •
}

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
    .setCustomId(`selectPaid_${page}`)
    .setPlaceholder(`Nutzer auswählen (Seite ${page + 1}/${totalPages})`)
    .addOptions(options)
}

function createSelectMenuNotPaid(page, membersInRole) {
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
