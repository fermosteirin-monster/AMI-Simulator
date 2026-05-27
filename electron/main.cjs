// electron/main.cjs – CommonJS (requerido por Electron)
// Nota: .cjs ignora el "type":"module" del package.json

const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'AMI Simulator – Edesur Financial Model',
    backgroundColor: '#08081a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  });

  // Cargar dist/index.html generado por Vite
  win.loadFile(path.join(__dirname, '../dist/index.html'));

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Abrir links externos en el browser del sistema
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Menú mínimo
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Recargar', accelerator: 'F5',
          click: () => win.webContents.reload(),
        },
        { type: 'separator' },
        { label: 'Salir', accelerator: 'Alt+F4', click: () => app.quit() },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Pantalla completa', accelerator: 'F11',
          click: () => win.setFullScreen(!win.isFullScreen()),
        },
        {
          label: 'Zoom +', accelerator: 'CmdOrCtrl+=',
          click: () => win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5),
        },
        {
          label: 'Zoom −', accelerator: 'CmdOrCtrl+-',
          click: () => win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5),
        },
        {
          label: 'Zoom original', accelerator: 'CmdOrCtrl+0',
          click: () => win.webContents.setZoomLevel(0),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
