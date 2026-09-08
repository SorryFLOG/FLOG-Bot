const config = require('../config');
const db = require('../database/database');
const logger = require('../utils/logger');

async function createCategories(guild) {
  const results = { created: 0, reused: 0, errors: [] };
  const categoryMap = new Map();

  for (const catDef of config.categories) {
    try {
      const existingDb = db.getCategory(guild.id, catDef.key);
      if (existingDb) {
        const existing = await guild.channels.fetch(existingDb.category_id).catch(() => null);
        if (existing && existing.type === 4) {
          categoryMap.set(catDef.key, existing);
          results.reused++;
          continue;
        }
      }

      const byName = guild.channels.cache.find(
        c => c.type === 4 && c.name === catDef.name
      );
      if (byName) {
        db.saveCategory(guild.id, catDef.key, byName.id, byName.name);
        categoryMap.set(catDef.key, byName);
        results.reused++;
        continue;
      }

      const category = await guild.channels.create({
        name: catDef.name,
        type: 4,
        reason: 'FLOG RP Setup Bot',
      });

      db.saveCategory(guild.id, catDef.key, category.id, category.name);
      categoryMap.set(catDef.key, category);
      results.created++;
      logger.info(`Created category: ${category.name}`);
    } catch (err) {
      logger.error(`Failed to create category ${catDef.name}`, { error: err.message });
      results.errors.push(`${catDef.name}: ${err.message}`);
    }
  }

  return { results, categoryMap };
}

module.exports = { createCategories };