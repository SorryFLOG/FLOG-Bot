const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const db = require('../database/database');
const logger = require('../utils/logger');

async function createRoles(guild) {
  const results = { created: 0, reused: 0, errors: [] };
  const roleMap = new Map();

  // Sort by position descending so higher roles are created first
  const sorted = [...config.roles].sort((a, b) => (b.position || 0) - (a.position || 0));

  for (const roleDef of sorted) {
    try {
      // Check DB first
      const existingDb = db.getRole(guild.id, roleDef.key);
      if (existingDb) {
        const existingRole = await guild.roles.fetch(existingDb.role_id).catch(() => null);
        if (existingRole) {
          roleMap.set(roleDef.key, existingRole);
          results.reused++;
          continue;
        }
      }

      // Search by name
      const byName = guild.roles.cache.find(r => r.name === roleDef.name);
      if (byName) {
        db.saveRole(guild.id, roleDef.key, byName.id, byName.name);
        roleMap.set(roleDef.key, byName);
        results.reused++;
        continue;
      }

      // Create
      const role = await guild.roles.create({
        name: roleDef.name,
        colors: { primaryColor: roleDef.colour },
        hoist: roleDef.hoist ?? false,
        mentionable: false,
        reason: 'FLOG RP Setup Bot',
      });

      db.saveRole(guild.id, roleDef.key, role.id, role.name);
      roleMap.set(roleDef.key, role);
      results.created++;
      logger.info(`Created role: ${role.name}`);
    } catch (err) {
      logger.error(`Failed to create role ${roleDef.name}`, { error: err.message });
      results.errors.push(`${roleDef.name}: ${err.message}`);
    }
  }

  // Apply staff permissions after all roles exist
  await applyStaffPermissions(guild, roleMap);

  return { results, roleMap };
}

async function applyStaffPermissions(guild, roleMap) {
  const perms = {
    owner: [
      PermissionFlagsBits.Administrator,
    ],
    management: [
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ManageNicknames,
      PermissionFlagsBits.ViewAuditLog,
    ],
    head_admin: [
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ViewAuditLog,
    ],
    senior_admin: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ViewAuditLog,
    ],
    administrator: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.KickMembers,
    ],
    moderator: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
    ],
    trial_moderator: [
      PermissionFlagsBits.ManageMessages,
    ],
  };

  for (const [key, flags] of Object.entries(perms)) {
    const role = roleMap.get(key);
    if (!role) continue;
    try {
      await role.setPermissions(flags, 'FLOG RP staff permission setup');
    } catch (err) {
      logger.error(`Failed to set permissions for ${key}`, { error: err.message });
    }
  }
}

module.exports = { createRoles };