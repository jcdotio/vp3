import { app, BrowserWindow, protocol, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
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
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('local', (request, callback) => {
    const url = request.url.substr(8); // Remove 'local://' from the URL
    callback({ path: path.normalize(url) });
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

// IPC handlers
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'flac'] }],
  });
  return result.filePaths;
});