const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'flog-rp.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function load() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (_) {}
  return {
    guilds: {},
    roles: {},
    categories: {},
    channels: {},
    tickets: [],
    verifications: {},
    suggestions: [],
  };
}

function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

let store = load();

function setGuildSetup(guildId, complete = true) {
  if (!store.guilds[guildId]) store.guilds[guildId] = {};
  store.guilds[guildId].setup_complete = !!complete;
  store.guilds[guildId].updated_at = new Date().toISOString();
  save(store);
}

function isSetupComplete(guildId) {
  return !!(store.guilds[guildId] && store.guilds[guildId].setup_complete);
}

function saveRole(guildId, key, roleId, name) {
  const k = `${guildId}:${key}`;
  store.roles[k] = { guild_id: guildId, role_key: key, role_id: roleId, role_name: name };
  save(store);
}

function getRole(guildId, key) {
  return store.roles[`${guildId}:${key}`] || null;
}

function getAllRoles(guildId) {
  return Object.values(store.roles).filter(r => r.guild_id === guildId);
}

function saveCategory(guildId, key, categoryId, name) {
  const k = `${guildId}:${key}`;
  store.categories[k] = {
    guild_id: guildId,
    category_key: key,
    category_id: categoryId,
    category_name: name,
  };
  save(store);
}

function getCategory(guildId, key) {
  return store.categories[`${guildId}:${key}`] || null;
}

function getAllCategories(guildId) {
  return Object.values(store.categories).filter(c => c.guild_id === guildId);
}

function saveChannel(guildId, key, channelId, name, categoryKey = null) {
  const k = `${guildId}:${key}`;
  store.channels[k] = {
    guild_id: guildId,
    channel_key: key,
    channel_id: channelId,
    channel_name: name,
    category_key: categoryKey,
  };
  save(store);
}

function getChannel(guildId, key) {
  return store.channels[`${guildId}:${key}`] || null;
}

function getAllChannels(guildId) {
  return Object.values(store.channels).filter(c => c.guild_id === guildId);
}

function createTicket(guildId, channelId, userId, type) {
  const id = (store.tickets.length ? Math.max(...store.tickets.map(t => t.id)) : 0) + 1;
  store.tickets.push({
    id,
    guild_id: guildId,
    channel_id: channelId,
    user_id: userId,
    type,
    status: 'open',
    created_at: new Date().toISOString(),
    closed_at: null,
  });
  save(store);
  return id;
}

function closeTicket(channelId) {
  const t = store.tickets.find(x => x.channel_id === channelId && x.status === 'open');
  if (t) {
    t.status = 'closed';
    t.closed_at = new Date().toISOString();
    save(store);
  }
}

function getTicketByChannel(channelId) {
  return store.tickets.find(t => t.channel_id === channelId) || null;
}

function saveVerification(guildId, userId) {
  store.verifications[`${guildId}:${userId}`] = {
    guild_id: guildId,
    user_id: userId,
    verified_at: new Date().toISOString(),
  };
  save(store);
}

function isVerified(guildId, userId) {
  return !!store.verifications[`${guildId}:${userId}`];
}

function deleteGuildData(guildId) {
  delete store.guilds[guildId];
  for (const k of Object.keys(store.roles)) {
    if (store.roles[k].guild_id === guildId) delete store.roles[k];
  }
  for (const k of Object.keys(store.categories)) {
    if (store.categories[k].guild_id === guildId) delete store.categories[k];
  }
  for (const k of Object.keys(store.channels)) {
    if (store.channels[k].guild_id === guildId) delete store.channels[k];
  }
  store.tickets = store.tickets.filter(t => t.guild_id !== guildId);
  for (const k of Object.keys(store.verifications)) {
    if (store.verifications[k].guild_id === guildId) delete store.verifications[k];
  }
  store.suggestions = (store.suggestions || []).filter(s => s.guild_id !== guildId);
  save(store);
}

module.exports = {
  setGuildSetup,
  isSetupComplete,
  saveRole,
  getRole,
  getAllRoles,
  saveCategory,
  getCategory,
  getAllCategories,
  saveChannel,
  getChannel,
  getAllChannels,
  createTicket,
  closeTicket,
  getTicketByChannel,
  saveVerification,
  isVerified,
  deleteGuildData,
};