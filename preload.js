const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onLoadState: (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    const listener = (event, savedState) => callback(savedState);
    ipcRenderer.on('load-state', listener);
    return () => ipcRenderer.removeListener('load-state', listener);
  },
  rendererReady: () => ipcRenderer.send('renderer-ready'),
  selectFiles: async () => {
    try {
      return await ipcRenderer.invoke('select-files');
    } catch (error) {
      console.error('Error selecting files:', error);
      throw error;
    }
  },
  saveState: async (playQueue) => {
    if (!Array.isArray(playQueue)) {
      throw new Error('PlayQueue must be an array');
    }
    try {
      return await ipcRenderer.invoke('save-state', playQueue);
    } catch (error) {
      console.error('Error saving state:', error);
      throw error;
    }
  },
});

console.log('Preload script initialized');