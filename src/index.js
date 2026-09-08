require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
  AuditLogEvent,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./database/database');
const logger = require('./utils/logger');
const { isOwnerOrAdmin, getMissingBotPermissions } = require('./utils/permissions');
const { runFullSetup, resetServer } = require('./setup/setupServer');
const { createRoles } = require('./setup/roles');
const { createCategories } = require('./setup/categories');
const { createChannels } = require('./setup/channels');
const { applyPermissions } = require('./setup/permissions');
const { sendSetupEmbeds } = require('./setup/embeds');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('DISCORD_TOKEN is missing from .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  logger.info(`Logged in as ${client.user.tag}`);
  client.user.setActivity('FLOG RP Setup', { type: 3 });
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction);
    }
  } catch (err) {
    logger.error('Interaction error', { error: err.message, stack: err.stack });
    const msg = { content: 'An error occurred while processing this interaction.', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

async function handleButton(interaction) {
  const id = interaction.customId;

  // Cancel
  if (id === 'flog_setup_cancel') {
    return interaction.update({
      content: 'Setup cancelled.',
      embeds: [],
      components: [],
    });
  }

  // Confirm create
  if (id === 'flog_setup_confirm_create') {
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({ content: 'Insufficient permissions.', flags: MessageFlags.Ephemeral });
    }

    await interaction.update({
      content: '🇬🇧 **FLOG RP SETUP**\n\n⏳ Starting…',
      embeds: [],
      components: [],
    });

    const result = await runFullSetup(interaction.guild, interaction.message);
    await interaction.message.edit({ content: result.message }).catch(() => {});

    if (result.errors?.length) {
      await interaction.followUp({
        content: `Completed with warnings:\n${result.errors.slice(0, 10).join('\n')}`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
    return;
  }

  // Confirm reset
  if (id === 'flog_setup_confirm_reset') {
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({ content: 'Insufficient permissions.', flags: MessageFlags.Ephemeral });
    }

    // Second confirmation
    const embed = new EmbedBuilder()
      .setTitle('⚠️ FINAL CONFIRMATION')
      .setColor(0xff0000)
      .setDescription('This is irreversible for bot-managed resources.\n\nType the confirmation again.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('flog_setup_confirm_reset_final')
        .setLabel('Delete everything now')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('flog_setup_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.update({ embeds: [embed], components: [row] });
  }

  if (id === 'flog_setup_confirm_reset_final') {
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({ content: 'Insufficient permissions.', flags: MessageFlags.Ephemeral });
    }

    await interaction.update({ content: '⏳ Resetting…', embeds: [], components: [] });
    const deleted = await resetServer(interaction.guild);
    await interaction.message.edit({
      content: `Reset complete.\nRoles deleted: ${deleted.roles}\nChannels deleted: ${deleted.channels}\nCategories deleted: ${deleted.categories}`,
    });
    return;
  }

  // Partial steps
  if (id.startsWith('flog_setup_partial_')) {
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({ content: 'Insufficient permissions.', flags: MessageFlags.Ephemeral });
    }
    const step = id.replace('flog_setup_partial_', '');
    await interaction.update({ content: `⏳ Running ${step}…`, embeds: [], components: [] });

    try {
      if (step === 'roles') {
        const { results } = await createRoles(interaction.guild);
        await interaction.message.edit({
          content: `Roles done. Created: ${results.created}, Reused: ${results.reused}`,
        });
      } else if (step === 'channels') {
        const { categoryMap } = await createCategories(interaction.guild);
        const { results } = await createChannels(interaction.guild, categoryMap);
        await interaction.message.edit({
          content: `Channels done. Created: ${results.created}, Reused: ${results.reused}`,
        });
      } else if (step === 'embeds') {
        const channels = db.getAllChannels(interaction.guildId);
        const channelMap = new Map();
        for (const c of channels) {
          const ch = await interaction.guild.channels.fetch(c.channel_id).catch(() => null);
          if (ch) channelMap.set(c.channel_key, ch);
        }
        const results = await sendSetupEmbeds(interaction.guild, channelMap);
        await interaction.message.edit({ content: `Embeds sent: ${results.sent}` });
      } else if (step === 'permissions') {
        const roles = db.getAllRoles(interaction.guildId);
        const cats = db.getAllCategories(interaction.guildId);
        const channels = db.getAllChannels(interaction.guildId);
        const roleMap = new Map();
        const categoryMap = new Map();
        const channelMap = new Map();
        for (const r of roles) {
          const role = await interaction.guild.roles.fetch(r.role_id).catch(() => null);
          if (role) roleMap.set(r.role_key, role);
        }
        for (const c of cats) {
          const cat = await interaction.guild.channels.fetch(c.category_id).catch(() => null);
          if (cat) categoryMap.set(c.category_key, cat);
        }
        for (const c of channels) {
          const ch = await interaction.guild.channels.fetch(c.channel_id).catch(() => null);
          if (ch) channelMap.set(c.channel_key, ch);
        }
        await applyPermissions(interaction.guild, roleMap, categoryMap, channelMap);
        await interaction.message.edit({ content: 'Permissions re-applied.' });
      } else {
        // fallback to full setup
        const result = await runFullSetup(interaction.guild, interaction.message);
        await interaction.message.edit({ content: result.message });
      }
    } catch (err) {
      logger.error('Partial setup failed', { error: err.message });
      await interaction.message.edit({ content: `Failed: ${err.message}` });
    }
    return;
  }

  // Verification
  if (id === 'flog_verify') {
    const guild = interaction.guild;
    const member = interaction.member;

    if (db.isVerified(guild.id, member.id)) {
      return interaction.reply({
        content: 'You are already verified.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const verifiedDb = db.getRole(guild.id, 'verified');
    const unverifiedDb = db.getRole(guild.id, 'unverified');

    if (!verifiedDb) {
      return interaction.reply({
        content: 'Verified role is not configured. Run /setup create first.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await member.roles.add(verifiedDb.role_id, 'FLOG RP verification');
      if (unverifiedDb) {
        await member.roles.remove(unverifiedDb.role_id).catch(() => {});
      }
      db.saveVerification(guild.id, member.id);

      // Log
      await sendLog(guild, {
        title: 'Member Verified',
        description: `${member} (${member.user.tag}) verified.`,
        color: config.colours.gold,
      });

      return interaction.reply({
        content: 'You have been verified. Welcome to FLOG RP.',
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      logger.error('Verification failed', { error: err.message });
      return interaction.reply({
        content: 'Verification failed. Please contact staff.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  // Ticket creation
  if (id.startsWith('flog_ticket_')) {
    const type = id.replace('flog_ticket_', '');
    const typeDef = config.ticketTypes.find(t => t.id === type) || { label: type, id: type };
    const guild = interaction.guild;
    const member = interaction.member;

    // Prevent duplicate open tickets of same type (simple check)
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}` &&
           c.topic?.includes(member.id)
    );
    if (existing) {
      return interaction.reply({
        content: `You already have an open ticket: ${existing}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const ticketsCatDb = db.getCategory(guild.id, 'tickets') || db.getCategory(guild.id, 'support');
    let parentId = ticketsCatDb?.category_id;

    const staffRoleIds = db.getAllRoles(guild.id)
      .filter(r => ['owner', 'management', 'head_admin', 'senior_admin', 'administrator', 'moderator', 'trial_moderator'].includes(r.role_key))
      .map(r => r.role_id);

    const overwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      ...staffRoleIds.map(rid => ({
        id: rid,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      })),
    ];

    try {
      const channel = await guild.channels.create({
        name: `ticket-${member.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90),
        type: ChannelType.GuildText,
        parent: parentId || undefined,
        topic: `Ticket for ${member.id} | ${type}`,
        permissionOverwrites: overwrites,
        reason: `Ticket opened by ${member.user.tag}`,
      });

      db.createTicket(guild.id, channel.id, member.id, type);

      const embed = new EmbedBuilder()
        .setTitle(`${typeDef.label}`)
        .setDescription(`Ticket opened by ${member}.\n\nStaff will be with you shortly.`)
        .setColor(config.colours.gold)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('flog_ticket_close')
          .setLabel('🔒 Close Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `${member}`, embeds: [embed], components: [row] });

      await sendLog(guild, {
        title: 'Ticket Created',
        description: `${member} opened a **${typeDef.label}** ticket: ${channel}`,
        color: config.colours.gold,
      });

      return interaction.reply({
        content: `Your ticket has been created: ${channel}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      logger.error('Ticket creation failed', { error: err.message });
      return interaction.reply({
        content: 'Failed to create ticket. Please contact staff.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  // Close ticket
  if (id === 'flog_ticket_close') {
    const channel = interaction.channel;
    const ticket = db.getTicketByChannel(channel.id);
    if (!ticket) {
      return interaction.reply({ content: 'This does not appear to be a tracked ticket.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setTitle('Close Ticket?')
      .setDescription('Are you sure you want to close this ticket?')
      .setColor(0xff0000);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('flog_ticket_close_confirm')
        .setLabel('Confirm Close')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('flog_ticket_close_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  }

  if (id === 'flog_ticket_close_cancel') {
    return interaction.update({ content: 'Close cancelled.', embeds: [], components: [] });
  }

  if (id === 'flog_ticket_close_confirm') {
    const channel = interaction.channel;
    const ticket = db.getTicketByChannel(channel.id);

    // Simple transcript – last 50 messages
    let transcript = `Ticket Transcript – ${channel.name}\nClosed by: ${interaction.user.tag}\n\n`;
    try {
      const messages = await channel.messages.fetch({ limit: 50 });
      const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      for (const m of sorted) {
        transcript += `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}\n`;
      }
    } catch (_) {}

    db.closeTicket(channel.id);

    await sendLog(interaction.guild, {
      title: 'Ticket Closed',
      description: `Ticket ${channel.name} closed by ${interaction.user}.\n\n\`\`\`\n${transcript.slice(0, 1500)}\n\`\`\``,
      color: 0xff0000,
    });

    await interaction.update({ content: 'Ticket will be deleted in 5 seconds…', embeds: [], components: [] });
    setTimeout(() => {
      channel.delete('Ticket closed').catch(() => {});
    }, 5000);
  }
}

async function sendLog(guild, { title, description, color }) {
  try {
    const logDb = db.getChannel(guild.id, 'staff_logs');
    if (!logDb) return;
    const ch = await guild.channels.fetch(logDb.channel_id).catch(() => null);
    if (!ch) return;
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color || config.colours.gold)
      .setTimestamp();
    await ch.send({ embeds: [embed] });
  } catch (err) {
    logger.error('Failed to send log', { error: err.message });
  }
}

// Logging events
client.on('guildMemberAdd', async (member) => {
  await sendLog(member.guild, {
    title: 'Member Joined',
    description: `${member} (${member.user.tag}) joined.`,
    color: 0x57f287,
  });

  // Optional: assign Unverified
  const unverified = db.getRole(member.guild.id, 'unverified');
  if (unverified) {
    await member.roles.add(unverified.role_id).catch(() => {});
  }
});

client.on('guildMemberRemove', async (member) => {
  await sendLog(member.guild, {
    title: 'Member Left',
    description: `${member.user.tag} left the server.`,
    color: 0xed4245,
  });
});

client.on('guildBanAdd', async (ban) => {
  await sendLog(ban.guild, {
    title: 'Member Banned',
    description: `${ban.user.tag} was banned.\nReason: ${ban.reason || 'No reason provided'}`,
    color: 0xed4245,
  });
});

client.on('guildBanRemove', async (ban) => {
  await sendLog(ban.guild, {
    title: 'Member Unbanned',
    description: `${ban.user.tag} was unbanned.`,
    color: 0x57f287,
  });
});

client.on('messageDelete', async (message) => {
  if (!message.guild || message.author?.bot) return;
  await sendLog(message.guild, {
    title: 'Message Deleted',
    description: `Message by ${message.author} in ${message.channel}:\n${message.content?.slice(0, 500) || '*empty*'}`,
    color: 0xfaa61a,
  });
});

client.on('error', (err) => logger.error('Client error', { error: err.message }));
process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', { error: String(err) }));

client.login(token);