// ============================================================
//  DICEFORGE BOT v2 — Slash Commands + Autocomplétion
//  npm install discord.js rcon-client axios @discordjs/voice @discordjs/opus ffmpeg-static
// ============================================================

const {
  Client, GatewayIntentBits, EmbedBuilder, ActivityType,
  REST, Routes, SlashCommandBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');
const { Rcon } = require('rcon-client');
const fs = require('fs');
const axios = require('axios');
const { exec, spawn } = require('child_process');
const path = require('path');
const {
  joinVoiceChannel, createAudioPlayer, createAudioResource,
  AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection, entersState,
} = require('@discordjs/voice');
const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

// ============================================================
//  ⚙️  CONFIGURATION — À MODIFIER
// ============================================================
const CONFIG = {
  DISCORD_TOKEN:      'VOTRE_TOKEN_DISCORD',
  CLIENT_ID:          'VOTRE_CLIENT_ID',     // ID de ton application Discord Developer
  GUILD_ID:           'VOTRE_GUILD_ID',      // ID de ton serveur Discord

  LOGS_CHANNEL_ID:     'ID_SALON_LOGS',
  ALERTS_CHANNEL_ID:   'ID_SALON_ALERTES',
  COMMANDS_CHANNEL_ID: 'ID_SALON_COMMANDES',

  WELCOME_CHANNEL_ID:  'ID_SALON_BIENVENUE', // Salon messages de bienvenue et au revoir
  RAW_LOGS_CHANNEL_ID: 'ID_SALON_LOGS_BRUTS', // Salon logs bruts complets
  MODERATION_CHANNEL_ID: 'ID_SALON_MODERATION', // Salon modéré (anti-liens + anti-insultes)
  PRESENTATION_CHANNEL_ID: 'ID_SALON_PRESENTATION', // Salon présentation serveur
  MEMBER_ROLE_ID: 'ID_ROLE_MEMBRE', // Rôle attribué après lecture des règles

  LIENS_CHANNEL_ID: 'ID_SALON_LIENS',  // Salon liens utiles
  TICKET_CHANNEL_ID: 'ID_SALON_TICKETS', // Salon tickets
  WEBSITE_URL: 'https://diceforgeproject.netlify.app', // URL du site DiceForge

  ROLES_CHANNEL_ID: 'ID_SALON_ROLES',  // Salon rôles
  ROLE_NOTIF_ID:    'ID_ROLE_NOTIF',  // Rôle Notifications
  ROLE_PVP_ID:      'ID_ROLE_PVP',  // Rôle PvP
  ROLE_BUILDER_ID:  'ID_ROLE_BUILDER',  // Rôle Builder

  MC_LOGS_PATH: 'CHEMIN_VERS_LOGS_MC',
  MC_ADDRESS:   'VOTRE_ADRESSE_SERVEUR_MC',

  RCON_HOST:     '127.0.0.1',
  RCON_PORT:     25575,
  RCON_PASSWORD: 'VOTRE_MOT_DE_PASSE_RCON',

  // Chemin vers le fichier de démarrage du serveur
  SERVER_START_BAT: 'CHEMIN_VERS_START_BAT',

  ADMIN_ROLE_ID: 'ID_ROLE_ADMIN',

  STATUS_CHECK_INTERVAL: 300000, // 5 minutes
  LOGS_READ_INTERVAL:    2000,

  MUSIC_VOICE_CHANNEL_ID: 'ID_SALON_VOCAL_MUSIQUE', // Salon vocal ├・🎵・radio diceforge
  MUSIC_DIR: 'CHEMIN_VERS_DOSSIER_MUSIQUE', // Dossier des fichiers audio
};
// ============================================================

// ── LISTE DES COMMANDES MINECRAFT AVEC AUTOCOMPLÉTION ──────
const MC_COMMANDS = [
  { name: 'say <message>',                      desc: 'Envoyer un message à tous les joueurs' },
  { name: 'kick <joueur> [raison]',             desc: 'Expulser un joueur' },
  { name: 'ban <joueur> [raison]',              desc: 'Bannir un joueur définitivement' },
  { name: 'ban-ip <joueur>',                    desc: 'Bannir l\'IP d\'un joueur' },
  { name: 'pardon <joueur>',                    desc: 'Débannir un joueur' },
  { name: 'op <joueur>',                        desc: 'Donner les droits opérateur' },
  { name: 'deop <joueur>',                      desc: 'Retirer les droits opérateur' },
  { name: 'tp <joueur> <destination>',          desc: 'Téléporter un joueur' },
  { name: 'give <joueur> <item> [quantité]',    desc: 'Donner un objet à un joueur' },
  { name: 'gamemode survival <joueur>',         desc: 'Mode survie' },
  { name: 'gamemode creative <joueur>',         desc: 'Mode créatif' },
  { name: 'gamemode adventure <joueur>',        desc: 'Mode aventure' },
  { name: 'gamemode spectator <joueur>',        desc: 'Mode spectateur' },
  { name: 'time set day',                       desc: 'Mettre le jour' },
  { name: 'time set night',                     desc: 'Mettre la nuit' },
  { name: 'time set noon',                      desc: 'Mettre midi' },
  { name: 'weather clear',                      desc: 'Mettre le beau temps' },
  { name: 'weather rain',                       desc: 'Mettre la pluie' },
  { name: 'weather thunder',                    desc: 'Mettre l\'orage' },
  { name: 'whitelist add <joueur>',             desc: 'Ajouter à la whitelist' },
  { name: 'whitelist remove <joueur>',          desc: 'Retirer de la whitelist' },
  { name: 'whitelist list',                     desc: 'Voir la whitelist' },
  { name: 'whitelist on',                       desc: 'Activer la whitelist' },
  { name: 'whitelist off',                      desc: 'Désactiver la whitelist' },
  { name: 'list',                               desc: 'Voir les joueurs en ligne' },
  { name: 'stop',                               desc: 'Arrêter le serveur' },
  { name: 'reload',                             desc: 'Recharger la configuration' },
  { name: 'save-all',                           desc: 'Sauvegarder le monde' },
  { name: 'kill <joueur>',                      desc: 'Tuer un joueur' },
  { name: 'clear <joueur>',                     desc: 'Vider l\'inventaire d\'un joueur' },
  { name: 'xp add <joueur> <montant>',          desc: 'Donner de l\'expérience' },
  { name: 'difficulty peaceful',                desc: 'Difficulté paisible' },
  { name: 'difficulty easy',                    desc: 'Difficulté facile' },
  { name: 'difficulty normal',                  desc: 'Difficulté normale' },
  { name: 'difficulty hard',                    desc: 'Difficulté difficile' },
  { name: 'gamerule keepInventory true',        desc: 'Garder l\'inventaire à la mort' },
  { name: 'gamerule keepInventory false',       desc: 'Perdre l\'inventaire à la mort' },
  { name: 'gamerule doDaylightCycle false',     desc: 'Bloquer le cycle jour/nuit' },
  { name: 'gamerule doDaylightCycle true',      desc: 'Activer le cycle jour/nuit' },
  { name: 'gamerule doMobSpawning false',       desc: 'Désactiver le spawn de mobs' },
  { name: 'gamerule doMobSpawning true',        desc: 'Activer le spawn de mobs' },
  { name: 'gamerule pvp false',                 desc: 'Désactiver le PvP' },
  { name: 'gamerule pvp true',                  desc: 'Activer le PvP' },
  { name: 'title <joueur> title {"text":"msg"}',desc: 'Afficher un titre à l\'écran' },
  { name: 'summon <entité> <x> <y> <z>',        desc: 'Invoquer une entité' },
  { name: 'effect give <joueur> <effet>',        desc: 'Donner un effet de potion' },
  { name: 'effect clear <joueur>',              desc: 'Retirer tous les effets' },
];

// ── ENREGISTREMENT DES SLASH COMMANDS ──────────────────────
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('cmd')
      .setDescription('⚙️ Exécuter une commande Minecraft (avec autocomplétion)')
      .addStringOption(opt =>
        opt.setName('commande')
          .setDescription('Commande à exécuter (sans le /)')
          .setRequired(true)
          .setAutocomplete(true)
      ),
    new SlashCommandBuilder()
      .setName('status')
      .setDescription('📊 Voir le statut du serveur DiceForge'),
    new SlashCommandBuilder()
      .setName('players')
      .setDescription('👥 Voir les joueurs en ligne'),
    new SlashCommandBuilder()
      .setName('say')
      .setDescription('💬 Envoyer un message dans le chat Minecraft')
      .addStringOption(opt =>
        opt.setName('message').setDescription('Message à envoyer').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('kick')
      .setDescription('👢 Expulser un joueur')
      .addStringOption(opt =>
        opt.setName('joueur').setDescription('Nom du joueur').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('raison').setDescription('Raison').setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('ban')
      .setDescription('🔨 Bannir un joueur')
      .addStringOption(opt =>
        opt.setName('joueur').setDescription('Nom du joueur').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('raison').setDescription('Raison').setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('start')
      .setDescription('▶️ Démarrer le serveur Minecraft'),
    new SlashCommandBuilder()
      .setName('stop')
      .setDescription('🛑 Arrêter le serveur Minecraft'),
    new SlashCommandBuilder()
      .setName('play')
      .setDescription('🎵 Démarrer la radio DiceForge dans ton salon vocal'),
    new SlashCommandBuilder()
      .setName('stopmusic')
      .setDescription('⏹️ Arrêter la radio DiceForge et quitter le salon vocal'),
    new SlashCommandBuilder()
      .setName('maintenance')
      .setDescription('🔧 Activer la maintenance (arrête playit.gg + alerte le serveur)')
      .addStringOption(opt =>
        opt.setName('motif')
          .setDescription('Raison de la maintenance')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('duree')
          .setDescription('Durée estimée (ex: 30 minutes, 1 heure...)')
          .setRequired(true)
      ),
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);
  try {
    console.log('⏳ Enregistrement des slash commands...');
    await rest.put(Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID), { body: commands });
    console.log('✅ Slash commands enregistrées !');
  } catch (e) {
    console.error('❌ Erreur enregistrement :', e);
  }
}

// ── CLIENT ─────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

let lastLogSize = 0;
let serverWasOnline = true;

client.once('ready', async () => {
  console.log(`✅ DiceForge Bot connecté : ${client.user.tag}`);
  client.user.setActivity('DiceForge | /help', { type: ActivityType.Watching });
  await registerCommands();
  startLogWatcher();
  startStatusChecker();
  await sendPresentationMessage();
  await sendLiensMessage();
  await sendTicketMessage();
  await sendRolesMessage();
  // Radio démarrée manuellement via /play
});

// ── MESSAGE DE PRÉSENTATION ────────────────────────────────
async function sendPresentationMessage() {
  const ch = client.channels.cache.get(CONFIG.PRESENTATION_CHANNEL_ID);
  if (!ch) { console.error('❌ Salon présentation introuvable.'); return; }

  // Supprimer les anciens messages du bot dans ce salon
  try {
    const messages = await ch.messages.fetch({ limit: 20 });
    const botMsgs = messages.filter(m => m.author.id === client.user.id);
    for (const [, msg] of botMsgs) await msg.delete().catch(() => {});
  } catch (e) {}

  const embed = new EmbedBuilder()
    .setColor('#e05c3a')
    .setTitle('⚔️ Bienvenue sur DiceForge !')
    .setDescription(
      `**DiceForge** est un serveur Minecraft **Java** survivaliste où chaque joueur forge sa propre légende.\n\n` +
      `Bâtis ta base, rejoins une faction, affronte d'autres joueurs et domine le classement.\n` +
      `Que tu sois un bâtisseur, un guerrier ou un stratège — ta place est ici.`
    )
    .addFields(
      {
        name: '🎮 Informations du serveur',
        value:
          `> **Adresse :** \`${CONFIG.MC_ADDRESS}\`\n` +
          `> **Version :** Java 1.21 — Crack accepté\n` +
          `> **Type :** Survie / PvP / Factions`,
        inline: false,
      },
      {
        name: '📜 Règles essentielles',
        value:
          `> ❌ No hack, no triche, no exploit\n` +
          `> 🤝 Respect entre joueurs obligatoire\n` +
          `> 🔗 Pas de pub ou lien non autorisé\n` +
          `> ⚔️ Le PvP est autorisé hors zones protégées`,
        inline: false,
      },
      {
        name: '🏆 Ce qui t\'attend',
        value:
          `> 🗡️ Guerres de factions épiques\n` +
          `> 🏗️ Construction libre & créative\n` +
          `> 🎲 Events organisés régulièrement\n` +
          `> 🌐 Communauté active et accueillante`,
        inline: false,
      }
    )
    .setImage('https://i.imgur.com/your-banner.png') // optionnel — remplace par une vraie URL de bannière
    .setFooter({ text: 'DiceForge — Forge ta légende ⚔️  •  Clique sur le bouton pour accéder au serveur' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('accept_rules')
      .setLabel('✅  J\'ai lu et accepté les règles')
      .setStyle(ButtonStyle.Success)
  );

  await ch.send({ embeds: [embed], components: [row] });
  console.log('✅ Message de présentation envoyé.');
}

// ── SALON RÔLES ────────────────────────────────────────────
async function sendRolesMessage() {
  const ch = client.channels.cache.get(CONFIG.ROLES_CHANNEL_ID);
  if (!ch) { console.error('❌ Salon rôles introuvable.'); return; }

  try {
    const messages = await ch.messages.fetch({ limit: 20 });
    const botMsgs = messages.filter(m =>
      m.author.id === client.user.id &&
      m.components?.length > 0 &&
      m.components[0]?.components?.some(c => c.customId === 'role_notif')
    );
    if (botMsgs.size > 0) {
      console.log('ℹ️ Message rôles déjà présent, skip.');
      return;
    }
  } catch (e) {}

  const embed = new EmbedBuilder()
    .setColor('#e05c3a')
    .setTitle('🎭  Choisissez vos rôles — DiceForge')
    .setDescription(
      `Clique sur les boutons ci-dessous pour recevoir ou retirer un rôle.\n\n` +
      `> 🔔 **Notifications** — Sois alerté des annonces et événements du serveur\n` +
      `> ⚔️ **PvP** — Indique que tu participes au PvP sur DiceForge\n` +
      `> 🏗️ **Builder** — Indique que tu es un bâtisseur sur DiceForge\n\n` +
      `*Clique une seconde fois pour retirer le rôle.*`
    )
    .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('role_notif')
      .setLabel('🔔  Notifications')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('role_pvp')
      .setLabel('⚔️  PvP')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('role_builder')
      .setLabel('🏗️  Builder')
      .setStyle(ButtonStyle.Primary),
  );

  await ch.send({ embeds: [embed], components: [row] });
  console.log('✅ Message rôles envoyé.');
}

// ── LIENS UTILES ───────────────────────────────────────────
async function sendLiensMessage() {
  const ch = client.channels.cache.get(CONFIG.LIENS_CHANNEL_ID);
  if (!ch) { console.error('❌ Salon liens introuvable.'); return; }

  try {
    const messages = await ch.messages.fetch({ limit: 20 });
    const botMsgs = messages.filter(m => m.author.id === client.user.id);
    for (const [, msg] of botMsgs) await msg.delete().catch(() => {});
  } catch (e) {}

  const embedLiens = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🔗  Liens utiles — DiceForge')
    .setDescription('Retrouve ici tous les liens essentiels de la communauté DiceForge.')
    .addFields(
      {
        name: '🌐  Site officiel',
        value: `> Actualités, guides, classements et infos du serveur.\n> 👉 [diceforgeproject.netlify.app](${CONFIG.WEBSITE_URL})`,
        inline: false,
      },
      {
        name: '🎮  Rejoindre le serveur Minecraft',
        value:
          `> **Version :** Java 1.21 — Crack accepté\n` +
          `> **Adresse :** \`${CONFIG.MC_ADDRESS}\`\n` +
          `> Lance Minecraft, clique sur **Multijoueur → Ajouter un serveur** et colle l'adresse.`,
        inline: false,
      },
    )
    .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
    .setTimestamp();

  const rowLiens = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🌐  Site web')
      .setURL(CONFIG.WEBSITE_URL)
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel('🎮  Adresse MC')
      .setCustomId('copy_mc_address')
      .setStyle(ButtonStyle.Secondary),
  );

  await ch.send({ embeds: [embedLiens], components: [rowLiens] });
  console.log('✅ Message liens utiles envoyé.');
}

// ── SYSTÈME DE TICKETS ─────────────────────────────────────
const TICKET_TYPES = [
  { id: 'ticket_general',    emoji: '💬', label: 'Support général',    color: '#5865F2', desc: 'Une question, un problème général sur le serveur.' },
  { id: 'ticket_technique',  emoji: '🔧', label: 'Problème technique', color: '#f0c040', desc: 'Bug, lag, crash ou souci de connexion.' },
  { id: 'ticket_report',     emoji: '🚨', label: 'Report joueur',      color: '#e05c3a', desc: 'Signaler un comportement abusif, un cheateur.' },
  { id: 'ticket_candidature',emoji: '⭐', label: 'Candidature staff',  color: '#4adf80', desc: 'Postuler pour rejoindre l\'équipe DiceForge.' },
];

const openTickets = new Map(); // userId → channelId

async function sendTicketMessage() {
  const ch = client.channels.cache.get(CONFIG.TICKET_CHANNEL_ID);
  if (!ch) return;

  // Chercher uniquement parmi les msgs récents du bot (on cherche celui qui contient le customId ticket_general)
  try {
    const messages = await ch.messages.fetch({ limit: 20 });
    const ticketMsg = messages.find(m =>
      m.author.id === client.user.id &&
      m.components?.length > 0 &&
      m.components[0]?.components?.some(c => c.customId === 'ticket_general')
    );
    if (ticketMsg) {
      console.log('ℹ️ Message ticket déjà présent, skip.');
      return;
    }
  } catch (e) {}

  const embedTicket = new EmbedBuilder()
    .setColor('#e05c3a')
    .setTitle('🎫  Ouvrir un ticket — Support DiceForge')
    .setDescription(
      `Besoin d'aide ou tu veux contacter l'équipe ?\n` +
      `Clique sur le bouton correspondant à ta demande ci-dessous.\n\n` +
      `> 💬 **Support général** — Question / aide\n` +
      `> 🔧 **Problème technique** — Bug, lag, crash\n` +
      `> 🚨 **Report joueur** — Signaler un abus\n` +
      `> ⭐ **Candidature staff** — Rejoindre l'équipe\n\n` +
      `Un salon privé sera créé uniquement pour toi et les admins.`
    )
    .setFooter({ text: 'DiceForge — Forge ta légende ⚔️  •  1 ticket ouvert à la fois par membre' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_general').setLabel('💬  Support général').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_technique').setLabel('🔧  Problème technique').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_report').setLabel('🚨  Report joueur').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_candidature').setLabel('⭐  Candidature staff').setStyle(ButtonStyle.Success),
  );

  await ch.send({ embeds: [embedTicket], components: [row1, row2] });
  console.log('✅ Message tickets envoyé.');
}

async function createTicket(interaction, type) {
  const guild = interaction.guild;
  const member = interaction.member;
  const userId = member.id;

  // 1 ticket max par membre
  if (openTickets.has(userId)) {
    const existingId = openTickets.get(userId);
    const existing = guild.channels.cache.get(existingId);
    if (existing) {
      await safeReply(interaction, {
        content: `❌ Tu as déjà un ticket ouvert : <#${existingId}>`,
        ephemeral: true,
      });
      return;
    } else {
      openTickets.delete(userId);
    }
  }

  // Récupérer la catégorie du salon liens/tickets
  const parentCategoryId = guild.channels.cache.get(CONFIG.TICKET_CHANNEL_ID)?.parentId ?? null;

  const ticketInfo = TICKET_TYPES.find(t => t.id === type);
  const channelName = `${ticketInfo.emoji}-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`.slice(0, 32);

  try {
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: 0, // GUILD_TEXT
      parent: parentCategoryId,
      permissionOverwrites: [
        { id: guild.id, deny: ['ViewChannel'] },                                                         // @everyone ne voit pas
        { id: userId,   allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'] },   // Le membre
        { id: CONFIG.ADMIN_ROLE_ID, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages'] }, // Admins
      ],
    });

    openTickets.set(userId, ticketChannel.id);

    const embedTicketOpen = new EmbedBuilder()
      .setColor(ticketInfo.color)
      .setTitle(`${ticketInfo.emoji}  Ticket — ${ticketInfo.label}`)
      .setDescription(
        `Bonjour <@${userId}>, bienvenue dans ton ticket !\n\n` +
        `**Type :** ${ticketInfo.emoji} ${ticketInfo.label}\n` +
        `**Objet :** ${ticketInfo.desc}\n\n` +
        `Décris ton problème ou ta demande ci-dessous.\nUn membre de l'équipe te répondra dès que possible.\n\n` +
        `> Pour fermer ce ticket, clique sur **🔒 Fermer le ticket** ci-dessous.`
      )
      .setFooter({ text: `DiceForge Support  •  ${new Date().toLocaleDateString('fr-FR')}` })
      .setTimestamp();

    const rowClose = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`close_ticket_${userId}`)
        .setLabel('🔒  Fermer le ticket')
        .setStyle(ButtonStyle.Danger),
    );

    await ticketChannel.send({ content: `<@${userId}> <@&${CONFIG.ADMIN_ROLE_ID}>`, embeds: [embedTicketOpen], components: [rowClose] });

    await safeReply(interaction, {
      content: `✅ Ton ticket a été créé : <#${ticketChannel.id}>`,
      ephemeral: true,
    });
  } catch (e) {
    console.error('❌ Erreur création ticket :', e);
    await safeReply(interaction, { content: `❌ Impossible de créer le ticket : ${e.message}`, ephemeral: true });
  }
}

async function closeTicket(interaction, ownerId) {
  const channel = interaction.channel;
  const isAdmin = interaction.member?.roles.cache.has(CONFIG.ADMIN_ROLE_ID);
  const isOwner = interaction.user.id === ownerId;

  if (!isAdmin && !isOwner) {
    await safeReply(interaction, { content: '❌ Seul le créateur du ticket ou un admin peut le fermer.', ephemeral: true });
    return;
  }

  openTickets.delete(ownerId);

  await safeReply(interaction, { embeds: [
    new EmbedBuilder()
      .setColor('#e05c3a')
      .setTitle('🔒  Ticket fermé')
      .setDescription(`Ticket fermé par **${interaction.user.username}**.\nSuppression dans 5 secondes...`)
      .setTimestamp()
  ]});

  setTimeout(() => channel.delete().catch(() => {}), 5000);
}


const INSULTES = [
  'connard', 'connasse', 'salope', 'pute', 'enculé', 'enculer',
  'fdp', 'fils de pute', 'bâtard', 'batard', 'merde', 'putain',
  'ta gueule', 'nique', 'niquer', 'pd', 'pédé', 'tapette',
  'idiot', 'imbécile', 'abruti', 'crétin', 'débile', 'con',
  'conne', 'mongo', 'attardé', 'retardé', 'bouffon', 'tocard',
  'nazi', 'ntm', 'va te faire', 'shut up', 'stfu', 'asshole',
  'bastard', 'bitch', 'dick', 'fuck', 'shit', 'cunt', 'whore',
];

const LIEN_REGEX = /(https?:\/\/|www\.|discord\.gg\/|\.com|\.net|\.org|\.fr|\.io|\.gg)/i;

const avertissements = new Map();

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.channel.id !== CONFIG.MODERATION_CHANNEL_ID) return;
  if (message.member?.roles.cache.has(CONFIG.ADMIN_ROLE_ID)) return;

  const content = message.content.toLowerCase();
  let raison = null;

  if (LIEN_REGEX.test(message.content)) {
    raison = '🔗 Lien non autorisé dans ce salon';
  }

  if (!raison) {
    const insulteDetectee = INSULTES.find(i => content.includes(i));
    if (insulteDetectee) raison = '🤬 Langage inapproprié détecté';
  }

  if (!raison) return;

  await message.delete().catch(() => {});

  const userId = message.author.id;
  const warns = (avertissements.get(userId) ?? 0) + 1;
  avertissements.set(userId, warns);

  // MP à l'utilisateur
  message.author.send({ embeds: [
    new EmbedBuilder()
      .setColor('#f0c040')
      .setTitle('⚠️ Avertissement — DiceForge')
      .setDescription(`Ton message a été supprimé.\n\n**Raison :** ${raison}\n**Avertissements :** ${warns}/3`)
      .setFooter({ text: 'Respecte les règles du serveur.' })
      .setTimestamp()
  ]}).catch(() => {});

  // Avertissement public (auto-supprimé après 5s)
  const publicMsg = await message.channel.send({
    content: `<@${userId}>`,
    embeds: [
      new EmbedBuilder()
        .setColor('#f0c040')
        .setTitle('⚠️ Message supprimé')
        .setDescription(`${raison}\n**Avertissement ${warns}/3**`)
        .setFooter({ text: 'Récidive = sanctions automatiques' })
        .setTimestamp()
    ]
  });
  setTimeout(() => publicMsg.delete().catch(() => {}), 5000);

  // Sanctions progressives
  if (warns === 2) {
    await message.member.timeout(10 * 60 * 1000, raison).catch(() => {});
    const m = await message.channel.send({ embeds: [
      new EmbedBuilder().setColor('#e05c3a').setTitle('🔇 Mis en sourdine 10 min')
        .setDescription(`<@${userId}> — 2ème avertissement.`).setTimestamp()
    ]});
    setTimeout(() => m.delete().catch(() => {}), 8000);
  }

  if (warns >= 3) {
    await message.member.kick(raison).catch(() => {});
    avertissements.delete(userId);
  }

  // Log dans alertes
  const alertCh = client.channels.cache.get(CONFIG.ALERTS_CHANNEL_ID);
  if (alertCh) {
    alertCh.send({ embeds: [
      new EmbedBuilder()
        .setColor('#f0c040')
        .setTitle('🛡️ Modération automatique')
        .addFields(
          { name: 'Membre', value: message.author.username, inline: true },
          { name: 'Raison', value: raison, inline: true },
          { name: 'Avertissements', value: `${warns}/3`, inline: true },
          { name: 'Message', value: `\`${message.content.slice(0, 200)}\`` }
        )
        .setTimestamp()
    ]});
  }
});

// ── MESSAGE DE BIENVENUE ───────────────────────────────────
client.on('guildMemberAdd', async member => {
  const ch = client.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
  if (!ch) return;

  const memberCount = member.guild.memberCount;

  const embed = new EmbedBuilder()
    .setColor('#4adf80')
    .setTitle('⚔️ Un nouveau guerrier arrive !')
    .setDescription(
      `Bienvenue sur **DiceForge**, <@${member.id}> !\n\n` +
      `Tu es le **${memberCount}ème** membre de la communauté.\n` +
      `Prépare ton armure, forge ta faction et rejoins la bataille.\n\n` +
      `📜 **Commence ici :** rends-toi dans <#${CONFIG.PRESENTATION_CHANNEL_ID}> pour lire les règles et accéder au serveur.\n` +
      `🎮 **Adresse :** \`${CONFIG.MC_ADDRESS}\``
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: '📜 Règles', value: `Lis les règles dans <#${CONFIG.PRESENTATION_CHANNEL_ID}> !`, inline: true },
      { name: '🗡️ Serveur MC', value: 'Java 1.21 — Crack OK', inline: true },
    )
    .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
    .setTimestamp();

  ch.send({ content: `👋 Bienvenue <@${member.id}> !`, embeds: [embed] });
});

// ── MESSAGE D'AU REVOIR ────────────────────────────────────
client.on('guildMemberRemove', async member => {
  const ch = client.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setColor('#e05c3a')
    .setTitle('🚪 Un guerrier quitte le champ de bataille')
    .setDescription(
      `**${member.user.username}** a quitté DiceForge.\n\n` +
      `Nous espérons te revoir bientôt sur le serveur. ⚔️`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
    .setTimestamp();

  ch.send({ embeds: [embed] });
});


// Helper : ignore les interactions expirées (erreur 10062)
async function safeReply(interaction, options) {
  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(options).catch(() => {});
    }
    return await interaction.reply(options).catch(() => {});
  } catch (e) {
    if (e.code !== 10062) console.error('Reply error:', e.message);
  }
}
async function safeDefer(interaction, options = {}) {
  try {
    await interaction.deferReply(options);
    return true;
  } catch (e) {
    if (e.code !== 10062) console.error('Defer error:', e.message);
    return false;
  }
}
async function safeEdit(interaction, options) {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(options);
    } else {
      await interaction.reply(options);
    }
  } catch (e) {
    if (e.code !== 10062) console.error('EditReply error:', e.message);
  }
}

client.on('interactionCreate', async interaction => {

  // ── BOUTONS : Rôles ───────────────────────────────────────
  const roleMap = {
    'role_notif':   CONFIG.ROLE_NOTIF_ID,
    'role_pvp':     CONFIG.ROLE_PVP_ID,
    'role_builder': CONFIG.ROLE_BUILDER_ID,
  };
  const roleLabels = {
    'role_notif':   '🔔 Notifications',
    'role_pvp':     '⚔️ PvP',
    'role_builder': '🏗️ Builder',
  };
  if (interaction.isButton() && roleMap[interaction.customId]) {
    const roleId = roleMap[interaction.customId];
    const label  = roleLabels[interaction.customId];
    const role   = interaction.guild.roles.cache.get(roleId);
    if (!role) {
      await safeReply(interaction, { content: `❌ Rôle introuvable, contacte un admin.`, ephemeral: true });
      return;
    }
    if (interaction.member.roles.cache.has(roleId)) {
      await interaction.member.roles.remove(role);
      await safeReply(interaction, { content: `✅ Rôle **${label}** retiré.`, ephemeral: true });
    } else {
      await interaction.member.roles.add(role);
      await safeReply(interaction, { content: `✅ Rôle **${label}** attribué !`, ephemeral: true });
    }
    return;
  }

  // ── BOUTON : Copier adresse MC ─────────────────────────────
  if (interaction.isButton() && interaction.customId === 'copy_mc_address') {
    await safeReply(interaction, {
      content: `🎮 **Adresse du serveur :**\n\`\`\`\n${CONFIG.MC_ADDRESS}\n\`\`\`\nCopie-la et colle-la dans **Multijoueur → Ajouter un serveur** sur Minecraft Java 1.21.`,
      ephemeral: true,
    });
    return;
  }

  // ── BOUTONS : Ouverture de tickets ────────────────────────
  const ticketIds = TICKET_TYPES.map(t => t.id);
  if (interaction.isButton() && ticketIds.includes(interaction.customId)) {
    await createTicket(interaction, interaction.customId);
    return;
  }

  // ── BOUTONS : Fermeture de ticket ─────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('close_ticket_')) {
    const ownerId = interaction.customId.replace('close_ticket_', '');
    await closeTicket(interaction, ownerId);
    return;
  }

  // ── BOUTON : Acceptation des règles ───────────────────────
  if (interaction.isButton() && interaction.customId === 'accept_rules') {
    const role = interaction.guild.roles.cache.get(CONFIG.MEMBER_ROLE_ID);
    if (!role) {
      await safeReply(interaction, { content: '❌ Rôle introuvable, contacte un admin.', ephemeral: true });
      return;
    }
    if (interaction.member.roles.cache.has(CONFIG.MEMBER_ROLE_ID)) {
      await safeReply(interaction, { content: '✅ Tu as déjà accepté les règles !', ephemeral: true });
      return;
    }
    try {
      await interaction.member.roles.add(role);
      await safeReply(interaction, {
        embeds: [
          new EmbedBuilder()
            .setColor('#4adf80')
            .setTitle('✅ Bienvenue dans la communauté !')
            .setDescription(
              `Tu as accepté les règles de **DiceForge**.\n\n` +
              `🎮 **Serveur :** \`${CONFIG.MC_ADDRESS}\`\n` +
              `Bonne aventure, et forge ta légende ! ⚔️`
            )
            .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
            .setTimestamp()
        ],
        ephemeral: true
      });
    } catch (e) {
      await safeReply(interaction, { content: `❌ Impossible d'attribuer le rôle : ${e.message}`, ephemeral: true });
    }
    return;
  }

  // AUTOCOMPLÉTION pour /cmd
  if (interaction.isAutocomplete() && interaction.commandName === 'cmd') {
    const focused = interaction.options.getFocused().toLowerCase();
    const suggestions = MC_COMMANDS
      .filter(c => c.name.toLowerCase().includes(focused) || c.desc.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(c => ({
        name: `/${c.name} — ${c.desc}`.slice(0, 100),
        value: c.name,
      }));
    await interaction.respond(suggestions);
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // Vérif admin
  const adminCmds = ['cmd', 'kick', 'ban', 'stop', 'say', 'maintenance'];
  if (adminCmds.includes(interaction.commandName)) {
    const isAdmin = interaction.member?.roles.cache.has(CONFIG.ADMIN_ROLE_ID);
    if (!isAdmin) {
      await safeReply(interaction, { content: '❌ Permission refusée — rôle Admin requis.', ephemeral: true });
      return;
    }
  }

  // RCON helper
  async function rcon(cmd) {
    const r = new Rcon({ host: CONFIG.RCON_HOST, port: CONFIG.RCON_PORT, password: CONFIG.RCON_PASSWORD });
    try {
      await r.connect();
      const res = await r.send(cmd);
      await r.end();
      return res || '✅ Commande exécutée.';
    } catch (e) {
      return `❌ Erreur RCON : ${e.message}`;
    }
  }

  // ── /stopmusic ──
  if (interaction.commandName === 'stopmusic') {
    if (!musicConnection && !musicPlayer) {
      await safeReply(interaction, { content: '❌ La radio n\'est pas en cours.', ephemeral: true });
      return;
    }
    // Stopper ffmpeg
    if (crossfadeProc) {
      try { crossfadeProc.stdout.destroy(); crossfadeProc.kill(); } catch {}
      crossfadeProc = null;
    }
    // Stopper le player
    if (musicPlayer) {
      try { musicPlayer.stop(); } catch {}
    }
    // Déconnecter du salon vocal
    if (musicConnection) {
      try { musicConnection.destroy(); } catch {}
      musicConnection = null;
    }
    currentTrack = null;
    nextTrack = null;
    console.log(`⏹️ Radio arrêtée par ${interaction.user.username}`);
    await safeReply(interaction, { embeds: [
      new EmbedBuilder()
        .setColor('#e05c3a')
        .setTitle('⏹️ Radio arrêtée')
        .setDescription(`La radio DiceForge a été arrêtée par **${interaction.user.username}**.\nUtilise \`/play\` pour la relancer.`)
        .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
        .setTimestamp()
    ]});
    return;
  }

  // ── /play ──
  if (interaction.commandName === 'play') {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      await safeReply(interaction, { content: '❌ Tu dois être dans un salon vocal pour démarrer la radio !', ephemeral: true });
      return;
    }
    if (voiceChannel.id !== CONFIG.MUSIC_VOICE_CHANNEL_ID) {
      const targetChannel = interaction.guild.channels.cache.get(CONFIG.MUSIC_VOICE_CHANNEL_ID);
      await safeReply(interaction, { content: `❌ La radio ne peut être démarrée que depuis **${targetChannel?.name ?? 'le salon radio'}** !`, ephemeral: true });
      return;
    }
    if (musicConnection && musicPlayer) {
      await safeReply(interaction, { content: '🎵 La radio DiceForge est déjà en cours !', ephemeral: true });
      return;
    }
    await safeReply(interaction, { embeds: [
      new EmbedBuilder()
        .setColor('#4adf80')
        .setTitle('🎵 Radio DiceForge')
        .setDescription(`La radio démarre dans **${voiceChannel.name}** !`)
        .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
        .setTimestamp()
    ]});
    startMusicPlayer();
    return;
  }

  // ── /help ──
  if (interaction.commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor('#e05c3a')
      .setTitle('⚔️ DiceForge Bot — Commandes')
      .addFields(
        { name: '📊 Infos',  value: '`/status` Statut du serveur\n`/players` Joueurs en ligne' },
        { name: '🎵 Radio',  value: '`/play` Démarrer la radio dans ton salon vocal\n`/stopmusic` ⏹️ Arrêter la radio' },
        { name: '⚙️ Admin',  value: '`/cmd` Commande MC (autocomplétion ✨)\n`/say` Message en jeu\n`/kick` Expulser\n`/ban` Bannir\n`/start` ▶️ Démarrer le serveur\n`/stop` 🛑 Arrêter le serveur\n`/maintenance` 🔧 Maintenance + arrêt playit.gg' },
      )
      .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
      .setTimestamp();
    await safeReply(interaction, { embeds: [embed] });
    return;
  }

  // ── /status ──
  if (interaction.commandName === 'status') {
    await safeDefer(interaction);
    try {
      const { data } = await axios.get(`https://api.mcstatus.io/v2/status/java/${CONFIG.MC_ADDRESS}`);
      await safeEdit(interaction, { embeds: [
        new EmbedBuilder()
          .setColor(data.online ? '#4adf80' : '#e05c3a')
          .setTitle('📊 Statut de DiceForge')
          .addFields(
            { name: 'Statut',  value: data.online ? '🟢 En ligne' : '🔴 Hors ligne', inline: true },
            { name: 'Joueurs', value: `${data.players?.online ?? 0} / ${data.players?.max ?? 20}`, inline: true },
            { name: 'Version', value: data.version?.name_clean ?? 'Inconnue', inline: true },
            { name: 'Adresse', value: `\`${CONFIG.MC_ADDRESS}\`` },
          ).setTimestamp()
      ]});
    } catch (e) { await safeEdit(interaction, '❌ Impossible de récupérer le statut.'); }
    return;
  }

  // ── /players ──
  if (interaction.commandName === 'players') {
    await safeDefer(interaction);
    try {
      const { data } = await axios.get(`https://api.mcstatus.io/v2/status/java/${CONFIG.MC_ADDRESS}`);
      const players = data.players?.list ?? [];
      await safeEdit(interaction, { embeds: [
        new EmbedBuilder()
          .setColor('#4a7de8')
          .setTitle(`👥 Joueurs — ${data.players?.online ?? 0}/${data.players?.max ?? 20}`)
          .setDescription(players.length > 0 ? players.map(p => `• ${p.name_clean ?? p.uuid}`).join('\n') : '*Aucun joueur connecté*')
          .setTimestamp()
      ]});
    } catch (e) { await safeEdit(interaction, '❌ Impossible de récupérer les joueurs.'); }
    return;
  }

  // ── /cmd ──
  if (interaction.commandName === 'cmd') {
    await safeDefer(interaction);
    const mcCmd = interaction.options.getString('commande');
    const result = await rcon(mcCmd);
    await safeEdit(interaction, { embeds: [
      new EmbedBuilder()
        .setColor('#f0c040')
        .setTitle('⚙️ Commande exécutée')
        .addFields(
          { name: 'Commande', value: `\`/${mcCmd}\`` },
          { name: 'Résultat', value: `\`\`\`${result.slice(0, 1000)}\`\`\`` }
        )
        .setFooter({ text: `Par ${interaction.user.username}` })
        .setTimestamp()
    ]});
    return;
  }

  // ── /say ──
  if (interaction.commandName === 'say') {
    const msg = interaction.options.getString('message');
    await rcon(`say [Discord] ${interaction.user.username}: ${msg}`);
    await safeReply(interaction, `✅ Message envoyé : **${msg}**`);
    return;
  }

  // ── /kick ──
  if (interaction.commandName === 'kick') {
    await safeDefer(interaction);
    const player = interaction.options.getString('joueur');
    const reason = interaction.options.getString('raison') ?? 'Expulsé par un admin';
    await rcon(`kick ${player} ${reason}`);
    await safeEdit(interaction, { embeds: [
      new EmbedBuilder().setColor('#f0c040').setTitle('👢 Joueur expulsé')
        .addFields(
          { name: 'Joueur', value: player, inline: true },
          { name: 'Raison', value: reason, inline: true },
          { name: 'Par', value: interaction.user.username, inline: true }
        ).setTimestamp()
    ]});
    return;
  }

  // ── /ban ──
  if (interaction.commandName === 'ban') {
    await safeDefer(interaction);
    const player = interaction.options.getString('joueur');
    const reason = interaction.options.getString('raison') ?? 'Banni par un admin';
    await rcon(`ban ${player} ${reason}`);
    await safeEdit(interaction, { embeds: [
      new EmbedBuilder().setColor('#e05c3a').setTitle('🔨 Joueur banni')
        .addFields(
          { name: 'Joueur', value: player, inline: true },
          { name: 'Raison', value: reason, inline: true },
          { name: 'Par', value: interaction.user.username, inline: true }
        ).setTimestamp()
    ]});
    return;
  }

  // ── /start ──
  if (interaction.commandName === 'start') {
    await safeDefer(interaction);

    // Vérifie si le serveur est déjà en ligne
    try {
      const { data } = await axios.get(`https://api.mcstatus.io/v2/status/java/${CONFIG.MC_ADDRESS}`, { timeout: 5000 });
      if (data.online) {
        await safeEdit(interaction, { embeds: [
          new EmbedBuilder()
            .setColor('#f0c040')
            .setTitle('⚠️ Serveur déjà en ligne')
            .setDescription('Le serveur DiceForge est déjà démarré !')
            .setTimestamp()
        ]});
        return;
      }
    } catch (e) {}

    // Lance le start.bat
    try {
      const { spawn: spawnProc } = require('child_process');
      const child = spawnProc('cmd.exe', ['/c', CONFIG.SERVER_START_BAT], {
        detached: true,
        stdio: 'ignore',
        cwd: path.dirname(CONFIG.SERVER_START_BAT),
      });
      child.unref(); // Détache complètement du process Node

      await safeEdit(interaction, { embeds: [
        new EmbedBuilder()
          .setColor('#4adf80')
          .setTitle('▶️ Démarrage du serveur')
          .setDescription(
            `Démarrage lancé par **${interaction.user.username}**.\n\n` +
            `Le serveur sera en ligne dans environ **30-60 secondes**.\n` +
            `Utilise \`/status\` pour vérifier quand il est prêt.`
          )
          .setFooter({ text: 'DiceForge — Forge ta légende ⚔️' })
          .setTimestamp()
      ]});

      // Log dans alertes
      const alertCh = client.channels.cache.get(CONFIG.ALERTS_CHANNEL_ID);
      if (alertCh) {
        alertCh.send({ embeds: [
          new EmbedBuilder()
            .setColor('#4adf80')
            .setTitle('▶️ Démarrage demandé')
            .setDescription(`Démarrage du serveur demandé par **${interaction.user.username}**`)
            .setTimestamp()
        ]});
      }
    } catch (e) {
      await safeEdit(interaction, { embeds: [
        new EmbedBuilder()
          .setColor('#e05c3a')
          .setTitle('❌ Erreur de démarrage')
          .setDescription(`Impossible de démarrer le serveur.\n\`\`\`${e.message}\`\`\`\n\nVérifie que le chemin \`SERVER_START_BAT\` est correct dans la config.`)
          .setTimestamp()
      ]});
    }
    return;
  }

  // ── /maintenance ──
  if (interaction.commandName === 'maintenance') {
    await safeDefer(interaction, { ephemeral: true });

    const motif = interaction.options.getString('motif');
    const duree = interaction.options.getString('duree');

    // 1. Alerte dans le salon alertes
    const alertCh = client.channels.cache.get(CONFIG.ALERTS_CHANNEL_ID);
    if (alertCh) {
      await alertCh.send({ embeds: [
        new EmbedBuilder()
          .setColor('#f0c040')
          .setTitle('🔧  Maintenance en cours')
          .setDescription(
            `Le serveur **DiceForge** est temporairement inaccessible.\n\n` +
            `Merci de ta patience, on revient très vite ! 🛠️`
          )
          .addFields(
            { name: '📋  Motif',           value: motif,                              inline: false },
            { name: '⏱️  Durée estimée',   value: duree,                              inline: true  },
            { name: '👤  Déclenché par',   value: interaction.user.username,          inline: true  },
            { name: '🕐  Heure de début',  value: `<t:${Math.floor(Date.now()/1000)}:T>`, inline: true },
          )
          .setFooter({ text: 'DiceForge — On sera de retour bientôt ⚔️' })
          .setTimestamp()
      ]});
    }

    // 2. Avertissement in-game + compte à rebours 20 secondes
    try {
      const r = new Rcon({ host: CONFIG.RCON_HOST, port: CONFIG.RCON_PORT, password: CONFIG.RCON_PASSWORD });
      await r.connect();
      await r.send(`say [DiceForge] ⚠ MAINTENANCE dans 20 secondes ! Motif : ${motif}. Mettez-vous en securite !`);
      await new Promise(res => setTimeout(res, 10000));
      await r.send(`say [DiceForge] ⚠ Fermeture du serveur dans 10 secondes...`);
      await new Promise(res => setTimeout(res, 5000));
      await r.send(`say [DiceForge] Fermeture dans 5 secondes...`);
      await new Promise(res => setTimeout(res, 1000));
      await r.send(`say [DiceForge] 4...`);
      await new Promise(res => setTimeout(res, 1000));
      await r.send(`say [DiceForge] 3...`);
      await new Promise(res => setTimeout(res, 1000));
      await r.send(`say [DiceForge] 2...`);
      await new Promise(res => setTimeout(res, 1000));
      await r.send(`say [DiceForge] 1... Bonne continuation, a bientot !`);
      await new Promise(res => setTimeout(res, 1000));
      await r.send('stop');
      await r.end();
    } catch (e) {
      // Serveur peut-être déjà éteint, on continue
      console.warn('⚠️ RCON maintenance (ignoré) :', e.message);
    }

    // 3. Kill du processus playit.exe (Windows)
    await new Promise((resolve) => {
      exec('taskkill /IM playit.exe /F', (err, stdout, stderr) => {
        if (err) console.warn('⚠️ playit.exe introuvable ou déjà arrêté :', err.message);
        else     console.log('✅ playit.exe arrêté.');
        resolve();
      });
    });

    // 4. Confirmation à l'admin
    await safeEdit(interaction, { embeds: [
      new EmbedBuilder()
        .setColor('#4adf80')
        .setTitle('✅  Maintenance activée')
        .addFields(
          { name: '📋  Motif',         value: motif, inline: false },
          { name: '⏱️  Durée estimée', value: duree, inline: true  },
          { name: '🌐  Tunnel playit', value: 'Arrêté ✅',          inline: true  },
          { name: '🎮  Serveur MC',    value: 'Arrêt demandé ✅',   inline: true  },
        )
        .setFooter({ text: 'Utilise /start pour redémarrer le serveur.' })
        .setTimestamp()
    ]});
    return;
  }

  // ── /stop ──
  if (interaction.commandName === 'stop') {
    await safeReply(interaction, { embeds: [
      new EmbedBuilder().setColor('#e05c3a').setTitle('🛑 Arrêt du serveur')
        .setDescription(`Arrêt demandé par **${interaction.user.username}**`).setTimestamp()
    ]});
    await rcon('stop');
    return;
  }
});

// ── LOGS EN TEMPS RÉEL ─────────────────────────────────────
function startLogWatcher() {
  const ch    = client.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
  const rawCh = client.channels.cache.get(CONFIG.RAW_LOGS_CHANNEL_ID);
  if (!ch) { console.error('❌ Salon logs introuvable.'); return; }

  console.log('📋 Surveillance des logs démarrée (attente du fichier)...');

  setInterval(() => {
    try {
      // Si le fichier n'existe pas encore (serveur pas lancé), on attend
      if (!fs.existsSync(CONFIG.MC_LOGS_PATH)) return;

      const stat = fs.statSync(CONFIG.MC_LOGS_PATH);

      // Fichier recréé (nouveau démarrage serveur) → reset la position
      if (stat.size < lastLogSize) {
        console.log('🔄 Nouveau fichier de logs détecté, reset position.');
        lastLogSize = 0;
      }

      // Première détection du fichier
      if (lastLogSize === 0) {
        lastLogSize = stat.size;
        return;
      }

      if (stat.size <= lastLogSize) return;

      const stream = fs.createReadStream(CONFIG.MC_LOGS_PATH, { start: lastLogSize, end: stat.size, encoding: 'utf8' });
      let buf = '';
      stream.on('data', d => buf += d);
      stream.on('end', () => {
        lastLogSize = stat.size;
        buf.split('\n').filter(l => l.trim()).forEach(line => {
          // Logs importants → salon principal
          const formatted = formatImportantLog(line);
          if (formatted) ch.send(formatted).catch(() => {});

          // Tous les logs bruts → salon dédié
          if (rawCh) rawCh.send(`\`${line.slice(0, 1990)}\``).catch(() => {});

          handleAlerts(line);
        });
      });
    } catch (e) {
      // Erreur silencieuse — on réessaie au prochain tick
    }
  }, CONFIG.LOGS_READ_INTERVAL);
}

function formatImportantLog(line) {
  if (line.includes('joined the game')) return `🟢 **${line.match(/(\w+) joined/)?.[1]}** a rejoint le serveur`;
  if (line.includes('left the game'))   return `🔴 **${line.match(/(\w+) left/)?.[1]}** a quitté le serveur`;
  const chat = line.match(/<(\w+)> (.+)/);
  if (chat) return `💬 **${chat[1]}**: ${chat[2]}`;
  if (['was slain','was killed','drowned','fell','burned','died'].some(k => line.includes(k)))
    return `💀 ${line.split('INFO]:')[1]?.trim() ?? line}`;
  if (line.includes('Done') && line.includes('For help')) return `✅ **Serveur démarré !**`;
  if (line.includes('Stopping server')) return `🛑 **Arrêt du serveur...**`;
  // ERROR et WARN → envoyés uniquement dans le salon raw-logs, pas ici
  return null;
}

async function handleAlerts(line) {
  const ch = client.channels.cache.get(CONFIG.ALERTS_CHANNEL_ID);
  if (!ch) return;
  if (line.includes('Banned player')) {
    const p = line.match(/Banned player (\w+)/)?.[1];
    ch.send({ embeds: [new EmbedBuilder().setColor('#e05c3a').setTitle('🔨 Joueur banni').setDescription(`**${p}** banni.`).setTimestamp()] });
  }
  if (line.includes('Done') && line.includes('For help')) {
    ch.send({
      content: `<@&${CONFIG.ROLE_NOTIF_ID}>`,
      embeds: [new EmbedBuilder().setColor('#4adf80').setTitle('✅ Serveur en ligne').setDescription('DiceForge est opérationnel ! Connectez-vous sur `${CONFIG.MC_ADDRESS}`').setTimestamp()]
    });
  }
}

// ── VÉRIFICATEUR STATUT ────────────────────────────────────
function startStatusChecker() {
  setInterval(async () => {
    try {
      const { data } = await axios.get(`https://api.mcstatus.io/v2/status/java/${CONFIG.MC_ADDRESS}`, { timeout: 10000 });
      const { online, players } = data;
      const count = players?.online ?? 0;

      client.user.setActivity(online ? `DiceForge — ${count} joueur(s)` : 'Serveur hors ligne ⚠️', { type: ActivityType.Watching });

      const ch = client.channels.cache.get(CONFIG.ALERTS_CHANNEL_ID);
      if (ch) {
        if (serverWasOnline && !online) {
          // Double vérification 30s plus tard avant d'alerter
          console.warn('⚠️ Serveur semble offline, double vérification dans 30s...');
          setTimeout(async () => {
            try {
              const { data: data2 } = await axios.get(`https://api.mcstatus.io/v2/status/java/${CONFIG.MC_ADDRESS}`, { timeout: 10000 });
              if (!data2.online) {
                serverWasOnline = false;
                ch.send({
                  content: `<@&${CONFIG.ROLE_NOTIF_ID}>`,
                  embeds: [new EmbedBuilder().setColor('#e05c3a').setTitle('⚠️ Serveur hors ligne !').setDescription('DiceForge ne répond plus. Une maintenance est peut-être en cours.').setTimestamp()]
                });
              } else {
                console.log('✅ Faux négatif ignoré — serveur toujours en ligne.');
              }
            } catch (e) {}
          }, 30000);
          return;
        }
        if (!serverWasOnline && online) {
          ch.send({
            content: `<@&${CONFIG.ROLE_NOTIF_ID}>`,
            embeds: [new EmbedBuilder().setColor('#4adf80').setTitle('✅ Serveur de nouveau en ligne !').setDescription(`DiceForge est de retour avec **${count}** joueur(s). Connectez-vous sur \`${CONFIG.MC_ADDRESS}\``).setTimestamp()]
          });
        }
      }
      serverWasOnline = online;
    } catch (e) {}
  }, CONFIG.STATUS_CHECK_INTERVAL);
}

// ── LECTEUR MUSICAL avec CROSSFADE FFMPEG ─────────────────
let musicQueue      = [];
let musicConnection = null;
let musicPlayer     = null;
let currentTrack    = null;
let nextTrack       = null;
let crossfadeProc   = null;  // process ffmpeg crossfade en cours

// Durée du crossfade supprimée — lecture simple activée pour économiser les ressources

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadMusicQueue() {
  try {
    if (!fs.existsSync(CONFIG.MUSIC_DIR)) {
      fs.mkdirSync(CONFIG.MUSIC_DIR, { recursive: true });
      console.log('📁 Dossier music/ créé. Ajoutes tes MP3 dedans puis redémarre le bot.');
      return [];
    }
    const files = fs.readdirSync(CONFIG.MUSIC_DIR)
      .filter(f => f.match(/\.(mp3|ogg|wav|flac)$/i))
      .map(f => path.join(CONFIG.MUSIC_DIR, f));
    if (files.length === 0) {
      console.log('🎵 Aucun fichier audio trouvé dans music/');
      return [];
    }
    console.log(`🎵 ${files.length} fichier(s) audio chargé(s).`);
    return shuffleArray(files);
  } catch (e) {
    console.error('❌ Erreur chargement music :', e.message);
    return [];
  }
}

function pickNextTrack() {
  if (musicQueue.length === 0) musicQueue = loadMusicQueue();
  if (musicQueue.length === 0) return null;
  return musicQueue.shift();
}

/**
 * Joue une piste simple — lecture légère sans crossfade.
 */
function createTrackStream(trackPath) {
  const args = [
    '-loglevel', 'error',
    '-i', trackPath,
    '-f', 'opus',
    '-ar', '48000',
    '-ac', '2',
    '-b:a', '64k',   // Bitrate réduit (128k → 64k) = moitié moins de CPU
    '-vbr', 'on',    // Bitrate variable pour économiser davantage
    'pipe:1',
  ];
  const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stderr.on('data', d => {
    const msg = d.toString().trim();
    if (msg) console.warn('[ffmpeg]', msg);
  });
  return proc;
}

/**
 * Joue une piste simple (sans crossfade) — utilisé pour la toute première piste.
 */
function playSingleTrack(trackPath) {
  return createTrackStream(trackPath);
}

function playWithCrossfade(trackA, trackB) {
  // Crossfade supprimé — lecture simple pour économiser les ressources
  if (!musicPlayer || !musicConnection) return;

  if (crossfadeProc) {
    try { crossfadeProc.stdout.destroy(); crossfadeProc.kill(); } catch {}
    crossfadeProc = null;
  }

  const name = path.basename(trackB, path.extname(trackB));
  console.log(`🎵 Piste suivante : "${name}"`);

  const proc = createTrackStream(trackB);
  crossfadeProc = proc;

  const resource = createAudioResource(proc.stdout, {
    inputType: 'arbitrary',
    inlineVolume: true,
  });
  resource.volume?.setVolume(0.5);

  musicPlayer.play(resource);
  currentTrack = trackB;
}

/**
 * Joue un silence continu pour garder la connexion vocale active
 * quand il n'y a pas de musique disponible.
 */
function playKeepAlive() {
  if (!musicPlayer || !musicConnection) return;
  console.log('🔇 Keepalive silence actif (pas de musique)...');
  const args = [
    '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-f', 'opus',
    '-ar', '48000',
    '-ac', '2',
    '-b:a', '8k',
    '-t', '300', // 5 minutes puis re-trigger Idle
    'pipe:1',
  ];
  const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  if (crossfadeProc) { try { crossfadeProc.kill(); } catch {} }
  crossfadeProc = proc;
  const resource = createAudioResource(proc.stdout, { inputType: 'arbitrary', inlineVolume: true });
  resource.volume?.setVolume(0);
  musicPlayer.play(resource);
}

async function startMusicPlayer() {
  if (!CONFIG.MUSIC_VOICE_CHANNEL_ID || CONFIG.MUSIC_VOICE_CHANNEL_ID === 'REMPLACE_PAR_ID_SALON_VOCAL') {
    console.warn('⚠️ MUSIC_VOICE_CHANNEL_ID non configuré — lecteur musical désactivé.');
    return;
  }

  const channel = client.channels.cache.get(CONFIG.MUSIC_VOICE_CHANNEL_ID);
  if (!channel || channel.type !== 2) {
    console.error('❌ Salon vocal musique introuvable ou mauvais type.');
    return;
  }

  // Nettoyer l'ancienne connexion si elle existe encore
  if (musicConnection) {
    try { musicConnection.destroy(); } catch {}
    musicConnection = null;
  }
  if (musicPlayer) {
    try { musicPlayer.stop(); } catch {}
  }

  musicPlayer = createAudioPlayer();

  try {
    musicConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId:   channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });
    await entersState(musicConnection, VoiceConnectionStatus.Ready, 10_000);
    musicConnection.subscribe(musicPlayer);
    console.log(`✅ Bot connecté au salon vocal : ${channel.name}`);
  } catch (e) {
    console.error('❌ Impossible de rejoindre le salon vocal :', e.message);
    return;
  }

  // Reconnexion automatique
  musicConnection.on(VoiceConnectionStatus.Disconnected, async () => {
    const guild = client.guilds.cache.get(CONFIG.GUILD_ID);
    const botMember = guild?.members.cache.get(client.user.id);
    const currentChannel = botMember?.voice?.channelId;

    if (!currentChannel) {
      console.warn('👢 Bot kické du salon vocal — vérification avant de revenir...');
      try { musicConnection.destroy(); } catch {}
      musicConnection = null;
      if (crossfadeProc) { try { crossfadeProc.kill(); } catch {} crossfadeProc = null; }
      // Ne revenir que si quelqu'un est dans le salon
      setTimeout(() => {
        const ch = client.channels.cache.get(CONFIG.MUSIC_VOICE_CHANNEL_ID);
        const hasMembers = ch?.members?.filter(m => !m.user.bot).size > 0;
        if (hasMembers) startMusicPlayer();
        else console.log('🔇 Salon vide après kick — radio en pause.');
      }, 30000);
      return;
    }

    console.warn('⚠️ Connexion vocale perdue, tentative de reconnexion...');
    try {
      await Promise.race([
        entersState(musicConnection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(musicConnection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      console.log('✅ Reconnexion vocale réussie.');
    } catch {
      console.warn('🔄 Reconnexion échouée, relance dans 8s...');
      try { musicConnection.destroy(); } catch {}
      musicConnection = null;
      if (crossfadeProc) { try { crossfadeProc.kill(); } catch {} crossfadeProc = null; }
      const ch = client.channels.cache.get(CONFIG.MUSIC_VOICE_CHANNEL_ID);
      const hasMembers = ch?.members?.filter(m => !m.user.bot).size > 0;
      if (hasMembers) setTimeout(startMusicPlayer, 8000);
    }
  });

  musicConnection.on(VoiceConnectionStatus.Destroyed, () => {
    const guild = client.guilds.cache.get(CONFIG.GUILD_ID);
    const botMember = guild?.members.cache.get(client.user.id);
    const currentChannel = botMember?.voice?.channelId;

    musicConnection = null;
    if (crossfadeProc) { try { crossfadeProc.kill(); } catch {} crossfadeProc = null; }

    const ch = client.channels.cache.get(CONFIG.MUSIC_VOICE_CHANNEL_ID);
    const hasMembers = ch?.members?.filter(m => !m.user.bot).size > 0;

    if (!currentChannel) {
      console.warn('👢 Bot retiré du salon vocal.');
      if (hasMembers) setTimeout(startMusicPlayer, 30000);
      else console.log('🔇 Salon vide — radio en pause.');
    } else {
      if (hasMembers) {
        console.warn('💥 Connexion vocale détruite, relance dans 8s...');
        setTimeout(startMusicPlayer, 8000);
      }
    }
  });

  // Quand ffmpeg termine le crossfade → préparer le suivant
  // ── WATCHDOG : reconnexion si le bot est déconnecté ──────
  setInterval(() => {
    // Vérifier si quelqu'un est dans le salon (hors bot)
    const voiceChannel = client.channels.cache.get(CONFIG.MUSIC_VOICE_CHANNEL_ID);
    const hasMembers = voiceChannel?.members?.filter(m => !m.user.bot).size > 0;

    if (!hasMembers) {
      // Salon vide — arrêter proprement sans relancer
      if (musicConnection) {
        console.log('🔇 Salon vide — arrêt de la radio.');
        if (crossfadeProc) { try { crossfadeProc.stdout.destroy(); crossfadeProc.kill(); } catch {} crossfadeProc = null; }
        if (musicPlayer) { try { musicPlayer.stop(); } catch {} }
        try { musicConnection.destroy(); } catch {}
        musicConnection = null;
        currentTrack = null;
      }
      return;
    }

    if (!musicConnection || !musicPlayer) {
      console.warn('🔁 Watchdog : pas de connexion, relance...');
      startMusicPlayer();
      return;
    }
    const state = musicConnection.state?.status;
    const playerState = musicPlayer.state?.status;
    if (state === VoiceConnectionStatus.Disconnected || state === VoiceConnectionStatus.Destroyed) {
      console.warn('🔁 Watchdog : connexion perdue, relance...');
      try { musicConnection.destroy(); } catch {}
      musicConnection = null;
      setTimeout(startMusicPlayer, 3000);
    } else if (playerState === AudioPlayerStatus.Idle) {
      console.warn('🔁 Watchdog : player inactif détecté, relance audio...');
      playKeepAlive();
    }
  }, 60_000); // toutes les minutes

  let lastIdleTime = 0;
  let idleCount = 0;

  musicPlayer.on(AudioPlayerStatus.Idle, () => {
    // Garde-fou anti-boucle : si Idle se déclenche plus de 3 fois en 10s → stop
    const now = Date.now();
    if (now - lastIdleTime < 10000) {
      idleCount++;
      if (idleCount >= 3) {
        console.error('❌ Boucle Idle détectée — arrêt de la radio.');
        if (crossfadeProc) { try { crossfadeProc.stdout.destroy(); crossfadeProc.kill(); } catch {} crossfadeProc = null; }
        if (musicConnection) { try { musicConnection.destroy(); } catch {} musicConnection = null; }
        idleCount = 0;
        return;
      }
    } else {
      idleCount = 0;
    }
    lastIdleTime = now;

    nextTrack = pickNextTrack();
    if (!nextTrack) {
      console.log('⏸️ Queue vide, rechargement...');
      musicQueue = loadMusicQueue();
      nextTrack = pickNextTrack();
      if (!nextTrack) {
        playKeepAlive();
        return;
      }
    }
    const prev = currentTrack;
    currentTrack = nextTrack;
    if (prev) {
      playWithCrossfade(prev, currentTrack);
    } else {
      const proc = playSingleTrack(currentTrack);
      crossfadeProc = proc;
      const resource = createAudioResource(proc.stdout, { inputType: 'arbitrary', inlineVolume: true });
      resource.volume?.setVolume(0.5);
      musicPlayer.play(resource);
    }
  });

  musicPlayer.on('error', (e) => {
    console.error('❌ Erreur player :', e.message);
    currentTrack = pickNextTrack();
    if (currentTrack) setTimeout(() => {
      nextTrack = pickNextTrack();
      if (nextTrack) playWithCrossfade(currentTrack, nextTrack);
    }, 1000);
  });

  // Démarrage : première piste seule, puis crossfade à partir de la deuxième
  musicQueue = loadMusicQueue();
  if (musicQueue.length === 0) {
    console.log('⏸️ Lecteur en attente — ajoute des MP3 dans le dossier music/');
    const waitInterval = setInterval(() => {
      const files = loadMusicQueue();
      if (files.length > 0) {
        musicQueue = files;
        currentTrack = musicQueue.shift();
        const proc = playSingleTrack(currentTrack);
        crossfadeProc = proc;
        const resource = createAudioResource(proc.stdout, { inputType: 'arbitrary', inlineVolume: true });
        resource.volume?.setVolume(0.5);
        musicPlayer.play(resource);
        console.log(`🎵 Première piste : ${path.basename(currentTrack, path.extname(currentTrack))}`);
        clearInterval(waitInterval);
      }
    }, 30000);
    return;
  }

  // Lancer la première piste simple
  currentTrack = musicQueue.shift();
  const proc = playSingleTrack(currentTrack);
  crossfadeProc = proc;
  const resource = createAudioResource(proc.stdout, { inputType: 'arbitrary', inlineVolume: true });
  resource.volume?.setVolume(0.5);
  musicPlayer.play(resource);
  console.log(`🎵 Première piste : ${path.basename(currentTrack, path.extname(currentTrack))}`);
}

// ── LANCEMENT ──────────────────────────────────────────────
client.login(CONFIG.DISCORD_TOKEN);
