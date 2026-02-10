const fs = require("fs");
const path = require("path");
const https = require("https");
const os = require("os");
const { execSync } = require("child_process");
const { pipeline } = require("stream");
const { promisify } = require("util");
const unzipper = require("unzipper");

const pipe = promisify(pipeline);

const rootDir = process.cwd();
const ffmpegDir = path.join(rootDir, "ffmpeg");

if (!fs.existsSync(ffmpegDir)) fs.mkdirSync(ffmpegDir, { recursive: true });

const platform = os.platform();

let ffmpegUrl;
let ffmpegBinary; // path to binary after extraction

if (platform === "darwin") {
  ffmpegUrl = "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip";
  ffmpegBinary = path.join(ffmpegDir, "ffmpeg");
} else if (platform === "win32") {
  ffmpegUrl =
    "https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-6.1.1-essentials_build.zip";
  ffmpegBinary = path.join(ffmpegDir, "ffmpeg.exe");
} else if (platform === "linux") {
  ffmpegUrl =
    "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";
  ffmpegBinary = path.join(ffmpegDir, "ffmpeg");
} else {
  console.error("Unsupported platform:", platform);
  process.exit(1);
}

const zipPath = path.join(rootDir, "ffmpeg_download.tmp");

// Skip if already exists
if (fs.existsSync(ffmpegBinary)) {
  console.log("ffmpeg already exists, skipping download ✅");
  process.exit(0);
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(`Download failed: ${res.statusCode}`);
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", reject);
  });
}

async function extractZip(zipFile, destDir) {
  await pipe(fs.createReadStream(zipFile), unzipper.Extract({ path: destDir }));
}

async function extractTarXz(tarFile, destDir) {
  execSync(`tar -xJf "${tarFile}" -C "${destDir}" --strip-components=1`);
}

(async () => {
  console.log("Downloading ffmpeg...");
  await downloadFile(ffmpegUrl, zipPath);

  console.log("Extracting ffmpeg...");
  if (platform === "darwin" || platform === "win32") {
    await extractZip(zipPath, ffmpegDir);
  } else if (platform === "linux") {
    await extractTarXz(zipPath, ffmpegDir);
  }

  fs.unlinkSync(zipPath);

  // Ensure executable permission on Unix
  if (platform !== "win32") {
    fs.chmodSync(ffmpegBinary, 0o755);
  }

  console.log(`ffmpeg ready ✅ → ${ffmpegBinary}`);
})();
