const { app, BrowserWindow, ipcMain } = require("electron");
const url = require("url");
const path = require("path");
const fs = require("fs");

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: "Relevare",
    width: 460,
    height:510,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const startUrl = url.format({pathname: path.join(__dirname, "../build/index.html"), // connect to the React app
    protocol: "file",
    slashes: true,
  });

  mainWindow.loadURL(startUrl); // load app in url app
}

// ===== LISTEN FOR LOG SAVE REQUEST =====
ipcMain.on("save-log", (event, log) => {
  const dir = "C:\\Users\\amfyb\\Desktop\\peers";
  const filePath = path.join(dir, "logs.txt");

  const line = `[${new Date().toISOString()}] ${log.vibe.toUpperCase()} : ${log.text}\n`;

  fs.appendFile(filePath, line, (err) => {
    if (err) {
      console.error("Failed to save log:", err);
      event.reply("save-log-response", "❌ Failed to save log");
    } else {
      console.log("Log saved to", filePath);
      event.reply("save-log-response", "✅ Log saved successfully");
    }
  });
});

app.whenReady().then(createMainWindow);
