const { contextBridge, ipcRenderer } = require('electron');

// Expose minimal API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true
});
