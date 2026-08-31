import path from 'path'
import fs from 'fs'
import { app, ipcMain, dialog, BrowserWindow } from 'electron'
import pkg from 'electron-updater'
const { autoUpdater } = pkg;
import serve from 'electron-serve'
import Store from 'electron-store'
import { createWindow } from './helpers/create-window'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

app.disableHardwareAcceleration()

;(async () => {
  await app.whenReady()

  if (!isProd && process.platform === 'darwin') {
    app.dock?.setIcon(path.join(import.meta.dirname, '../renderer/public/images/icon.png'))
  }

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
    },
    icon: isProd ? undefined : path.join(import.meta.dirname, '../renderer/public/images/icon.png'),
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.handle('window-minimize', () => {
  const windows = require('electron').BrowserWindow.getAllWindows();
  const win = windows.length > 0 ? windows[0] : null;
  if (win) win.minimize();
});

ipcMain.handle('window-maximize', () => {
  const windows = require('electron').BrowserWindow.getAllWindows();
  const win = windows.length > 0 ? windows[0] : null;
  if (win) {
    if (win.isFullScreen()) {
      win.setFullScreen(false);
    } else {
      win.setFullScreen(true);
    }
  }
});

ipcMain.handle('window-close', () => {
  const windows = require('electron').BrowserWindow.getAllWindows();
  const win = windows.length > 0 ? windows[0] : null;
  if (!win) return;
  
  const response = dialog.showMessageBoxSync(win, {
    type: 'question',
    buttons: ['Batal', 'Keluar'],
    defaultId: 0,
    cancelId: 0,
    title: 'Konfirmasi Keluar',
    message: 'Apakah Anda yakin ingin keluar dari aplikasi?'
  });
  
  if (response === 1) {
    app.quit();
  }
});

ipcMain.handle('request-quit', () => {
  const windows = require('electron').BrowserWindow.getAllWindows();
  const win = windows.length > 0 ? windows[0] : null;
  if (!win) return;
  
  const response = dialog.showMessageBoxSync(win, {
    type: 'question',
    buttons: ['Batal', 'Keluar'],
    defaultId: 0,
    cancelId: 0,
    title: 'Konfirmasi Keluar',
    message: 'Apakah Anda yakin ingin keluar dari aplikasi?'
  });
  
  if (response === 1) {
    app.quit();
  }
});

ipcMain.handle('save-pdf', async (_event, { html, landscape, filename, paperSize = 'A4' }) => {
  let pdfWin: BrowserWindow | null = null;
  try {
    pdfWin = new BrowserWindow({
      show: false,
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Wait for DOM & CSS rendering to complete
    await new Promise((resolve) => setTimeout(resolve, 350));

    const pdfData = await pdfWin.webContents.printToPDF({
      landscape: Boolean(landscape),
      pageSize: paperSize,
      printBackground: true,
      preferCSSPageSize: true,
    });

    if (pdfWin && !pdfWin.isDestroyed()) {
      pdfWin.destroy();
      pdfWin = null;
    }

    const windows = BrowserWindow.getAllWindows().filter(w => !w.isDestroyed());
    const parentWin = windows.length > 0 ? windows[0] : null;

    const { filePath, canceled } = await dialog.showSaveDialog(parentWin as any, {
      title: 'Simpan Dokumen Laporan (PDF)',
      defaultPath: filename || 'Laporan_Peringatan.pdf',
      filters: [
        { name: 'Dokumen PDF (*.pdf)', extensions: ['pdf'] }
      ]
    });

    if (!canceled && filePath) {
      await fs.promises.writeFile(filePath, pdfData);
      return { success: true, filePath };
    }
    return { canceled: true };
  } catch (err: any) {
    console.error('Failed to save PDF:', err);
    if (pdfWin && !pdfWin.isDestroyed()) {
      pdfWin.destroy();
    }
    return { success: false, error: err.message };
  }
});

// Auto Updater Setup
const store = new Store({
  defaults: { updateChannel: 'latest' }
});

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.channel = store.get('updateChannel', 'latest') as string;

function sendUpdateStatus(status: string, data: any = {}) {
  const windows = require('electron').BrowserWindow.getAllWindows();
  if (windows.length > 0 && !windows[0].isDestroyed()) {
    windows[0].webContents.send('update-status', { status, ...data });
  }
}

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus('checking');
});

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus('available', {
    version: info.version,
    releaseNotes: info.releaseNotes
  });
});

autoUpdater.on('update-not-available', () => {
  sendUpdateStatus('up-to-date');
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus('downloading', {
    percent: Math.round(progress.percent)
  });
});

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus('downloaded', { version: info.version });
});

autoUpdater.on('error', (err) => {
  sendUpdateStatus('error', { message: err.message });
});

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    sendUpdateStatus('checking');
    setTimeout(() => {
      sendUpdateStatus('up-to-date');
    }, 1500);
    return { status: 'dev-mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      status: 'ok',
      version: result?.updateInfo?.version
    };
  } catch (err: any) {
    sendUpdateStatus('error', { message: err.message });
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { status: 'ok' };
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('set-update-channel', (event, channel) => {
  store.set('updateChannel', channel);
  autoUpdater.channel = channel;
  return { status: 'ok', channel };
});

app.whenReady().then(() => {
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('[Updater] Auto-check failed:', err.message);
      });
    }, 5000);
  }
});
