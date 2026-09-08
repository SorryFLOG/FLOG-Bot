const config = require('../config');
const db = require('../database/database');
const logger = require('../utils/logger');

async function createChannels(guild, categoryMap) {
  const results = { created: 0, reused: 0, errors: [] };
  const channelMap = new Map();

  for (const [catKey, channelList] of Object.entries(config.channels)) {
    const parent = categoryMap.get(catKey);
    if (!parent) {
      results.errors.push(`Missing category for ${catKey}`);
      continue;
    }

    for (const chDef of channelList) {
      try {
        const existingDb = db.getChannel(guild.id, chDef.key);
        if (existingDb) {
          const existing = await guild.channels.fetch(existingDb.channel_id).catch(() => null);
          if (existing) {
            channelMap.set(chDef.key, existing);
            results.reused++;
            continue;
          }
        }

        const byName = guild.channels.cache.find(
          c => c.name === chDef.name && c.parentId === parent.id
        );
        if (byName) {
          db.saveChannel(guild.id, chDef.key, byName.id, byName.name, catKey);
          channelMap.set(chDef.key, byName);
          results.reused++;
          continue;
        }

        const channel = await guild.channels.create({
          name: chDef.name,
          type: chDef.type,
          parent: parent.id,
          reason: 'FLOG RP Setup Bot',
        });

        db.saveChannel(guild.id, chDef.key, channel.id, channel.name, catKey);
        channelMap.set(chDef.key, channel);
        results.created++;
        logger.info(`Created channel: ${channel.name}`);
      } catch (err) {
        logger.error(`Failed to create channel ${chDef.name}`, { error: err.message });
        results.errors.push(`${chDef.name}: ${err.message}`);
      }
    }
  }

  return { results, channelMap };
}

module.exports = { createChannels };