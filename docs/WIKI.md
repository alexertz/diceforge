# 📖 Wiki DiceForge

## Commandes du bot

### Commandes publiques

| Commande | Description |
|---|---|
| `/status` | Affiche le statut du serveur (en ligne, joueurs, version) |
| `/players` | Liste les joueurs actuellement connectés |
| `/play` | Lance la radio DiceForge dans ton salon vocal |
| `/stopmusic` | Arrête la radio et quitte le salon vocal |

### Commandes admin uniquement

| Commande | Description |
|---|---|
| `/cmd <commande>` | Exécute une commande Minecraft via RCON (avec autocomplétion) |
| `/say <message>` | Envoie un message dans le chat Minecraft |
| `/kick <joueur> [raison]` | Expulse un joueur du serveur |
| `/ban <joueur> [raison]` | Bannit un joueur définitivement |
| `/start` | Démarre le serveur Minecraft |
| `/stop` | Arrête le serveur Minecraft |
| `/maintenance <on\|off>` | Active/désactive le mode maintenance |

---

## Architecture du bot

```
diceforge-bot.js
├── CONFIG                    → Toutes les variables de configuration
├── registerCommands()        → Enregistrement des slash commands Discord
├── client.on('ready')        → Initialisation au démarrage
├── client.on('interactionCreate')
│   ├── Autocomplete          → Suggestions pour /cmd
│   └── Slash commands        → Gestion de chaque commande
├── client.on('guildMemberAdd')   → Message de bienvenue
├── client.on('guildMemberRemove') → Message d'au revoir
├── client.on('messageCreate')     → Modération auto
├── watchMcLogs()             → Surveillance logs Minecraft en temps réel
├── checkServerStatus()       → Vérification statut toutes les 5 min
└── startMusicPlayer()        → Radio musicale avec crossfade
```

---

## FAQ

**Le bot ne répond pas aux commandes**
→ Vérifie que `CLIENT_ID` et `GUILD_ID` sont corrects et que le bot a bien les permissions `applications.commands`

**RCON ne fonctionne pas**
→ Vérifie que `enable-rcon=true` dans `server.properties` et que le port 25575 n'est pas bloqué par le pare-feu

**La radio ne joue pas**
→ Vérifie que le dossier `MUSIC_DIR` contient des fichiers MP3 et que ffmpeg est bien installé (`ffmpeg-static` dans les dépendances)

**Les logs Minecraft ne s'affichent pas**
→ Vérifie le chemin `MC_LOGS_PATH` — il doit pointer vers `latest.log` du serveur actif
