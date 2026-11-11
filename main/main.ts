import path from 'path'
import fs from 'fs'
import { app, ipcMain, dialog, BrowserWindow, session, systemPreferences, shell, net } from 'electron'
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

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL === '/api'
    ? 'http://127.0.0.1:3012/api'
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3012/api');

let isAppQuittingWithCleanup = false;
let isExitCleanupDone = false;
let syncedAuthSession: { token: string; apiBaseUrl: string } | null = null;
const appWindowIds = new Set<number>();

const getLiveAppWindows = () => {
  return BrowserWindow.getAllWindows().filter(
    (w) => !w.isDestroyed() && appWindowIds.has(w.id)
  );
};

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
};

const readAuthTokenFromWindows = async (): Promise<string> => {
  const windows = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed());
  for (const win of windows) {
    try {
      if (win.webContents && !win.webContents.isDestroyed()) {
        const token = await withTimeout(
          win.webContents.executeJavaScript(`
            (() => {
              try {
                const raw = localStorage.getItem('auth');
                if (!raw) return '';
                const parsed = JSON.parse(raw);
                return (parsed && typeof parsed.token === 'string') ? parsed.token : '';
              } catch (e) {
                return '';
              }
            })()
          `).catch(() => ''),
          600,
          ''
        );
        if (token) return token;
      }
    } catch {}
  }
  return '';
};

const logoutBackendSession = async (token?: string, apiBaseUrl?: string) => {
  const targetToken = token || syncedAuthSession?.token || '';
  const baseUrl = (apiBaseUrl || syncedAuthSession?.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  if (!targetToken) return;

  if (syncedAuthSession?.token === targetToken) {
    syncedAuthSession = null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    await net.fetch(`${baseUrl}/user/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${targetToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
      signal: controller.signal,
    });
  } catch (err) {
    console.warn('[auth-exit] Gagal memanggil /user/logout saat menutup aplikasi:', err);
  } finally {
    clearTimeout(timer);
  }
};

const clearAuthSessionOnExit = async (explicitAuth?: { token?: string; apiBaseUrl?: string }) => {
  if (isExitCleanupDone) return;
  isExitCleanupDone = true;

  let token = explicitAuth?.token || syncedAuthSession?.token || '';
  const apiBaseUrl = explicitAuth?.apiBaseUrl || syncedAuthSession?.apiBaseUrl || DEFAULT_API_BASE_URL;

  if (!token) {
    token = await readAuthTokenFromWindows();
  }

  if (token) {
    await logoutBackendSession(token, apiBaseUrl);
  }
  syncedAuthSession = null;

  const windows = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed());
  await Promise.all(
    windows.map(async (win) => {
      try {
        if (win.webContents && !win.webContents.isDestroyed()) {
          await withTimeout(
            win.webContents.executeJavaScript(`
              try {
                localStorage.removeItem('auth');
                localStorage.setItem('auth', '{}');
                sessionStorage.clear();
              } catch(e) {}
            `).catch(() => {}),
            600,
            undefined
          );
        }
      } catch {}
    })
  );
};

const terminateAppCleanly = () => {
  isAppQuittingWithCleanup = true;
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    try {
      if (!win.isDestroyed()) {
        if (win.isFullScreen()) {
          win.destroy();
        } else {
          win.close();
        }
      }
    } catch {}
  }

  setTimeout(() => {
    for (const win of BrowserWindow.getAllWindows()) {
      try {
        if (!win.isDestroyed()) {
          win.destroy();
        }
      } catch {}
    }
    app.quit();
  }, 250).unref();

  setTimeout(() => {
    app.exit(0);
  }, 1500).unref();

  app.quit();
};

const registerAppWindow = (win: BrowserWindow) => {
  const winId = win.id;
  appWindowIds.add(winId);

  win.on('closed', () => {
    appWindowIds.delete(winId);
  });

  win.webContents.on('will-prevent-unload', (event) => {
    if (isAppQuittingWithCleanup) {
      event.preventDefault();
      return;
    }
    const response = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: ['Tetap di Halaman', 'Tutup Jendela'],
      defaultId: 0,
      cancelId: 0,
      title: 'Perubahan Belum Disimpan',
      message: 'Formulir memiliki perubahan yang belum disimpan. Tetap tutup jendela ini?',
    });
    if (response === 1) {
      event.preventDefault();
    }
  });

  win.on('close', (event) => {
    if (isAppQuittingWithCleanup) {
      return;
    }
    const liveAppWindows = getLiveAppWindows();
    if (liveAppWindows.length <= 1) {
      event.preventDefault();
      isAppQuittingWithCleanup = true;
      void (async () => {
        await clearAuthSessionOnExit();
        terminateAppCleanly();
      })();
    }
  });
};

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
      plugins: true,
    },
    icon: isProd ? undefined : path.join(import.meta.dirname, '../renderer/public/images/icon.png'),
  })

  registerAppWindow(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('before-quit', (event) => {
  if (!isAppQuittingWithCleanup) {
    isAppQuittingWithCleanup = true;
    event.preventDefault();
    void (async () => {
      await clearAuthSessionOnExit();
      terminateAppCleanly();
    })();
  }
});

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.handle('auth-session-sync', (_event, payload?: { token?: string; apiBaseUrl?: string }) => {
  const token = typeof payload?.token === 'string' ? payload.token.trim() : '';
  const apiBaseUrl = typeof payload?.apiBaseUrl === 'string' && payload.apiBaseUrl.trim()
    ? payload.apiBaseUrl.trim()
    : (syncedAuthSession?.apiBaseUrl || DEFAULT_API_BASE_URL);

  if (token) {
    isExitCleanupDone = false;
    syncedAuthSession = { token, apiBaseUrl };
  } else {
    syncedAuthSession = null;
  }
  return true;
});

ipcMain.handle('open-external', async (_event, url: string) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle('window-minimize', (event) => {
  const win = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.handle('window-flash', (event) => {
  const win = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || BrowserWindow.getFocusedWindow();
  if (win) {
    win.flashFrame(true);
    if (process.platform === 'darwin') {
      app.dock?.bounce('critical');
    }
  }
});

ipcMain.handle('window-focus', (event) => {
  const allWindows = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed());
  const win =
    (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) ||
    BrowserWindow.getFocusedWindow() ||
    (allWindows.length > 0 ? allWindows[0] : null);
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
  if (process.platform === 'darwin') {
    app.focus({ steal: true });
  }
  return true;
});

ipcMain.handle('window-maximize', (event) => {
  const win = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isFullScreen()) {
      win.setFullScreen(false);
    } else {
      win.setFullScreen(true);
    }
  }
});

const getTargetWindow = (event?: Electron.IpcMainInvokeEvent) => {
  const liveAppWindows = getLiveAppWindows();
  return (
    (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) ||
    BrowserWindow.getFocusedWindow() ||
    (liveAppWindows.length > 0 ? liveAppWindows[0] : null)
  );
};

const promptExitConfirmation = async (win?: BrowserWindow | null) => {
  const options: Electron.MessageBoxOptions = {
    type: 'question',
    buttons: ['Batal', 'Keluar'],
    defaultId: 0,
    cancelId: 0,
    title: 'Konfirmasi Keluar',
    message: 'Apakah Anda yakin ingin keluar dari aplikasi?',
    detail: 'Sesi akun Anda akan otomatis di-logout sebelum aplikasi ditutup.',
  };

  // On macOS/fullscreen windows, avoid parent-sheet lockups by presenting an app modal dialog
  const result = win && !win.isDestroyed() && !win.isFullScreen()
    ? await dialog.showMessageBox(win, options)
    : await dialog.showMessageBox(options);
  return result.response === 1;
};

ipcMain.handle('window-close-prepare', (event) => {
  const liveAppWindows = getLiveAppWindows();
  const win = getTargetWindow(event);
  if (!win || win.isDestroyed()) {
    return { action: 'confirm-quit', windowCount: liveAppWindows.length };
  }

  if (liveAppWindows.length > 1) {
    if (win.isFullScreen()) {
      win.destroy();
    } else {
      win.close();
    }
    return { action: 'closed-secondary', windowCount: Math.max(0, liveAppWindows.length - 1) };
  }

  return { action: 'confirm-quit', windowCount: liveAppWindows.length };
});

ipcMain.handle('app-quit-confirmed', async (_event, payload?: { token?: string; apiBaseUrl?: string }) => {
  if (payload?.token) {
    isExitCleanupDone = false;
    syncedAuthSession = {
      token: payload.token,
      apiBaseUrl: payload.apiBaseUrl || syncedAuthSession?.apiBaseUrl || DEFAULT_API_BASE_URL,
    };
  }
  isAppQuittingWithCleanup = true;
  await clearAuthSessionOnExit(payload);
  terminateAppCleanly();
  return true;
});

ipcMain.handle('window-close', async (event) => {
  const liveAppWindows = getLiveAppWindows();
  const win = getTargetWindow(event);
  if (!win || win.isDestroyed()) return;

  if (liveAppWindows.length > 1) {
    if (win.isFullScreen()) {
      win.destroy();
    } else {
      win.close();
    }
    return;
  }

  const confirmed = await promptExitConfirmation(win);
  if (confirmed) {
    isAppQuittingWithCleanup = true;
    await clearAuthSessionOnExit();
    terminateAppCleanly();
  }
});

ipcMain.handle('request-quit', async () => {
  const liveAppWindows = getLiveAppWindows();
  const win = liveAppWindows.length > 0 ? liveAppWindows[0] : null;
  if (!win) {
    isAppQuittingWithCleanup = true;
    await clearAuthSessionOnExit();
    terminateAppCleanly();
    return;
  }

  const confirmed = await promptExitConfirmation(win);
  if (confirmed) {
    isAppQuittingWithCleanup = true;
    await clearAuthSessionOnExit();
    terminateAppCleanly();
  }
});

ipcMain.handle('window-duplicate', async (event, targetRoute?: string) => {
  const currentWin = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || BrowserWindow.getFocusedWindow();
  let x: number | undefined;
  let y: number | undefined;
  let width = 1200;
  let height = 800;

  if (currentWin && !currentWin.isFullScreen()) {
    const bounds = currentWin.getBounds();
    x = bounds.x + 30;
    y = bounds.y + 30;
    width = bounds.width;
    height = bounds.height;
  }

  const newWin = new BrowserWindow({
    width,
    height,
    x,
    y,
    fullscreen: false,
    autoHideMenuBar: true,
    title: 'Eng Hub Panel',
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      plugins: true,
    },
    icon: isProd ? undefined : path.join(import.meta.dirname, '../renderer/public/images/icon.png'),
  });

  registerAppWindow(newWin);

  const port = process.argv[2] || '8888';
  let targetUrl: string;
  let fallbackUrl: string;

  if (isProd) {
    fallbackUrl = 'app://./home';
    if (targetRoute && targetRoute !== '/' && targetRoute !== '/home') {
      const cleanPath = targetRoute.replace(/^\//, '').split('?')[0];
      targetUrl = `app://./${cleanPath}`;
    } else {
      targetUrl = fallbackUrl;
    }
  } else {
    fallbackUrl = `http://localhost:${port}/home`;
    if (targetRoute && targetRoute !== '/') {
      const route = targetRoute.startsWith('/') ? targetRoute : `/${targetRoute}`;
      targetUrl = `http://localhost:${port}${route}`;
    } else {
      targetUrl = fallbackUrl;
    }
  }

  try {
    await newWin.loadURL(targetUrl);
  } catch (err) {
    console.warn(`[window-duplicate] Gagal memuat ${targetUrl}, fallback ke ${fallbackUrl}:`, err);
    try {
      await newWin.loadURL(fallbackUrl);
    } catch (e2) {
      console.error('[window-duplicate] Gagal memuat fallback URL:', e2);
    }
  }

  return true;
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
