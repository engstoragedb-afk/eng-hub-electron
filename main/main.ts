import path from 'path'
import { app, ipcMain, dialog } from 'electron'
import pkg from 'electron-updater'
const { autoUpdater } = pkg;
import serve from 'electron-serve'
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

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') {
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Batal', 'Keluar'],
        defaultId: 0,
        cancelId: 0,
        title: 'Konfirmasi Keluar',
        message: 'Apakah Anda yakin ingin keluar dari aplikasi?'
      })
      if (response === 1) {
        app.quit()
      }
      event.preventDefault()
    }
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

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

// Auto Updater Setup
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
  // We can broadcast this to all windows if we keep track of them, 
  // but for simplicity we will send it to the main window if it exists.
  const windows = require('electron').BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('update-available', info);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  const windows = require('electron').BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('update-downloaded', info);
  }
});

autoUpdater.on('error', (err) => {
  console.error('AutoUpdater Error:', err);
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

if (isProd) {
  app.on('ready', () => {
    // Check for updates shortly after app is ready
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  });
}

