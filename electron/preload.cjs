const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dota2HelpTool", {
  setCompactMode(enabled) {
    return ipcRenderer.invoke("window:set-compact-mode", Boolean(enabled));
  }
});
