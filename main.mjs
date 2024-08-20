import { app, BrowserWindow, protocol, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Store from 'electron-store';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();
console.log('Electron Store file path:', store.path);

let playQueue = store.get('playQueue', []);
console.log('Retrieved saved state:', playQueue);

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.loadURL('http://localhost:3000'); // Adjust the URL as needed

  // Wait for the renderer to signal it's ready before sending the state
  ipcMain.on('renderer-ready', (event) => {
    console.log('Renderer signaled ready, sending load-state event');
    event.reply('load-state', playQueue);
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('local', (request, callback) => {
    const url = request.url.substr(8); // Remove 'local://' from the URL
    callback({ path: path.normalize(decodeURIComponent(url)) });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('load-state', (event) => {
  const savedState = store.get('playQueue', []);
  console.log('Sending load-state event with savedState:', savedState);
  event.reply('load-state', savedState);
});

ipcMain.handle('select-files', async () => {
  console.log('select-files event received'); // Debug log
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory', 'multiSelections'],
    filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'flac'] }],
  });
  return result.filePaths;
});

ipcMain.handle('save-state', (event, newPlayQueue) => {
  console.log('save-state event received with playQueue:', newPlayQueue); // Debug log
  if (Array.isArray(newPlayQueue) && newPlayQueue.length > 0) {
    playQueue = newPlayQueue;
    store.set('playQueue', playQueue);
    console.log('State saved successfully'); // Debug log
  } else {
    console.warn('Received empty playQueue, not saving state'); // Warning log
  }
});

app.on('before-quit', () => {
  console.log('App is about to quit, saving state'); // Debug log
  store.set('playQueue', playQueue);
  console.log('State saved successfully before quit'); // Debug log
});