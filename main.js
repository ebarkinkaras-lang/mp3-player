const { app, BrowserWindow, dialog, Menu, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 850,
        height: 580,
        minWidth: 780,
        minHeight: 520,
        resizable: true,
        frame: false,
        transparent: false,
        backgroundColor: '#050d1a',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0d1f3c',
            symbolColor: '#00b4ff',
            height: 32
        }
    });

    mainWindow.loadFile('index.html');

    // Remove default menu
    Menu.setApplicationMenu(null);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
