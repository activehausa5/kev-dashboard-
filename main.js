const { app, BrowserWindow, ipcMain, clipboard, dialog } = require('electron'); // Added dialog here
const path = require('path');
const fs = require('fs');
const ffmpeg = require("fluent-ffmpeg");

const ffmpegStatic = require("ffmpeg-static");







// let ffmpegPath;

// if (process.env.NODE_ENV === "development") {
//   // Development: use ffmpeg-static
//   ffmpegPath = require("ffmpeg-static");
// } else {
//   // Packaged app: use the bundled ffmpeg in extraResources
//   ffmpegPath =
//     process.platform === "win32"
//       ? path.join(process.resourcesPath, "ffmpeg", "ffmpeg.exe")
//       : path.join(process.resourcesPath, "ffmpeg", "ffmpeg");
// }

// ffmpeg.setFfmpegPath(ffmpegPath);




// Always use ffmpeg-static in development
let ffmpegPath;

if (app.isPackaged) {
  // Packaged app: use bundled ffmpeg
  ffmpegPath =
    process.platform === "win32"
      ? path.join(process.resourcesPath, "ffmpeg", "ffmpeg.exe")
      : path.join(process.resourcesPath, "ffmpeg", "ffmpeg");
} else {
  // Development: use ffmpeg-static
  ffmpegPath = ffmpegStatic;
}

ffmpeg.setFfmpegPath(ffmpegPath);

console.log("FFmpeg binary is at:", ffmpegPath);





function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Arora Stealer", // Updated title
        icon: path.join(__dirname, 'assets/icon.ico'),
        webPreferences: {
            nodeIntegration: true, // Required for your require('electron') in index.html
            contextIsolation: false
        }
    });

// win.webContents.openDevTools();

    // Make sure index.html is in the same folder as this file
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Handle Copy to Clipboard
ipcMain.on('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
});

// Improved Download with Save Dialog
ipcMain.on('download-json', async (event, { filename, content }) => {
    try {
        const { filePath } = await dialog.showSaveDialog({
            defaultPath: path.join(app.getPath('downloads'), filename),
            filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });

        if (filePath) {
            fs.writeFileSync(filePath, content);
            // Optionally notify the renderer that the save was successful
            event.reply('download-success', 'File saved to: ' + filePath);
        }
    } catch (err) {
        console.error("Save Dialog Error:", err);
    }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});