const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../config');
const logger = require('../utils/logger');

async function sendSetupEmbeds(guild, channelMap) {
  const results = { sent: 0, errors: [] };
  const gold = config.colours.gold;

  // Welcome
  try {
    const welcomeCh = channelMap.get('welcome');
    if (welcomeCh) {
      const embed = new EmbedBuilder()
        .setTitle(config.embeds.welcome.title)
        .setDescription(config.embeds.welcome.description)
        .setColor(gold)
        .setTimestamp();
      await welcomeCh.send({ embeds: [embed] });
      results.sent++;
    }
  } catch (err) {
    results.errors.push(`welcome: ${err.message}`);
  }

  // Rules
  try {
    const rulesCh = channelMap.get('rules');
    if (rulesCh) {
      const embed = new EmbedBuilder()
        .setTitle(config.embeds.rules.title)
        .setDescription(config.embeds.rules.description)
        .setColor(gold)
        .setFooter({ text: config.embeds.rules.footer })
        .setTimestamp();
      await rulesCh.send({ embeds: [embed] });
      results.sent++;
    }
  } catch (err) {
    results.errors.push(`rules: ${err.message}`);
  }

  // Verification
  try {
    const verCh = channelMap.get('verification');
    if (verCh) {
      const embed = new EmbedBuilder()
        .setTitle(config.embeds.verification.title)
        .setDescription(config.embeds.verification.description)
        .setColor(gold)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('flog_verify')
          .setLabel('✅ Verify')
          .setStyle(ButtonStyle.Success)
      );

      await verCh.send({ embeds: [embed], components: [row] });
      results.sent++;
    }
  } catch (err) {
    results.errors.push(`verification: ${err.message}`);
  }

  // Ticket panel
  try {
    const ticketCh = channelMap.get('create_ticket');
    if (ticketCh) {
      const embed = new EmbedBuilder()
        .setTitle(config.embeds.ticket.title)
        .setDescription(config.embeds.ticket.description)
        .setColor(gold)
        .setTimestamp();

      const rows = [];
      let current = new ActionRowBuilder();
      let count = 0;

      for (const t of config.ticketTypes) {
        if (count === 5) {
          rows.push(current);
          current = new ActionRowBuilder();
          count = 0;
        }
        current.addComponents(
          new ButtonBuilder()
            .setCustomId(`flog_ticket_${t.id}`)
            .setLabel(t.label)
            .setStyle(ButtonStyle.Primary)
        );
        count++;
      }
      if (count > 0) rows.push(current);

      await ticketCh.send({ embeds: [embed], components: rows });
      results.sent++;
    }
  } catch (err) {
    results.errors.push(`tickets: ${err.message}`);
  }

  return results;
}

module.exports = { sendSetupEmbeds };