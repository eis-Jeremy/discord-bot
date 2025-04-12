const client = require('./client')
const prisma = require('./connectDB')
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
  ChannelType,
} = require('discord.js')

// Globale Variablen
let roleID = null
let channelID = null
let guildID = null
let dcMemberIDs = null
let notPaid = ''

// ======================= ZENTRALER EVENT-HANDLER =======================

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('setupRoleSelect_')) {
        await handleRoleSelect(interaction)
      } else if (interaction.customId.startsWith('setupChannelSelect_')) {
        await handleChannelSelect(interaction)
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('abgabenSetup_')) {
        await handleModalSubmit(interaction)
      }
    }
  } catch (error) {
    console.error('Fehler im zentralen Event-Handler:', error)
  }
})

// ======================= HAUPTFUNKTION ZUM STARTEN =======================

async function setup(interaction, newPage = 0) {
  guildID = interaction.guild.id
  interaction.customId = 'setupRoleSelect_' + interaction.user.id

  const sortedRoles = await getSortedRoles(interaction)
  const roleSelect = await createRoleSelectMenu(
    newPage,
    sortedRoles,
    interaction
  )
  const actionRow = new ActionRowBuilder().addComponents(roleSelect)

  await interaction.reply({
    content: 'Welche Rolle soll Abgaben bezahlen?',
    components: [actionRow],
    flags: MessageFlags.Ephemeral,
  })
}

// ======================= HANDLER-FUNKTIONEN =======================

async function handleRoleSelect(interaction) {
  const [type, page] = interaction.values[0].split('_')
  const sortedRoles = await getSortedRoles(interaction)
  const sortedChannels = await getSortedChannels(interaction)

  if (type === 'role') {
    roleID = page

    interaction.customId = 'setupChannelSelect_' + interaction.user.id
    const channelSelect = await createChannelSelectMenu(
      0,
      sortedChannels,
      interaction
    )
    const actionRow = new ActionRowBuilder().addComponents(channelSelect)

    await interaction.reply({
      content: 'In welchen Channel sollen die Abgaben gesendet werden?',
      components: [actionRow],
      flags: MessageFlags.Ephemeral,
    })
  } else if (type === 'page') {
    const newPage = parseInt(page, 10)
    const roleMenu = await createRoleSelectMenu(
      newPage,
      sortedRoles,
      interaction
    )
    const actionRow = new ActionRowBuilder().addComponents(roleMenu)

    await interaction.update({ components: [actionRow] })
  }
}

async function handleChannelSelect(interaction) {
  const [type, page] = interaction.values[0].split('_')
  const sortedChannels = await getSortedChannels(interaction)

  if (type === 'channel') {
    channelID = page

    const modal = new ModalBuilder()
      .setCustomId(`abgabenSetup_${interaction.user.id}`)
      .setTitle('Abgaben einrichten')

    const amount = new TextInputBuilder()
      .setCustomId('amountSetup')
      .setLabel('Menge der Abgaben')
      .setStyle(TextInputStyle.Short)

    const date = new TextInputBuilder()
      .setCustomId('dateSetup')
      .setLabel('Abgabefrist (DD.MM.YYYY)')
      .setStyle(TextInputStyle.Short)

    modal.addComponents(
      new ActionRowBuilder().addComponents(amount),
      new ActionRowBuilder().addComponents(date)
    )

    await interaction.showModal(modal)
  } else if (type === 'page') {
    const newPage = parseInt(page, 10)
    const channelMenu = await createChannelSelectMenu(
      newPage,
      sortedChannels,
      interaction
    )
    const actionRow = new ActionRowBuilder().addComponents(channelMenu)

    await interaction.update({ components: [actionRow] })
  }
}

async function handleModalSubmit(interaction) {
  const amountValue = interaction.fields.getTextInputValue('amountSetup')
  const dateValue = interaction.fields.getTextInputValue('dateSetup')

  if (
    isNaN(Number(amountValue)) ||
    Number(amountValue) <= 0 ||
    Number(amountValue) > 2 ** 53 - 1
  ) {
    return await interaction.reply({
      content: 'Ungültige Menge. Bitte gib einen gültigen Wert ein.',
      flags: MessageFlags.Ephemeral,
    })
  }

  const [day, month, year] = dateValue.split('.').map(Number)
  const isValidDate =
    String(day).length === 2 &&
    day >= 1 &&
    day <= 31 &&
    String(month).length === 2 &&
    month >= 1 &&
    month <= 12 &&
    String(year).length === 4 &&
    year > 0

  if (!isValidDate) {
    return await interaction.reply({
      content:
        'Ungültiges Datumsformat. Bitte Format DD.MM.YYYY (D = Tag; M = Monat; Y = Jahr) verwenden!',
      flags: MessageFlags.Ephemeral,
    })
  }

  // Member in Rolle speichern
  const role = await interaction.guild.roles.fetch(roleID)
  const membersInRole = role.members.map((member) => {
    return {
      label: member.name,
      value: member.id,
    }
  })

  dcMemberIDs = membersInRole.map((member) => {
    return member.value
  })

  // Liste der Nicht-Bezahlten Nutzer

  if (membersInRole.length > 0) {
    notPaid = membersInRole.reduce(
      (acc, curr) => acc + `- <@${curr.value}>\n`,
      `>>> `
    )
  }

  const embed = new EmbedBuilder()
    .setTitle(`Abgaben (${role.name})`)
    .setColor('#0099FF')
    .addFields(
      {
        name: '💵   |   Menge:',
        value: createStyledValues(amountValue, true),
        inline: false,
      },
      {
        name: '📅   |   Abgabedatum:',
        value: createStyledValues(dateValue, false),
        inline: false,
      },
      {
        name: '',
        value: createHorizontalRule('💵   |   Menge:', '📅   |   Abgabedatum:'),
      },
      {
        name: `✅   |   Bezahlt (0):`,
        value: '>>> - **Noch nicht eingerichtet**',
        inline: true,
      },
      {
        name: `❌   |   Nicht bezahlt (${notPaid.length}):`,
        value: notPaid,
        inline: true,
      },
      { name: '', value: '' }
    )
    .setFooter({
      text: `Zuletzt aktualisiert: ${createDateTimeString()}\nMade by: RepublicVary0n`,
    })

  await interaction.reply({ embeds: [embed] })

  console.log('Server: ' + guildID)
  console.log('Rolle: ' + roleID)
  console.log('Channel: ' + channelID)
  console.log('Nutzer (Mehrere): ' + dcMemberIDs)

  // prisma.user.create({
  //   data: {
  //     dcMemberID: 'test',
  //     guildID: guildID,
  //     roleID: roleID,
  //   },
  // })

  for (const memberID of dcMemberIDs) {
    await prisma.user.create({
      data: {
        dcUserID: memberID,
        guildID: guildID,
        roleID: roleID,
      },
    })
  }
}

// ======================= UI-HILFSFUNKTIONEN =======================

function createStyledValues(value, isAmount) {
  return isAmount ? `$ ${value}` : value
}

function createHorizontalRule(amountStr, dateStr) {
  const total = amountStr.length + dateStr.length - 6
  return '─'.repeat(total)
}

function createDateTimeString() {
  const now = new Date()
  return `${now.toLocaleDateString(Locale.German, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} ${now.toLocaleTimeString(Locale.German)}`
}

// ======================= MENÜ-ERZEUGUNG =======================

async function createRoleSelectMenu(page, sortedRoles, interaction) {
  const totalPages = Math.ceil(sortedRoles.length / maxOptionsPerPage)
  const start = page * maxOptionsPerPage

  const options = sortedRoles
    .slice(start, start + maxOptionsPerPage)
    .map((role) => ({
      label:
        role.label.length > 100 ? role.label.slice(0, 97) + '...' : role.label,
      value: `role_${role.value}`,
      description: `ID: ${role.value}`,
    }))

  pagination(totalPages, page, options)

  return new StringSelectMenuBuilder()
    .setCustomId('setupRoleSelect_' + interaction.user.id)
    .setOptions(options)
    .setPlaceholder(`Rolle auswählen (Seite ${page + 1} / ${totalPages})`)
}

async function createChannelSelectMenu(page, sortedChannels, interaction) {
  const totalPages = Math.ceil(sortedChannels.length / maxOptionsPerPage)
  const start = page * maxOptionsPerPage

  const options = sortedChannels
    .slice(start, start + maxOptionsPerPage)
    .map((channel) => ({
      label:
        channel.label.length > 100
          ? channel.label.slice(0, 97) + '...'
          : channel.label,
      value: `channel_${channel.value}`,
      description: `ID: ${channel.value}`,
    }))

  pagination(totalPages, page, options)

  return new StringSelectMenuBuilder()
    .setCustomId('setupChannelSelect_' + interaction.user.id)
    .setOptions(options)
    .setPlaceholder(`Kanal auswählen (Seite ${page + 1} / ${totalPages})`)
}

function pagination(totalPages, page, options) {
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
}

// ======================= SORTIERUNG =======================

async function getSortedRoles(interaction) {
  const roles = await interaction.guild.roles.fetch()
  return roles
    .map((role) => ({
      label: role.name,
      value: role.id,
      position: role.position,
    }))
    .sort((a, b) => b.position - a.position)
}

async function getSortedChannels(interaction) {
  try {
    const channels = await interaction.guild.channels.fetch()
    return [...channels.values()]
      .filter(
        (channel) =>
          channel.type === ChannelType.GuildText &&
          channel.name &&
          channel.id &&
          channel.rawPosition !== undefined
      )
      .map((channel) => ({
        label: channel.name,
        value: channel.id,
        position: channel.rawPosition,
      }))
      .sort((a, b) => a.position - b.position)
  } catch (error) {
    console.error('Fehler beim Channel-Fetch:', error)
  }
}

// ======================= EXPORTIERTES SETUP (Optional) =======================

module.exports = {
  setup,
}

// CONSOLE.LOGS

// client.on(Events.InteractionCreate, (interaction) => {
//   // if (interaction.isModalSubmit()) {
//   //   console.log('Server: ' + guildID)
//   //   console.log('Rolle: ' + roleID)
//   //   console.log('Channel: ' + channelID)
//   //   console.log('Nutzer (Mehrere): ' + dcMemberID)
//   //   // prisma.user.create({
//   //   //   data: {
//   //   //     dcUserID: dcUserID,
//   //   //     guildID,
//   //   //   },
//   //   // })
//   // }
// })
