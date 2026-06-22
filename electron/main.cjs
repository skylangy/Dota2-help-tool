const path = require("node:path");
const { app, BrowserWindow, Menu, clipboard, ipcMain, screen, shell } = require("electron");
const { startServer } = require("../server/server.cjs");

let mainWindow;
let localServer;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    title: "Dota 2 Help Tool",
    backgroundColor: "#f5f2ea",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

function setCompactMode(enabled) {
  if (!mainWindow) return false;

  if (enabled) {
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const width = 380;
    const height = 520;
    const x = display.workArea.x + display.workArea.width - width - 12;
    const y = display.workArea.y + Math.round((display.workArea.height - height) / 2);
    mainWindow.setAlwaysOnTop(true, "normal");
    mainWindow.setResizable(false);
    mainWindow.setSize(width, height);
    mainWindow.setPosition(x, y);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setSize(1180, 760);
    mainWindow.center();
  }

  return true;
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  ipcMain.handle("window:set-compact-mode", (_event, enabled) => setCompactMode(enabled));
  ipcMain.handle("clipboard:write-text", (_event, text) => {
    clipboard.writeText(String(text ?? ""));
    return true;
  });
  localServer = await startServer({ silent: false, allowExisting: true });
  await createWindow();

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

app.on("before-quit", () => {
  if (localServer && !localServer.existing) {
    localServer.wss.close();
    localServer.server.close();
  }
});
