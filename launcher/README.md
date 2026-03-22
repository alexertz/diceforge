# 🎲 DiceForge Launcher

Launcher desktop pour le serveur Minecraft DiceForge — construit avec Electron + minecraft-launcher-core.

## ⚡ Installation rapide

### Prérequis
- **Node.js 18+** → https://nodejs.org
- **Java 17+** → https://adoptium.net (requis pour lancer Minecraft)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Lancer en mode développement
```bash
npm start
```

### 3. Builder l'installateur Windows (.exe)
```bash
npm run build-win
```
→ L'installateur `.exe` sera dans le dossier `dist/`

### 4. Builder pour Mac (.dmg)
```bash
npm run build-mac
```

---

## 📁 Structure du projet

```
diceforge-launcher/
├── main.js          ← Processus principal Electron (lancement MC, IPC)
├── preload.js       ← Bridge sécurisé renderer ↔ main
├── package.json     ← Dépendances + config electron-builder
├── src/
│   └── index.html   ← Interface complète du launcher
└── assets/
    ├── icon.png     ← Icône app (512x512 PNG)
    ├── icon.ico     ← Icône Windows
    └── icon.icns    ← Icône Mac
```

---

## ⚙️ Personnalisation

### Changer l'adresse du serveur
Dans `main.js`, ligne `server: { host: ... }` :
```js
server: {
  host: 'play.diceforge.net',
  port: 25565,
},
```

### Changer les actualités / événements
Dans `src/index.html`, modifie les tableaux `NEWS` et `CHANGELOG` et la date `EVENT.date`.

### Changer la RAM par défaut
Dans `src/index.html`, modifie `value="2048"` sur les sliders RAM.

---

## 🔑 Notes importantes

- Le launcher utilise le **mode hors ligne** (`Authenticator.getAuth(username)`).  
  Si tu veux le mode en ligne avec un vrai compte Microsoft, il faut intégrer MSAL (Microsoft Auth Library) — c'est un projet plus complexe.

- La première fois, le launcher **télécharge automatiquement** Minecraft 1.21.1 (~200 Mo) dans `~/.diceforge/`.

- Les fichiers Minecraft sont stockés dans `~/.diceforge/` pour ne pas interférer avec le `.minecraft` officiel.

---

## 🐛 Dépannage

| Problème | Solution |
|---|---|
| `Java not found` | Installe Java 17+ et redémarre le launcher |
| Minecraft ne démarre pas | Vérifie les logs dans la console Electron |
| Téléchargement bloqué | Vérifie ta connexion internet |
| Écran noir au lancement | Met à jour les drivers graphiques |
