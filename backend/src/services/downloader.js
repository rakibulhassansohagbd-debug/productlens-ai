// ============================================================
// ProductLens AI — yt-dlp Video Downloader Service
// ============================================================
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const IS_WINDOWS = os.platform() === 'win32';

// Common Windows install locations for yt-dlp (winget, scoop, pip, manual)
const WINDOWS_YTDLP_PATHS = [
  'C:\\Program Files\\yt-dlp\\yt-dlp.exe',
  'C:\\Program Files (x86)\\yt-dlp\\yt-dlp.exe',
  `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe\\yt-dlp.exe`,
  `${process.env.USERPROFILE}\\scoop\\shims\\yt-dlp.exe`,
  `${process.env.USERPROFILE}\\AppData\\Roaming\\Python\\Scripts\\yt-dlp.exe`,
];

// Linux install locations (Docker container)
const LINUX_YTDLP_PATHS = [
  '/usr/local/bin/yt-dlp',
  '/usr/bin/yt-dlp',
];

/**
 * Find the ffmpeg executable — required by yt-dlp for merging video+audio.
 */
function findFfmpeg() {
  // On Linux (Docker): ffmpeg is on PATH, return null so yt-dlp finds it itself
  if (!IS_WINDOWS) {
    try {
      const result = execSync('which ffmpeg', { encoding: 'utf8', stdio: 'pipe' }).trim();
      if (result) {
        console.log(`[Downloader] Found ffmpeg at: ${result}`);
        return path.dirname(result);
      }
    } catch {}
    return null; // yt-dlp will find it automatically
  }

  // Windows: use where.exe
  try {
    const result = execSync('where.exe ffmpeg', { encoding: 'utf8', stdio: 'pipe' }).trim();
    const firstLine = result.split(/\r?\n/)[0].trim();
    if (firstLine && fs.existsSync(firstLine)) return path.dirname(firstLine);
  } catch {}

  // Scan WinGet Packages for yt-dlp.FFmpeg
  try {
    const wingetBase = `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages`;
    if (fs.existsSync(wingetBase)) {
      const entries = fs.readdirSync(wingetBase, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (!entry.name.toLowerCase().includes('ffmpeg')) continue;
        const subDir = path.join(wingetBase, entry.name);
        try {
          const subs = fs.readdirSync(subDir, { withFileTypes: true });
          for (const sub of subs) {
            if (sub.isDirectory()) {
              const binDir = path.join(subDir, sub.name, 'bin');
              if (fs.existsSync(path.join(binDir, 'ffmpeg.exe'))) {
                console.log(`[Downloader] Found ffmpeg at: ${binDir}`);
                return binDir;
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  return null;
}

/**
 * Find the yt-dlp executable path.
 * Tries PATH first, then known install locations (Windows & Linux).
 */
function findYtDlp() {
  // Linux (Docker): check known paths directly
  if (!IS_WINDOWS) {
    for (const p of LINUX_YTDLP_PATHS) {
      if (fs.existsSync(p)) {
        console.log(`[Downloader] Found yt-dlp at: ${p}`);
        return p;
      }
    }
    // Fallback: try which
    try {
      const result = execSync('which yt-dlp', { encoding: 'utf8', stdio: 'pipe' }).trim();
      if (result) {
        console.log(`[Downloader] Found yt-dlp via which: ${result}`);
        return result;
      }
    } catch {}
    return null;
  }

  // Windows: use where.exe first
  try {
    const result = execSync('where.exe yt-dlp', { encoding: 'utf8', stdio: 'pipe' }).trim();
    const firstLine = result.split(/\r?\n/)[0].trim();
    if (firstLine && fs.existsSync(firstLine)) {
      console.log(`[Downloader] Found yt-dlp via PATH: ${firstLine}`);
      return firstLine;
    }
  } catch { /* Not in PATH */ }

  // 2. Scan known static Windows paths
  for (const p of WINDOWS_YTDLP_PATHS) {
    if (p && fs.existsSync(p)) {
      console.log(`[Downloader] Found yt-dlp at known path: ${p}`);
      return p;
    }
  }

  // 3. Deep-scan the WinGet Packages directory (catches any version/subfolder)
  try {
    const wingetBase = `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages`;
    if (fs.existsSync(wingetBase)) {
      const packageFolders = fs.readdirSync(wingetBase, { withFileTypes: true });
      for (const entry of packageFolders) {
        if (!entry.isDirectory()) continue;
        const folderName = entry.name.toLowerCase();
        if (folderName.includes('yt-dlp') && !folderName.includes('ffmpeg')) {
          const candidate = path.join(wingetBase, entry.name, 'yt-dlp.exe');
          if (fs.existsSync(candidate)) {
            console.log(`[Downloader] Found yt-dlp via WinGet scan: ${candidate}`);
            return candidate;
          }
        }
      }
    }
  } catch (e) {
    console.warn(`[Downloader] WinGet scan failed: ${e.message}`);
  }

  return null;
}

/**
 * Downloads a YouTube video using yt-dlp.
 * Uses an output template with %(ext)s so yt-dlp resolves the final extension.
 * After download, scans tempDir for the merged output file and returns its real path.
 *
 * @param {string} youtubeUrl      - The YouTube video URL.
 * @param {string} outputTemplate  - yt-dlp -o template, e.g. "E:\temp\productlens_abc.%(ext)s"
 * @param {string} fileBase        - Base filename prefix, e.g. "productlens_abc12345"
 * @param {string} tempDir         - Directory where temp files are stored.
 * @param {Function} onProgress    - Callback for progress messages (string).
 * @returns {Promise<string>}      - Resolves with the actual final file path.
 */
export function downloadVideo(youtubeUrl, outputTemplate, fileBase, tempDir, onProgress) {
  return new Promise((resolve, reject) => {
    const ytdlpBin = findYtDlp();

    if (!ytdlpBin) {
      return reject(new Error(
        'yt-dlp was not found. Please install it:\n' +
        '  Run in PowerShell: winget install yt-dlp.yt-dlp\n' +
        '  Then RESTART your terminal and try again.\n' +
        '  Or download manually from: https://github.com/yt-dlp/yt-dlp/releases'
      ));
    }

    const ffmpegDir = findFfmpeg();

    // ── Cookies support (Railway env var) ───────────────────────────────────
    // If YOUTUBE_COOKIES env var is set (base64-encoded cookies.txt),
    // write to a temp file and pass to yt-dlp.
    const cookiesEnv = process.env.YOUTUBE_COOKIES;
    let cookiesTempFile = null;
    if (cookiesEnv) {
      try {
        cookiesTempFile = path.join(tempDir, `cookies_${Date.now()}.txt`);
        const cookiesContent = Buffer.from(cookiesEnv, 'base64').toString('utf8');
        fs.writeFileSync(cookiesTempFile, cookiesContent);
        console.log('[Downloader] Using YouTube cookies from environment variable.');
      } catch (e) {
        console.warn('[Downloader] Failed to write cookies file:', e.message);
      }
    }

    const args = [
      // Format: best mp4 video+audio, fallback to anything available
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]/best[ext=mp4]/bestvideo+bestaudio/best',
      '--no-playlist',
      '--merge-output-format', 'mp4',
      '--no-warnings',
      '--newline',
      '-o', outputTemplate,

      // Mimic a real browser to avoid bot detection
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
    ];

    // Add cookies if available (most reliable bot detection bypass)
    if (cookiesTempFile) {
      args.push('--cookies', cookiesTempFile);
    }


    // Explicitly tell yt-dlp where FFmpeg is — required for video+audio merge
    if (ffmpegDir) {
      args.push('--ffmpeg-location', ffmpegDir);
      console.log(`[Downloader] Using ffmpeg from: ${ffmpegDir}`);
    } else {
      console.warn('[Downloader] ffmpeg not found — merge may fail!');
    }

    args.push(youtubeUrl);

    console.log(`[Downloader] Starting yt-dlp: "${ytdlpBin}"`);
    console.log(`[Downloader] Output template: ${outputTemplate}`);
    onProgress?.('Connecting to YouTube and fetching video metadata...');

    const proc = spawn(ytdlpBin, args, { shell: false });

    let stderr = '';
    let lastDestLine = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        console.log(`[yt-dlp] ${line}`);
        if (line.includes('%')) {
          onProgress?.(`Downloading: ${line}`);
        }
        // Track the last Destination line — yt-dlp prints the final merged file here
        if (line.startsWith('[Merger]') || line.includes('Destination:')) {
          lastDestLine = line;
        }
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        const errMsg = stderr.trim() || `yt-dlp exited with code ${code}`;
        console.error(`[Downloader] Error: ${errMsg}`);
        return reject(new Error(`yt-dlp failed: ${errMsg.slice(0, 400)}`));
      }

      // Scan tempDir for the actual merged file (starts with fileBase, ends with .mp4)
      let actualPath = null;
      try {
        const files = fs.readdirSync(tempDir);
        // Prefer the plain .mp4 (merged) over intermediate fragments
        const merged = files.find(
          (f) => f.startsWith(fileBase) && f.endsWith('.mp4') && !f.match(/\.f\d+\./)
        );
        if (merged) {
          actualPath = path.join(tempDir, merged);
        } else {
          // Fallback: any file starting with fileBase
          const any = files.find((f) => f.startsWith(fileBase));
          if (any) actualPath = path.join(tempDir, any);
        }
      } catch (e) {
        console.warn(`[Downloader] Could not scan tempDir: ${e.message}`);
      }

      if (!actualPath || !fs.existsSync(actualPath)) {
        return reject(new Error(
          `yt-dlp finished but no output file found in temp dir. ` +
          `Last yt-dlp output: ${lastDestLine}`
        ));
      }

      console.log(`[Downloader] Final file: ${actualPath}`);
      onProgress?.('Video downloaded. Preparing for upload...');
      resolve(actualPath);
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start yt-dlp (${ytdlpBin}): ${err.message}`));
    });
  });
}

