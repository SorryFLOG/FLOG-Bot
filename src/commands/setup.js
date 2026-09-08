const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const config = require('../config');
const { isOwnerOrAdmin } = require('../utils/permissions');
const { runFullSetup, resetServer, getPreviewStats } = require('../setup/setupServer');
const db = require('../database/database');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('FLOG RP server setup commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('preview').setDescription('Preview what the setup will create')
    )
    .addSubcommand(sub =>
      sub.setName('create').setDescription('Create the full FLOG RP server structure')
    )
    .addSubcommand(sub =>
      sub.setName('reset').setDescription('Remove bot-created roles, channels and categories')
    )
    .addSubcommand(sub =>
      sub.setName('status').setDescription('Show current setup status')
    )
    .addSubcommand(sub =>
      sub.setName('permissions').setDescription('Re-apply permission overwrites')
    )
    .addSubcommand(sub =>
      sub.setName('roles').setDescription('Create or refresh roles only')
    )
    .addSubcommand(sub =>
      sub.setName('channels').setDescription('Create or refresh categories & channels only')
    )
    .addSubcommand(sub =>
      sub.setName('embeds').setDescription('Re-send welcome, rules, verification and ticket embeds')
    )
    .addSubcommand(sub =>
      sub.setName('logs').setDescription('Show recent setup / bot logs info')
    ),

  async execute(interaction) {
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({
        content: 'Only the server owner or users with Administrator permission can run setup commands.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'preview') {
      const stats = getPreviewStats();
      const embed = new EmbedBuilder()
        .setTitle('FLOG RP SETUP PREVIEW')
        .setColor(config.colours.gold)
        .setDescription(
          [
            `**Roles:** ${stats.roles}`,
            `**Categories:** ${stats.categories}`,
            `**Text Channels:** ${stats.textChannels}`,
            `**Voice Channels:** ${stats.voiceChannels}`,
            `**Verification:** Enabled`,
            `**Tickets:** Enabled`,
            `**Logging:** Enabled`,
          ].join('\n')
        )
        .setFooter({ text: 'FLOG RP Setup Bot' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('flog_setup_confirm_create')
          .setLabel('Create Setup')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('flog_setup_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'create') {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ FLOG RP Setup')
        .setColor(config.colours.gold)
        .setDescription(
          `This will create the FLOG RP roles, categories, channels and permissions.

Existing channels and roles will **NOT** be deleted unless \`/setup reset\` is explicitly used.

Continue?`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('flog_setup_confirm_create')
          .setLabel('✅ Confirm')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('flog_setup_cancel')
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'reset') {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ DANGER')
        .setColor(0xff0000)
        .setDescription(
          `This will remove FLOG RP channels and roles **created by this bot**.

This cannot be easily undone.

Are you absolutely sure?`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('flog_setup_confirm_reset')
          .setLabel('Yes, delete everything')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('flog_setup_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'status') {
      const complete = db.isSetupComplete(interaction.guildId);
      const roles = db.getAllRoles(interaction.guildId);
      const cats = db.getAllCategories(interaction.guildId);
      const channels = db.getAllChannels(interaction.guildId);

      const embed = new EmbedBuilder()
        .setTitle('FLOG RP Setup Status')
        .setColor(config.colours.gold)
        .addFields(
          { name: 'Setup Complete', value: complete ? 'Yes' : 'No', inline: true },
          { name: 'Roles tracked', value: String(roles.length), inline: true },
          { name: 'Categories tracked', value: String(cats.length), inline: true },
          { name: 'Channels tracked', value: String(channels.length), inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'logs') {
      return interaction.reply({
        content: 'Logs are written to `logs/bot.log` on the host machine. Check that file for detailed output.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // For roles / channels / embeds / permissions – run partial or full via same confirmation pattern
    // For simplicity we route them through the same create flow with confirmation
    const embed = new EmbedBuilder()
      .setTitle('⚠️ FLOG RP Setup')
      .setColor(config.colours.gold)
      .setDescription(`This will run the **${sub}** step of the FLOG RP setup.\n\nContinue?`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`flog_setup_partial_${sub}`)
        .setLabel('✅ Confirm')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('flog_setup_cancel')
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  },
};