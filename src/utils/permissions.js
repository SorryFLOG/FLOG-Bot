const { PermissionFlagsBits } = require('discord.js');

function isOwnerOrAdmin(member) {
  if (!member) return false;
  if (member.id === member.guild.ownerId) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function getMissingBotPermissions(guild) {
  const me = guild.members.me;
  if (!me) return ['Unable to resolve bot member'];

  const required = [
    { flag: PermissionFlagsBits.ManageRoles, name: 'Manage Roles' },
    { flag: PermissionFlagsBits.ManageChannels, name: 'Manage Channels' },
    { flag: PermissionFlagsBits.ManageMessages, name: 'Manage Messages' },
    { flag: PermissionFlagsBits.ViewChannel, name: 'View Channels' },
    { flag: PermissionFlagsBits.SendMessages, name: 'Send Messages' },
    { flag: PermissionFlagsBits.EmbedLinks, name: 'Embed Links' },
    { flag: PermissionFlagsBits.ReadMessageHistory, name: 'Read Message History' },
    { flag: PermissionFlagsBits.AddReactions, name: 'Add Reactions' },
  ];

  const missing = [];
  for (const r of required) {
    if (!me.permissions.has(r.flag)) {
      missing.push(r.name);
    }
  }
  return missing;
}

module.exports = {
  isOwnerOrAdmin,
  getMissingBotPermissions,
};