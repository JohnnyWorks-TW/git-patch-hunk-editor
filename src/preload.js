const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  saveFile: (data) => ipcRenderer.invoke('fs:saveFile', data),
  showMessageBox: (options) => ipcRenderer.invoke('dialog:messageBox', options)
});
