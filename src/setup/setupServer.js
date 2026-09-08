const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { createRoles } = require('./roles');
const { createCategories } = require('./categories');
const { createChannels } = require('./channels');
const { applyPermissions } = require('./permissions');
const { sendSetupEmbeds } = require('./embeds');
const db = require('../database/database');
const logger = require('../utils/logger');
const { getMissingBotPermissions } = require('../utils/permissions');

async function runFullSetup(guild, progressMessage) {
  const update = async (text) => {
    try {
      await progressMessage.edit({ content: text, embeds: [], components: [] });
    } catch (_) {}
  };

  // Step 1 – permissions check
  const missing = getMissingBotPermissions(guild);
  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing bot permissions:\n${missing.map(m => `• ${m}`).join('\n')}`,
    };
  }

  await update('🇬🇧 **FLOG RP SETUP**\n\n⏳ Checking permissions… ✅\n⏳ Creating roles…');

  // Step 2 – roles
  const { results: roleResults, roleMap } = await createRoles(guild);
  await update(
    `🇬🇧 **FLOG RP SETUP**\n\n✅ Roles created (${roleResults.created} new, ${roleResults.reused} reused)\n⏳ Creating categories…`
  );

  // Step 3 – categories
  const { results: catResults, categoryMap } = await createCategories(guild);
  await update(
    `🇬🇧 **FLOG RP SETUP**\n\n✅ Roles created\n✅ Categories created (${catResults.created} new, ${catResults.reused} reused)\n⏳ Creating channels…`
  );

  // Step 4 – channels
  const { results: chResults, channelMap } = await createChannels(guild, categoryMap);
  await update(
    `🇬🇧 **FLOG RP SETUP**\n\n✅ Roles created\n✅ Categories created\n✅ Channels created (${chResults.created} new, ${chResults.reused} reused)\n⏳ Configuring permissions…`
  );

  // Step 5 – permissions
  const permResults = await applyPermissions(guild, roleMap, categoryMap, channelMap);
  await update(
    `🇬🇧 **FLOG RP SETUP**\n\n✅ Roles created\n✅ Categories created\n✅ Channels created\n✅ Permissions configured\n⏳ Sending embeds…`
  );

  // Step 6 – embeds
  const embedResults = await sendSetupEmbeds(guild, channelMap);
  await update(
    `🇬🇧 **FLOG RP SETUP**\n\n✅ Roles created\n✅ Categories created\n✅ Channels created\n✅ Permissions configured\n✅ Welcome / Rules / Verification / Tickets configured\n⏳ Finalising…`
  );

  // Step 7 – mark complete
  db.setGuildSetup(guild.id, true);

  const summary = [
    '🇬🇧 **FLOG RP SETUP**',
    '',
    `✅ Roles created (${roleResults.created} new, ${roleResults.reused} reused)`,
    `✅ Categories created (${catResults.created} new, ${catResults.reused} reused)`,
    `✅ Channels created (${chResults.created} new, ${chResults.reused} reused)`,
    `✅ Permissions configured`,
    `✅ Welcome system configured`,
    `✅ Verification configured`,
    `✅ Ticket system configured`,
    `✅ Logging configured`,
    '',
    '🎉 **FLOG RP setup complete!**',
  ].join('\n');

  const errors = [
    ...roleResults.errors,
    ...catResults.errors,
    ...chResults.errors,
    ...permResults.errors,
    ...embedResults.errors,
  ];

  if (errors.length > 0) {
    logger.warn('Setup completed with some errors', { errors });
  }

  return { success: true, message: summary, errors };
}

async function resetServer(guild) {
  const roles = db.getAllRoles(guild.id);
  const categories = db.getAllCategories(guild.id);
  const channels = db.getAllChannels(guild.id);

  let deleted = { roles: 0, channels: 0, categories: 0 };

  // Delete channels first
  for (const ch of channels) {
    try {
      const channel = await guild.channels.fetch(ch.channel_id).catch(() => null);
      if (channel) {
        await channel.delete('FLOG RP Setup Bot reset');
        deleted.channels++;
      }
    } catch (err) {
      logger.error(`Failed to delete channel ${ch.channel_name}`, { error: err.message });
    }
  }

  // Delete categories
  for (const cat of categories) {
    try {
      const category = await guild.channels.fetch(cat.category_id).catch(() => null);
      if (category) {
        await category.delete('FLOG RP Setup Bot reset');
        deleted.categories++;
      }
    } catch (err) {
      logger.error(`Failed to delete category ${cat.category_name}`, { error: err.message });
    }
  }

  // Delete roles (skip @everyone and managed)
  for (const r of roles) {
    try {
      const role = await guild.roles.fetch(r.role_id).catch(() => null);
      if (role && !role.managed && role.id !== guild.id) {
        await role.delete('FLOG RP Setup Bot reset');
        deleted.roles++;
      }
    } catch (err) {
      logger.error(`Failed to delete role ${r.role_name}`, { error: err.message });
    }
  }

  db.deleteGuildData(guild.id);

  return deleted;
}

function getPreviewStats() {
  const roleCount = config.roles.length;
  const categoryCount = config.categories.length;
  let textCount = 0;
  let voiceCount = 0;
  for (const list of Object.values(config.channels)) {
    for (const ch of list) {
      if (ch.type === 0) textCount++;
      if (ch.type === 2) voiceCount++;
    }
  }

  return {
    roles: roleCount,
    categories: categoryCount,
    textChannels: textCount,
    voiceChannels: voiceCount,
  };
}

module.exports = {
  runFullSetup,
  resetServer,
  getPreviewStats,
};