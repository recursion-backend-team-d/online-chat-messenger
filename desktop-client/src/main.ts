import path from "path";
import { BrowserWindow, app } from "electron";

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800, // initial width
    height: 600, // initial height
    minWidth: 500, // minimum width
    minHeight: 600, // minimum height
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.resolve(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("dist/index.html");
  mainWindow.webContents.openDevTools(); // Open dev tools for mainWindow

  const secondWindow = new BrowserWindow({
    width: 800, // initial width
    height: 600, // initial height
    minWidth: 500, // minimum width
    minHeight: 600, // minimum height
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.resolve(__dirname, "preload.js"),
    },
  });
  secondWindow.loadFile("dist/index.html");
  secondWindow.webContents.openDevTools(); // Open dev tools for secondWindow
};

app.whenReady().then(() => {
  createWindow();
});

app.once("window-all-closed", () => app.quit());
