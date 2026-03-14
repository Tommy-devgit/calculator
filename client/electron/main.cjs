const { app, BrowserWindow } = require('electron')
const path = require('path')

const devServerUrl = process.env.VITE_DEV_SERVER_URL
const isDev = Boolean(devServerUrl)

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    minWidth: 340,
    minHeight: 520,
    resizable: true,
    backgroundColor: '#0b1118',
    show: false,
    title: 'Orbit Calculator',
    webPreferences: {
      contextIsolation: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
