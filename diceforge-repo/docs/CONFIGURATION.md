# ⚙️ Guide de configuration — DiceForge Bot

Ce guide explique **chaque valeur à modifier** pour faire fonctionner le bot sur ton propre serveur.

---

## 1. Créer ton application Discord

1. Va sur **[discord.com/developers/applications](https://discord.com/developers/applications)**
2. Clique **New Application** → donne-lui un nom (ex: DiceForge Bot)
3. Va dans **Bot** → clique **Reset Token** → copie le token
4. Active les **Privileged Gateway Intents** :
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Va dans **OAuth2 → URL Generator** → coche `bot` + `applications.commands`
   → Permissions : `Administrator`
   → Copie l'URL générée et ouvre-la pour inviter le bot sur ton serveur

---

## 2. Récupérer les IDs Discord

Pour activer le **mode développeur** sur Discord :
`Paramètres → Avancé → Mode développeur ✅`

Ensuite **clic droit** sur n'importe quel salon, rôle ou serveur → **Copier l'identifiant**

### Valeurs obligatoires

| Variable | Comment l'obtenir |
|---|---|
| `DISCORD_TOKEN` | Discord Developer Portal → ton app → Bot → Reset Token |
| `CLIENT_ID` | Discord Developer Portal → ton app → General Information → Application ID |
| `GUILD_ID` | Clic droit sur ton serveur Discord → Copier l'identifiant |

### Salons à créer et configurer

Crée ces salons sur ton Discord, puis copie leur ID dans le `.env` :

| Variable | Salon recommandé | Description |
|---|---|---|
| `LOGS_CHANNEL_ID` | `#📋・logs-serveur` | Logs du serveur Minecraft (connexions, déconnexions) |
| `ALERTS_CHANNEL_ID` | `#🚨・alertes` | Alertes (serveur offline, erreurs) |
| `COMMANDS_CHANNEL_ID` | `#⚙️・commandes` | Salon où les admins envoient les commandes RCON |
| `WELCOME_CHANNEL_ID` | `#👋・bienvenue` | Messages de bienvenue et au revoir |
| `RAW_LOGS_CHANNEL_ID` | `#📄・logs-bruts` | Logs complets du serveur (verbose) |
| `MODERATION_CHANNEL_ID` | `#💬・general` | Salon modéré (anti-liens, anti-insultes) |
| `PRESENTATION_CHANNEL_ID` | `#📌・presentation` | Message de présentation du serveur |
| `LIENS_CHANNEL_ID` | `#🔗・liens-utiles` | Liens utiles (site, launcher, etc.) |
| `TICKET_CHANNEL_ID` | `#🎫・tickets` | Système de tickets de support |
| `ROLES_CHANNEL_ID` | `#🎭・rôles` | Salon de sélection des rôles |
| `MUSIC_VOICE_CHANNEL_ID` | `#🎵・radio` | Salon vocal pour la radio musicale |

### Rôles à créer et configurer

| Variable | Rôle recommandé | Description |
|---|---|---|
| `MEMBER_ROLE_ID` | `@Membre` | Attribué automatiquement après lecture des règles |
| `ADMIN_ROLE_ID` | `@Admin` | Rôle admin pour les commandes restreintes |
| `ROLE_NOTIF_ID` | `@Notifications` | Rôle pour recevoir les notifications |
| `ROLE_PVP_ID` | `@PvP` | Rôle joueurs PvP |
| `ROLE_BUILDER_ID` | `@Builder` | Rôle builders |

---

## 3. Configurer RCON sur ton serveur Minecraft

Dans le fichier `server.properties` de ton serveur Minecraft :

```properties
enable-rcon=true
rcon.port=25575
rcon.password=ChoisisUnMotDePasseSolide
broadcast-rcon-to-ops=false
```

Puis dans ton `.env` :
```
RCON_HOST=127.0.0.1        # 127.0.0.1 si le bot tourne sur la même machine
RCON_PORT=25575
RCON_PASSWORD=ChoisisUnMotDePasseSolide
```

> ⚠️ Si le bot tourne sur une machine différente du serveur Minecraft, remplace `127.0.0.1` par l'IP de la machine qui héberge le serveur.

---

## 4. Configurer les chemins

### Windows
```
MC_LOGS_PATH=C:\Users\TonNom\Documents\minecraft-server\logs\latest.log
SERVER_START_BAT=C:\Users\TonNom\Documents\minecraft-server\start.bat
MUSIC_DIR=C:\Users\TonNom\Desktop\diceforge-bot\song
```

### Linux / Mac
```
MC_LOGS_PATH=/home/tonnom/minecraft/logs/latest.log
SERVER_START_BAT=/home/tonnom/minecraft/start.sh
MUSIC_DIR=/home/tonnom/diceforge-bot/song
```

---

## 5. La radio musicale

Place tes fichiers **MP3** dans le dossier défini par `MUSIC_DIR`.

Le bot joue automatiquement les morceaux en ordre aléatoire avec crossfade entre les pistes quand quelqu'un rejoint le salon vocal `MUSIC_VOICE_CHANNEL_ID`.

```
song/
├── titre1.mp3
├── titre2.mp3
└── titre3.mp3
```

---

## 6. Lancer le bot

```bash
cd bot
npm install
node diceforge-bot.js
```

Au premier démarrage, le bot enregistre automatiquement toutes les slash commands sur ton serveur Discord.

---

## 7. Récapitulatif du `.env`

```env
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

LOGS_CHANNEL_ID=
ALERTS_CHANNEL_ID=
COMMANDS_CHANNEL_ID=
WELCOME_CHANNEL_ID=
RAW_LOGS_CHANNEL_ID=
MODERATION_CHANNEL_ID=
PRESENTATION_CHANNEL_ID=
LIENS_CHANNEL_ID=
TICKET_CHANNEL_ID=
ROLES_CHANNEL_ID=
MUSIC_VOICE_CHANNEL_ID=

MEMBER_ROLE_ID=
ADMIN_ROLE_ID=
ROLE_NOTIF_ID=
ROLE_PVP_ID=
ROLE_BUILDER_ID=

RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=

MC_LOGS_PATH=
SERVER_START_BAT=
MUSIC_DIR=

MC_ADDRESS=
WEBSITE_URL=
```
