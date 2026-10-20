import path from 'path'
import fs from 'fs'
import { app, ipcMain, dialog, BrowserWindow, session, systemPreferences, shell } from 'electron'
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

if (process.env.ELECTRON_DISABLE_GPU === 'true') {
  app.disableHardwareAcceleration()
} else {
  // Aktifkan akselerasi GPU & hardware rendering untuk performa kencang dan render 60fps
  app.commandLine.appendSwitch('enable-gpu-rasterization')
  app.commandLine.appendSwitch('enable-zero-copy')
}

;(async () => {
  await app.whenReady()

  // Izinkan akses media (audio/microphone) untuk fitur Voice Note di Chat
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });

  if (process.platform === 'darwin') {
    try {
      await systemPreferences.askForMediaAccess('microphone');
    } catch (e) {
      console.warn('askForMediaAccess error:', e);
    }
  }

  ipcMain.handle('get-mic-status', async () => {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('microphone');
      const asked = await systemPreferences.askForMediaAccess('microphone');
      return { status, asked };
    }
    return { status: 'not-darwin', asked: true };
  });

  ipcMain.handle('open-mic-settings', async () => {
    if (process.platform === 'darwin') {
      try {
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');
        return true;
      } catch (e) {
        console.warn('Error opening mic settings:', e);
        try {
          const { exec } = require('child_process');
          exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"');
          return true;
        } catch (_) {}
      }
    } else if (process.platform === 'win32') {
      try {
        await shell.openExternal('ms-settings:privacy-microphone');
        return true;
      } catch (e) {
        console.warn('Error opening Windows mic settings:', e);
        try {
          const { exec } = require('child_process');
          exec('start ms-settings:privacy-microphone');
          return true;
        } catch (_) {}
      }
    }
    return false;
  });

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

ipcMain.handle('window-flash', () => {
  const windows = BrowserWindow.getAllWindows();
  const win = windows.length > 0 ? windows[0] : null;
  if (win) {
    win.flashFrame(true);
    if (process.platform === 'darwin') {
      app.dock?.bounce('critical');
    }
  }
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


// Temporary Local Evidence Handlers (Background Sync & Offline Fallback)
ipcMain.handle("evidence-save-temp", async (_event, { taskId, filename, base64Data }) => {
  try {
    const tempDir = path.join(app.getPath("userData"), "temp_evidence", String(taskId));
    await fs.promises.mkdir(tempDir, { recursive: true });
    const filePath = path.join(tempDir, filename);
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    await fs.promises.writeFile(filePath, Buffer.from(cleanBase64, "base64"));
    return { success: true, filePath };
  } catch (err: any) {
    console.error("Failed to save temp evidence:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("evidence-delete-temp", async (_event, { taskId }) => {
  try {
    const tempDir = path.join(app.getPath("userData"), "temp_evidence", String(taskId));
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("evidence-get-temp", async (_event, { taskId }) => {
  try {
    const tempDir = path.join(app.getPath("userData"), "temp_evidence", String(taskId));
    if (!fs.existsSync(tempDir)) return { files: [] };
    const filenames = await fs.promises.readdir(tempDir);
    const files = [];
    for (const f of filenames) {
      const p = path.join(tempDir, f);
      const buf = await fs.promises.readFile(p);
      files.push(`data:image/jpeg;base64,${buf.toString("base64")}`);
    }
    return { files };
  } catch (err: any) {
    return { files: [] };
  }
});

ipcMain.handle('save-pdf', async (_event, { html, landscape, filename, paperSize = 'A4' }) => {
  let pdfWin: BrowserWindow | null = null;
  let tempFilePath: string | null = null;
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

    const tempDir = app.getPath('temp');
    tempFilePath = path.join(tempDir, `print_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);
    await fs.promises.writeFile(tempFilePath, html, 'utf-8');
    await pdfWin.loadFile(tempFilePath);

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
  } finally {
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (_) {}
    }
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
