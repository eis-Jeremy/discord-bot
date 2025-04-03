const client = require('./client')
const { maxOptionsPerPage } = require('./data')
const {
  Events,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Locale,
  MessageFlags,
  StringSelectMenuBuilder,
} = require('discord.js')
const prisma = require('./connectDB')

let roleID = null
let guildID = null
let dcUserID = null

async function getSortedRoles(interaction) {
  const roles = await interaction.guild.roles.fetch()
  const sortedRoles = roles
    .map((role) => ({
      label: role.name,
      value: role.id,
      position: role.position,
    }))
    .sort((a, b) => b.position - a.position) // Sortiert nach Server-Reihenfolge

  return sortedRoles
}

async function createRoleSelect(interaction, newPage) {
  guildID = interaction.guild.id

  const sortedRoles = await getSortedRoles(interaction)

  const roleSelect = await createRoleSelectMenu(
    newPage,
    sortedRoles,
    interaction
  )

  const actionRow = new ActionRowBuilder().addComponents(await roleSelect)

  await interaction.reply({
    content: 'Welche Rolle soll Abgaben bezahlen?',
    components: [actionRow],
    flags: MessageFlags.Ephemeral,
  })
}

function createModal() {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isStringSelectMenu()) return

    const [type, page] = interaction.values[0].split('_')

    const sortedRoles = await getSortedRoles(interaction)

    if (type === 'role') {
      roleID = page

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
    } else if (type === 'page') {
      const newPage = parseInt(page, 10)

      const roleMenu = await createRoleSelectMenu(
        newPage,
        sortedRoles,
        interaction
      )

      const actionRow = new ActionRowBuilder().addComponents(roleMenu)

      try {
        await interaction.update({
          components: [actionRow],
        })
      } catch (error) {
        console.log(error)
      }
    }
  })
}

function createEmbed(membersInRole) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return

    const amountValue = interaction.fields.getTextInputValue('amountSetup')

    if (Number(amountValue) > 2 ** 53 - 1) {
      interaction.reply({
        content: 'Menge der Abgaben zu hoch! Bitte niedriger wählen.',
        flags: MessageFlags.Ephemeral,
      })
      return
    } else if (amountValue <= 0) {
      interaction.reply({
        content: 'Abgaben müssen höher als 0 sein.',
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    const dateValue = interaction.fields.getTextInputValue('dateSetup')

    if (!membersInRole) return

    const guildID = process.env.GUILD_ID
    console.log(guildID)

    const members = await prisma.user.createMany({
      data: {
        dcUserID: '23423543',
        guildID: 'guild_id2345',
        roleID: 'role_id234234',
      },
    })

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

module.exports = { createModal, createEmbed, createRoleSelect }

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

async function createRoleSelectMenu(page, sortedRoles, interaction) {
  const totalPages = Math.ceil(sortedRoles.length / maxOptionsPerPage)
  const startIndex = page * maxOptionsPerPage

  const options = sortedRoles
    .slice(startIndex, startIndex + maxOptionsPerPage)
    .map((role) => ({
      label:
        role.label.length > 100
          ? role.label.substring(0, 97) + '...'
          : role.label,
      value: `role_${role.value}`,
      description: `ID: ${role.value}`,
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
    .setCustomId('setupRoleSelect_' + interaction.user.id)
    .setOptions(options)
    .setPlaceholder(`Rolle auswählen (Seite ${page + 1} / ${totalPages})`)
}
