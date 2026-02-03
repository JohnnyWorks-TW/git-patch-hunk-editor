"use strict";
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");
if (require("electron-squirrel-startup")) {
  app.quit();
}
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  {
    mainWindow.loadURL("http://localhost:5174");
  }
  if (process.env.IS_TEST) mainWindow.webContents.openDevTools();
};
app.whenReady().then(() => {
  ipcMain.handle("dialog:openFile", handleFileOpen);
  ipcMain.handle("fs:readFile", handleReadFile);
  ipcMain.handle("fs:saveFile", handleFileSave);
  ipcMain.handle("dialog:messageBox", handleMessageBox);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Patch Files", extensions: ["patch", "diff"] }]
  });
  if (!canceled) {
    const filePath = filePaths[0];
    const content = await fs.readFile(filePath, "utf-8");
    return { filePath, content };
  }
}
async function handleReadFile(event, filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return { success: true, content };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function handleMessageBox(event, options) {
  return dialog.showMessageBox(BrowserWindow.fromWebContents(event.sender), options);
}
async function handleFileSave(event, { filePath, content }) {
  try {
    let targetPath = filePath;
    if (!targetPath) {
      const { canceled, filePath: savePath } = await dialog.showSaveDialog({
        filters: [{ name: "Patch Files", extensions: ["patch", "diff"] }]
      });
      if (canceled) return { success: false };
      targetPath = savePath;
    }
    await fs.writeFile(targetPath, content, "utf-8");
    return { success: true, filePath: targetPath };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.message };
  }
}
