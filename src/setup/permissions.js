const { PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../database/database');
const logger = require('../utils/logger');

async function applyPermissions(guild, roleMap, categoryMap, channelMap) {
  const results = { applied: 0, errors: [] };

  const everyone = guild.roles.everyone;
  const verified = roleMap.get('verified');
  const unverified = roleMap.get('unverified');
  const bcso = roleMap.get('bcso');
  const ems = roleMap.get('ems');
  const mechanic = roleMap.get('mechanic');
  const staffRoles = [
    roleMap.get('owner'),
    roleMap.get('management'),
    roleMap.get('head_admin'),
    roleMap.get('senior_admin'),
    roleMap.get('administrator'),
    roleMap.get('moderator'),
    roleMap.get('trial_moderator'),
  ].filter(Boolean);

  // Helper
  const deny = (perms) => perms.map(p => ({ id: p.id || p, deny: true }));
  const allow = (role, perms) => ({ id: role.id, allow: perms });

  try {
    // @everyone base
    // Information category - visible to all for welcome/rules/verification
    const infoCat = categoryMap.get('information');
    if (infoCat) {
      await infoCat.permissionOverwrites.set([
        {
          id: everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageGuild,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.MentionEveryone,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.KickMembers,
            PermissionFlagsBits.ModerateMembers,
          ],
        },
      ]);
      results.applied++;
    }

    // Restrict announcements etc. later if needed – welcome/rules/verification stay readable

    // Community – Verified only
    const communityCat = categoryMap.get('community');
    if (communityCat && verified) {
      await communityCat.permissionOverwrites.set([
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: verified.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        })),
      ]);
      results.applied++;
    }

    // Support public channels
    const supportCat = categoryMap.get('support');
    if (supportCat && verified) {
      await supportCat.permissionOverwrites.set([
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: verified.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages,
          ],
        },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        })),
      ]);
      results.applied++;
    }

    // FLOG RP city channels
    const flogCat = categoryMap.get('flog_rp');
    if (flogCat && verified) {
      await flogCat.permissionOverwrites.set([
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: verified.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AddReactions,
          ],
        },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        })),
      ]);
      results.applied++;
    }

    // BCSO
    const bcsoCat = categoryMap.get('bcso');
    if (bcsoCat) {
      const overwrites = [
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        })),
      ];
      if (bcso) {
        overwrites.push({
          id: bcso.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
          ],
        });
      }
      await bcsoCat.permissionOverwrites.set(overwrites);
      results.applied++;
    }

    // EMS
    const emsCat = categoryMap.get('ems');
    if (emsCat) {
      const overwrites = [
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        })),
      ];
      if (ems) {
        overwrites.push({
          id: ems.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
          ],
        });
      }
      await emsCat.permissionOverwrites.set(overwrites);
      results.applied++;
    }

    // Businesses
    const bizCat = categoryMap.get('businesses');
    if (bizCat && verified) {
      await bizCat.permissionOverwrites.set([
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: verified.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages,
          ],
        },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        })),
      ]);
      if (mechanic) {
        const mechCh = channelMap.get('mechanics');
        if (mechCh) {
          await mechCh.permissionOverwrites.edit(mechanic.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        }
      }
      results.applied++;
    }

    // Staff
    const staffCat = categoryMap.get('staff');
    if (staffCat) {
      await staffCat.permissionOverwrites.set([
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        })),
      ]);
      results.applied++;
    }

    // Voice
    const voiceCat = categoryMap.get('voice');
    if (voiceCat && verified) {
      await voiceCat.permissionOverwrites.set([
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
        {
          id: verified.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.UseVAD,
          ],
        },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers],
        })),
      ]);

      // BCSO / EMS / Mechanics voice restrictions
      const bcsoVoice = channelMap.get('bcso_voice');
      if (bcsoVoice && bcso) {
        await bcsoVoice.permissionOverwrites.set([
          { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
          { id: bcso.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
          ...staffRoles.map(r => ({
            id: r.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers],
          })),
        ]);
      }
      const emsVoice = channelMap.get('ems_voice');
      if (emsVoice && ems) {
        await emsVoice.permissionOverwrites.set([
          { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
          { id: ems.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
          ...staffRoles.map(r => ({
            id: r.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers],
          })),
        ]);
      }
      const mechVoice = channelMap.get('mechanics_voice');
      if (mechVoice && mechanic) {
        await mechVoice.permissionOverwrites.set([
          { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
          { id: mechanic.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
          ...staffRoles.map(r => ({
            id: r.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers],
          })),
        ]);
      }
      results.applied++;
    }

    // Tickets category – staff + ticket creators handled dynamically
    const ticketsCat = categoryMap.get('tickets');
    if (ticketsCat) {
      await ticketsCat.permissionOverwrites.set([
        { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ...staffRoles.map(r => ({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
        })),
      ]);
      results.applied++;
    }

    // Unverified restriction – only see welcome, rules, verification
    if (unverified) {
      const publicKeys = ['welcome', 'rules', 'verification'];
      for (const [key, ch] of channelMap) {
        if (!publicKeys.includes(key)) {
          try {
            await ch.permissionOverwrites.edit(unverified.id, { ViewChannel: false });
          } catch (_) {}
        }
      }
    }

    // Lock send on welcome / rules / announcements style channels
    for (const key of ['welcome', 'rules', 'verification', 'announcements', 'server_information', 'server_status', 'links']) {
      const ch = channelMap.get(key);
      if (ch) {
        try {
          await ch.permissionOverwrites.edit(everyone.id, {
            SendMessages: false,
            AddReactions: key === 'verification' ? true : false,
          });
          if (verified) {
            await ch.permissionOverwrites.edit(verified.id, { SendMessages: false });
          }
        } catch (_) {}
      }
    }

  } catch (err) {
    logger.error('Permission application error', { error: err.message });
    results.errors.push(err.message);
  }

  return results;
}

module.exports = { applyPermissions };