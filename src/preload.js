const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveLog: (log) => ipcRenderer.send("save-log", log),
  onSaveLogResponse: (callback) =>
    ipcRenderer.on("save-log-response", (event, message) => callback(message)),
});
