const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  close:    () => ipcRenderer.send('win-close'),
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),

  launchMinecraft: (opts) => ipcRenderer.invoke('launch-minecraft', opts),
  checkJava:       ()     => ipcRenderer.invoke('check-java'),
  pingServer:      ()     => ipcRenderer.invoke('ping-server'),

  getConfig:       ()     => ipcRenderer.invoke('get-config'),
  setConfig:       (cfg)  => ipcRenderer.invoke('set-config', cfg),

  openGameFolder:  ()           => ipcRenderer.invoke('open-game-folder'),
  getFolderInfo:   ()           => ipcRenderer.invoke('get-folder-info'),
  deleteCache:     (opts)       => ipcRenderer.invoke('delete-cache', opts),

  onProgress: (cb) => ipcRenderer.on('mc-progress', (_, d) => cb(d)),
  onData:     (cb) => ipcRenderer.on('mc-data',     (_, d) => cb(d)),
  onDebug:    (cb) => ipcRenderer.on('mc-debug',    (_, d) => cb(d)),
  onClosed:   (cb) => ipcRenderer.on('mc-closed',   (_, d) => cb(d)),
});
