import { app, BrowserWindow, protocol, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
import fs from 'fs';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log(`Preload script path: ${preloadPath}`); // Debug log

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  win.loadURL('http://localhost:3000');
  win.webContents.openDevTools();

  win.webContents.on('did-finish-load', () => {
    console.log('Window finished loading'); // Debug log
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load: ${errorDescription} (code: ${errorCode})`); // Debug log
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

// Helper function to recursively find media files in a directory
const findMediaFiles = (dir, extensions) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findMediaFiles(file, extensions));
    } else {
      if (extensions.includes(path.extname(file).toLowerCase())) {
        results.push(file);
      }
    }
  });
  return results;
};

// IPC handlers
ipcMain.handle('select-files', async () => {
  console.log('select-files event received'); // Debug log
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory', 'multiSelections'],
    filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'flac'] }],
  });
  return result.filePaths;
});