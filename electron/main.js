// electron/main.js – Proceso principal de Electron

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Desactivar aceleración por hardware en algunos entornos con GPU limitada
app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'AMI Simulator – Edesur Financial Model',
    backgroundColor: '#08081a',
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../dist/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false, // Esperar a que cargue antes de mostrar
  });

  // Cargar el dist/ generado por Vite
  win.loadFile(path.join(__dirname, '../dist/index.html'));

  // Mostrar ventana cuando esté lista (evita flash blanco)
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Abrir links externos en el browser del sistema (no en Electron)
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Menu mínimo
  const { Menu } = require('electron');
  const template = [
    {
      label: 'Archivo',
      submenu: [
        { label: 'Recargar', accelerator: 'F5', click: () => win.webContents.reload() },
        { type: 'separator' },
        { label: 'Salir', accelerator: 'Alt+F4', click: () => app.quit() },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Pantalla completa', accelerator: 'F11', click: () => win.setFullScreen(!win.isFullScreen()) },
        { label: 'Zoom +', accelerator: 'CmdOrCtrl+=', click: () => win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom −', accelerator: 'CmdOrCtrl+-', click: () => win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5) },
        { label: 'Zoom original', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.setZoomLevel(0) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
