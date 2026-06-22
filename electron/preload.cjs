const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dota2HelpTool", {
  copyText(text) {
    return ipcRenderer.invoke("clipboard:write-text", String(text ?? ""));
  },
  setCompactMode(enabled) {
    return ipcRenderer.invoke("window:set-compact-mode", Boolean(enabled));
  }
});
