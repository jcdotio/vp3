const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectFiles: () => ipcRenderer.invoke('select-files')
});