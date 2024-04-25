const { app, BrowserWindow, ipcMain } = require('electron')

const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const Store = require('electron-store');

const express = require('express');
const fileUpload = require('express-fileupload');
const expressApp = express();

const ngrok = require('ngrok');
const dataService = require('./dataService');

const appData = app.getPath('userData');

expressApp.use(fileUpload());

let mainWindow;
let url;
let store = new Store();


if (!fs.existsSync(appData + '/backups')) {
  fs.mkdirSync(appData + '/backups');
}

console.log(appData);

Object.keys(store.store).forEach(key => {
  if (!fs.existsSync(appData + '/backups/' +store.get(key) + '.db')) store.delete(key);
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  mainWindow.loadURL(isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`
  );

  mainWindow.on('closed', () => mainWindow = null);
}

app.on('ready', () => {
  ExpressAPI();
  ElectronAPI();
  dataAPI();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


// =========================================
// ================ UTILS ==================
// =========================================
function ElectronAPI() {
  ipcMain.on('close', () => { mainWindow.close() });
  ipcMain.on('minimize', () => { mainWindow.minimize() });
  ipcMain.handle('publicUrl', () => { return url; });
}

function dataAPI() {
  ipcMain.on('askUsers', () => { mainWindow.webContents.send('getUsers', Object.keys(store.store)) })
  ipcMain.on('userName', (event, user) => {
    if (user == null) return;
    let filename = store.get(user);
    let path = (appData + '/backups/' + filename + '.db');
    dataService.valueUsers(path).then((values) => {
      mainWindow.webContents.send('getData', values);
    });
  })
  ipcMain.on('chronData', (event, user) => {
    if (user == null) return;
    let filename = store.get(user);
    let path = (appData + '/backups/' + filename + '.db');
    dataService.chronData(path).then((values) => {
      mainWindow.webContents.send('getChron', values);
    });
  })
}


/**
 * Endpoint para la recepción del .db desde el móvil
 * Asocia el fichero al nombre registrado en la app móvil
 * Sobreescribe en disco si ya había una BBDD
 */
function ExpressAPI() {
  expressApp.post('/upload', (req, res) => {
    let user = (req.get('user'));
    let filename = store.get(user);;
    if (filename === undefined) {
      filename = (Math.random() + 1).toString(36).substring(3);
      store.set(user, filename);
    }

    fs.writeFile(
      appData + '/backups/' + filename + '.db', req.files.file.data,
      (err) => {
        if (err) return console.log(err);
      }
    )

    dataService.valueUsers(appData + '/backups/' + filename + '.db').then((values) => {
      mainWindow.webContents.send('getUsers', Object.keys(store.store));
    });

    res.send({ statusCode: 200 })
  })

  expressApp.listen(80);

  (async () => {
    let tunnel = await ngrok.connect();
    url = tunnel;
  })();
}
