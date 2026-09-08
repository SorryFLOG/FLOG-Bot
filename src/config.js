module.exports = {
  serverName: 'FLOG RP',

  colours: {
    gold: '#C6A75E',
    black: '#000000',
    white: '#FFFFFF',
    management: '#B8860B',
    headAdmin: '#8B0000',
    seniorAdmin: '#A52A2A',
    administrator: '#D2691E',
    moderator: '#5865F2',
    trialMod: '#7289DA',
    bcso: '#1F4E79',
    ems: '#C1121F',
    mechanic: '#F59E0B',
    trucker: '#795548',
    miner: '#6B7280',
    business: '#16A34A',
    vip: '#C6A75E',
    supporter: '#9CA3AF',
    verified: '#FFFFFF',
    bots: '#5865F2',
  },

  setup: {
    roles: true,
    categories: true,
    channels: true,
    permissions: true,
    embeds: true,
    tickets: true,
    verification: true,
    logging: true,
  },

  roles: [
    { name: '👑 FLOG RP Owner', key: 'owner', colour: '#C6A75E', hoist: true, position: 100 },
    { name: '💼 Management', key: 'management', colour: '#B8860B', hoist: true, position: 99 },
    { name: '🛡️ Head Administrator', key: 'head_admin', colour: '#8B0000', hoist: true, position: 98 },
    { name: '🔨 Senior Administrator', key: 'senior_admin', colour: '#A52A2A', hoist: true, position: 97 },
    { name: '🔧 Administrator', key: 'administrator', colour: '#D2691E', hoist: true, position: 96 },
    { name: '🛡️ Moderator', key: 'moderator', colour: '#5865F2', hoist: true, position: 95 },
    { name: '🧪 Trial Moderator', key: 'trial_moderator', colour: '#7289DA', hoist: true, position: 94 },
    { name: '🚔 BCSO', key: 'bcso', colour: '#1F4E79', hoist: true, position: 80 },
    { name: '🚑 EMS', key: 'ems', colour: '#C1121F', hoist: true, position: 79 },
    { name: '🔧 Mechanic', key: 'mechanic', colour: '#F59E0B', hoist: true, position: 78 },
    { name: '🚛 Trucker', key: 'trucker', colour: '#795548', hoist: true, position: 77 },
    { name: '⛏️ Miner', key: 'miner', colour: '#6B7280', hoist: true, position: 76 },
    { name: '🏪 Business Owner', key: 'business_owner', colour: '#16A34A', hoist: true, position: 75 },
    { name: '💎 FLOG VIP', key: 'vip', colour: '#C6A75E', hoist: true, position: 50 },
    { name: '⭐ Supporter', key: 'supporter', colour: '#9CA3AF', hoist: true, position: 49 },
    { name: '🎮 Verified', key: 'verified', colour: '#FFFFFF', hoist: false, position: 20 },
    { name: '🤖 Bots', key: 'bots', colour: '#5865F2', hoist: true, position: 10 },
    { name: '❌ Unverified', key: 'unverified', colour: '#808080', hoist: false, position: 1 },
  ],

  categories: [
    { name: '📌 INFORMATION', key: 'information' },
    { name: '💬 COMMUNITY', key: 'community' },
    { name: '🎫 SUPPORT', key: 'support' },
    { name: '🏙️ FLOG RP', key: 'flog_rp' },
    { name: '🚔 BCSO', key: 'bcso' },
    { name: '🚑 EMS', key: 'ems' },
    { name: '🔧 BUSINESSES', key: 'businesses' },
    { name: '🛡️ STAFF', key: 'staff' },
    { name: '🔊 VOICE', key: 'voice' },
    { name: '🎫 TICKETS', key: 'tickets' },
  ],

  channels: {
    information: [
      { name: '👋・welcome', type: 0, key: 'welcome' },
      { name: '📜・rules', type: 0, key: 'rules' },
      { name: '✅・verification', type: 0, key: 'verification' },
      { name: '📢・announcements', type: 0, key: 'announcements' },
      { name: '📖・server-information', type: 0, key: 'server_information' },
      { name: '🟢・server-status', type: 0, key: 'server_status' },
      { name: '🔗・links', type: 0, key: 'links' },
    ],
    community: [
      { name: '💬・general', type: 0, key: 'general' },
      { name: '📸・screenshots', type: 0, key: 'screenshots' },
      { name: '🎬・clips', type: 0, key: 'clips' },
      { name: '🎭・looking-for-rp', type: 0, key: 'looking_for_rp' },
      { name: '💡・suggestions', type: 0, key: 'suggestions' },
      { name: '📊・polls', type: 0, key: 'polls' },
    ],
    support: [
      { name: '🎫・create-ticket', type: 0, key: 'create_ticket' },
      { name: '❓・help', type: 0, key: 'help' },
      { name: '🐛・bug-reports', type: 0, key: 'bug_reports' },
      { name: '🚨・player-reports', type: 0, key: 'player_reports' },
    ],
    flog_rp: [
      { name: '📰・city-news', type: 0, key: 'city_news' },
      { name: '🚨・wanted', type: 0, key: 'wanted' },
      { name: '💼・job-board', type: 0, key: 'job_board' },
      { name: '🚗・vehicle-market', type: 0, key: 'vehicle_market' },
      { name: '🏪・businesses', type: 0, key: 'businesses' },
      { name: '🎰・diamond-casino', type: 0, key: 'diamond_casino' },
    ],
    bcso: [
      { name: '📢・bcso-announcements', type: 0, key: 'bcso_announcements' },
      { name: '💬・bcso-chat', type: 0, key: 'bcso_chat' },
      { name: '👮・bcso-roster', type: 0, key: 'bcso_roster' },
      { name: '📚・bcso-resources', type: 0, key: 'bcso_resources' },
      { name: '📻・bcso-radio', type: 0, key: 'bcso_radio' },
    ],
    ems: [
      { name: '📢・ems-announcements', type: 0, key: 'ems_announcements' },
      { name: '💬・ems-chat', type: 0, key: 'ems_chat' },
      { name: '👨‍⚕️・ems-roster', type: 0, key: 'ems_roster' },
      { name: '📚・ems-resources', type: 0, key: 'ems_resources' },
    ],
    businesses: [
      { name: '🔧・mechanics', type: 0, key: 'mechanics' },
      { name: '🚛・trucking', type: 0, key: 'trucking' },
      { name: '⛏️・mining', type: 0, key: 'mining' },
      { name: '🏪・business-discussion', type: 0, key: 'business_discussion' },
      { name: '📝・business-applications', type: 0, key: 'business_applications' },
    ],
    staff: [
      { name: '💬・staff-chat', type: 0, key: 'staff_chat' },
      { name: '📢・staff-announcements', type: 0, key: 'staff_announcements' },
      { name: '🎫・staff-tickets', type: 0, key: 'staff_tickets' },
      { name: '🚨・player-reports', type: 0, key: 'staff_player_reports' },
      { name: '⚖️・punishments', type: 0, key: 'punishments' },
      { name: '🐛・bug-tracking', type: 0, key: 'bug_tracking' },
      { name: '📋・staff-logs', type: 0, key: 'staff_logs' },
    ],
    voice: [
      { name: '🔊・Lobby', type: 2, key: 'lobby' },
      { name: '🎮・RP Lounge', type: 2, key: 'rp_lounge' },
      { name: '🚔・BCSO', type: 2, key: 'bcso_voice' },
      { name: '🚑・EMS', type: 2, key: 'ems_voice' },
      { name: '🔧・Mechanics', type: 2, key: 'mechanics_voice' },
      { name: '😎・Chill', type: 2, key: 'chill' },
    ],
  },

  embeds: {
    welcome: {
      title: '🇬🇧 Welcome to FLOG RP',
      description: `Welcome to FLOG RP.

FLOG RP is a UK-based FiveM roleplay community built around serious roleplay, immersive experiences and an active community.

🚔 BCSO
🚑 EMS
🔧 Mechanics
🚛 Trucking
⛏️ Mining
🏪 Businesses
🎰 Diamond Casino

Before joining the city, please make sure you read the rules and complete verification.

Your story. Your choices. Your FLOG.

🇬🇧 FLOG RP
Serious Roleplay. Real Stories.`,
    },
    rules: {
      title: '📜 FLOG RP Rules',
      description: `1. Respect everyone
Treat players, staff and community members with respect.

2. No RDM
Do not randomly kill another player without valid roleplay.

3. No VDM
Do not use vehicles as weapons without valid roleplay.

4. No Metagaming
Do not use information obtained outside roleplay.

5. No Powergaming
Do not force actions or outcomes onto another player's character.

6. Value Your Life
Your character should value their life in dangerous situations.

7. No FailRP
Remain realistic and stay within the roleplay environment.

8. No Combat Logging
Do not leave the server to avoid roleplay, arrest or consequences.

9. No Exploiting
Do not abuse bugs, glitches, exploits or unauthorized scripts.

10. Follow Staff Instructions
Staff decisions must be respected. Appeals can be made through support.

11. No Harassment
Bullying, discrimination, threats or targeted harassment are prohibited.

12. Use Common Sense
If something clearly ruins another player's experience, don't do it.`,
      footer: 'FLOG RP • UK FiveM Roleplay',
    },
    verification: {
      title: '🇬🇧 FLOG RP Verification',
      description: `Welcome to FLOG RP.

To access the community, click the button below to verify that you have read and agree to the server rules.`,
    },
    ticket: {
      title: '🎫 FLOG RP Support',
      description: `Need help?

Choose the type of ticket you need below.`,
    },
  },

  ticketTypes: [
    { id: 'general', label: '🎫 General Support', emoji: '🎫' },
    { id: 'player_report', label: '🚨 Player Report', emoji: '🚨' },
    { id: 'staff_report', label: '🛡️ Staff Report', emoji: '🛡️' },
    { id: 'business', label: '🏪 Business Support', emoji: '🏪' },
    { id: 'bug', label: '🐛 Bug Report', emoji: '🐛' },
    { id: 'donation', label: '💎 Donation Support', emoji: '💎' },
  ],
};