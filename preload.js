const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    once: (channel, listener) => ipcRenderer.once(channel, listener),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  },
  selectFiles: async () => {
    return await ipcRenderer.invoke('select-files');
  },
});