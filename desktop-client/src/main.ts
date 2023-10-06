import path from "path";
import { BrowserWindow, app } from "electron";

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.resolve(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("dist/index.html");
  mainWindow.webContents.openDevTools(); // Open dev tools for mainWindow

  const secondWindow = new BrowserWindow({
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
