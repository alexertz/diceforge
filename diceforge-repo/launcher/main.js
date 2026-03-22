const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const net  = require('net');

app.setName('DiceForge');

const MC_DIR      = path.join(os.homedir(), '.diceforge');
const CONFIG_PATH = path.join(MC_DIR, 'launcher-config.json');
const SERVER_HOST = 'they-marketing.gl.joinmc.link';
const SERVER_PORT = 25565;

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1050, height: 680,
    minWidth: 900, minHeight: 600,
    frame: false, transparent: false,
    backgroundColor: '#1a1610',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'DiceForge',
  });
  win.loadFile('src/index.html');
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'assets', 'icon.png'));
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── Fenêtre ──────────────────────────────────────────────────
ipcMain.on('win-close',    () => win.close());
ipcMain.on('win-minimize', () => win.minimize());
ipcMain.on('win-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());

// ── Config (sauvegarde auto du pseudo + RAM) ─────────────────
ipcMain.handle('get-config', () => {
  try {
    if (fs.existsSync(CONFIG_PATH))
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {}
  return { username: '', memory: 2048 };
});

ipcMain.handle('set-config', (event, cfg) => {
  fs.mkdirSync(MC_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  return true;
});

// ── Ping TCP direct sur l'IP réelle ply.gg ──────────────────
// ply.gg bloque les pings externes (mcsrvstat, etc.)
// On fait un TCP handshake direct sur l'IPv4 connue
ipcMain.handle('ping-server', async () => {
  // Essayer plusieurs adresses connues
  const targets = [
    { host: '147.185.221.31',              port: 55036 },
    { host: 'they-marketing.gl.at.ply.gg', port: 55036 },
  ];

  for (const target of targets) {
    const result = await new Promise(resolve => {
      const start  = Date.now();
      const socket = new net.Socket();
      socket.setTimeout(4000);
      socket.connect(target.port, target.host, () => {
        const ping = Date.now() - start;
        socket.destroy();
        resolve({ online: true, ping, players: 0, max: 0 });
      });
      socket.on('error',   () => { socket.destroy(); resolve(null); });
      socket.on('timeout', () => { socket.destroy(); resolve(null); });
    });
    if (result) return result;
  }

  return { online: false, ping: null, players: 0, max: 0 };
});

// ── Injecter servers.dat // ── Injecter servers.dat ────────────────────────────────────
// Format NBT binaire minimal pour Minecraft — ajoute DiceForge à la liste multijoueur
function injectServersDat(mcDir) {
  const serversPath = path.join(mcDir, 'servers.dat');

  // NBT binaire encodé pour un fichier servers.dat avec DiceForge
  // Structure : TAG_Compound > servers (TAG_List) > TAG_Compound { name, ip, acceptTextures }
  const serverName = 'DiceForge SMP';
  const serverIp   = 'they-marketing.gl.joinmc.link';

  // Encoder en NBT manuellement (format binaire Minecraft)
  function writeNBT() {
    const bufs = [];

    const writeString = (str) => {
      const b = Buffer.from(str, 'utf8');
      const len = Buffer.alloc(2);
      len.writeUInt16BE(b.length);
      return Buffer.concat([len, b]);
    };

    const writeTag = (type, name, payload) => {
      const typeBuf  = Buffer.from([type]);
      const nameBuf  = writeString(name);
      return Buffer.concat([typeBuf, nameBuf, payload]);
    };

    // TAG_String payloads
    const mkString = (val) => writeString(val);

    // Server entry : TAG_Compound
    const serverEntry = Buffer.concat([
      Buffer.from([8]),  writeString('name'),          mkString(serverName),
      Buffer.from([8]),  writeString('ip'),            mkString(serverIp),
      Buffer.from([1]),  writeString('acceptTextures'), Buffer.from([1]),
      Buffer.from([0]),  // TAG_End
    ]);

    // TAG_List of TAG_Compound (type 10 = Compound)
    const listPayload = Buffer.concat([
      Buffer.from([10]),           // element type = Compound
      Buffer.alloc(4),             // length = 1 (écrit après)
      serverEntry,
    ]);
    listPayload.writeInt32BE(1, 1); // 1 élément

    // Racine TAG_Compound
    const root = Buffer.concat([
      Buffer.from([10]), writeString(''),  // TAG_Compound root vide
      Buffer.from([9]),  writeString('servers'), listPayload,
      Buffer.from([0]),  // TAG_End
    ]);

    return root;
  }

  try {
    fs.mkdirSync(mcDir, { recursive: true });

    // Si servers.dat existe déjà et contient DiceForge, ne pas écraser
    if (fs.existsSync(serversPath)) {
      const existing = fs.readFileSync(serversPath);
      if (existing.toString('utf8', 0, existing.length).includes('DiceForge')) {
        return; // déjà présent
      }
    }

    fs.writeFileSync(serversPath, writeNBT());
    console.log('[DiceForge] servers.dat injecté');
  } catch (err) {
    console.error('[DiceForge] Erreur servers.dat:', err.message);
  }
}

// ── Lancer Minecraft ─────────────────────────────────────────
ipcMain.handle('launch-minecraft', async (event, { username, memory }) => {
  try {
    const { Client, Authenticator } = require('minecraft-launcher-core');
    const launcher = new Client();
    fs.mkdirSync(MC_DIR, { recursive: true });

    // Sauvegarde automatique du pseudo à chaque lancement
    const cfg = fs.existsSync(CONFIG_PATH)
      ? JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
      : {};
    cfg.username = username;
    cfg.memory   = memory;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));

    const opts = {
      authorization: Authenticator.getAuth(username),
      root: MC_DIR,
      version: { number: '1.21.11', type: 'release' },
      memory: { max: `${memory || 2048}M`, min: '512M' },
      window: { width: 1280, height: 720 },
    };

    launcher.on('debug',    msg => win.webContents.send('mc-debug',    msg));
    launcher.on('data',     msg => win.webContents.send('mc-data',     msg));
    launcher.on('progress', data => {
      win.webContents.send('mc-progress', {
        type: data.type, task: data.task,
        total: data.total, current: data.current,
        percent: data.total > 0 ? Math.round((data.current / data.total) * 100) : 0,
      });
    });
    launcher.on('close', code => {
      win.webContents.send('mc-closed', code);
      win.show();
    });

    // Injecter servers.dat pour que DiceForge apparaisse dans le multijoueur
    injectServersDat(MC_DIR);

    await launcher.launch(opts);
    setTimeout(() => win.hide(), 3000);
    return { ok: true };
  } catch (err) {
    console.error('[MC Launch Error]', err);
    return { ok: false, error: err.message };
  }
});

// ── Vérifier Java ────────────────────────────────────────────
ipcMain.handle('check-java', async () => {
  const { exec } = require('child_process');
  return new Promise(resolve => {
    exec('java -version', (err, stdout, stderr) => {
      if (err) { resolve({ found: false }); return; }
      const match = (stderr || stdout).match(/version "([^"]+)"/);
      resolve({ found: true, version: match ? match[1] : 'inconnue' });
    });
  });
});

// ── Ouvrir le dossier .diceforge dans le Finder ──────────────
ipcMain.handle('open-game-folder', async () => {
  fs.mkdirSync(MC_DIR, { recursive: true });
  shell.openPath(MC_DIR);
  return true;
});

// ── Infos sur le dossier de jeu ──────────────────────────────
ipcMain.handle('get-folder-info', async () => {
  try {
    fs.mkdirSync(MC_DIR, { recursive: true });

    // Calcul taille récursive
    function getDirSize(dirPath) {
      let size = 0;
      if (!fs.existsSync(dirPath)) return 0;
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const full = path.join(dirPath, item);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) size += getDirSize(full);
          else size += stat.size;
        } catch {}
      }
      return size;
    }

    const totalBytes  = getDirSize(MC_DIR);
    const versionDir  = path.join(MC_DIR, 'versions');
    const assetsDir   = path.join(MC_DIR, 'assets');
    const librariesDir= path.join(MC_DIR, 'libraries');

    const toMB = b => (b / 1024 / 1024).toFixed(1) + ' Mo';

    return {
      path:      MC_DIR,
      total:     toMB(totalBytes),
      versions:  fs.existsSync(versionDir)   ? fs.readdirSync(versionDir).filter(f => !f.startsWith('.')) : [],
      hasAssets: fs.existsSync(assetsDir),
      hasLibs:   fs.existsSync(librariesDir),
      installed: fs.existsSync(path.join(versionDir, '1.21.11')),
    };
  } catch (err) {
    return { error: err.message };
  }
});

// ── Supprimer le cache / réinstaller ─────────────────────────
ipcMain.handle('delete-cache', async (event, { what }) => {
  try {
    // what = 'all' | 'assets' | 'version'
    const targets = {
      all:     MC_DIR,
      assets:  path.join(MC_DIR, 'assets'),
      version: path.join(MC_DIR, 'versions', '1.21.11'),
    };

    const target = targets[what];
    if (!target) return { ok: false, error: 'Cible inconnue' };

    const { response } = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['Annuler', 'Supprimer'],
      defaultId: 0,
      cancelId: 0,
      title: 'Confirmer la suppression',
      message: what === 'all'
        ? 'Supprimer toute l\'installation DiceForge ?\nMinecraft sera retéléchargé au prochain lancement.'
        : what === 'version'
        ? 'Supprimer la version 1.21.11 ?\nElle sera retéléchargée au prochain lancement.'
        : 'Supprimer les assets (textures, sons) ?\nIls seront retéléchargés au prochain lancement.',
    });

    if (response === 0) return { ok: false, cancelled: true };

    fs.rmSync(target, { recursive: true, force: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
