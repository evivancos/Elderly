const { contextBridge, ipcRenderer, ipcMain } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.send('close'),
  minimizeWindow: () => ipcRenderer.send('minimize'),
  publicUrl: () => ipcRenderer.invoke('publicUrl'),
})

contextBridge.exposeInMainWorld('dataAPI', {
  askUsers: () => ipcRenderer.send('askUsers'),
  getUsers: (users) => ipcRenderer.on('getUsers', users),
  getData: (callback) => ipcRenderer.on('getData', callback),
  getChron: (callback) => {ipcRenderer.on('getChron', callback)},
  sendUserName: (user) => ipcRenderer.send('userName', user),
  askChron: (user) => {ipcRenderer.send('chronData', user)}
})