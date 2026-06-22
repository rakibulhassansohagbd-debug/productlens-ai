// ============================================================
// ProductLens AI — Temp File Cleanup Utility
// ============================================================
import fs from 'fs/promises';
import path from 'path';

/**
 * Safely delete a single file. Logs a warning if it doesn't exist.
 * @param {string} filePath - Absolute path to the file to delete.
 */
export async function cleanupFile(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
    console.log(`[Cleanup] Removed temp file: ${path.basename(filePath)}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[Cleanup] Could not delete ${filePath}:`, err.message);
    }
  }
}

/**
 * Delete ALL files in a directory that start with the given prefix.
 * Used to clean up yt-dlp intermediate files (.f299.mp4, .f140.m4a, .mp4 etc.)
 * @param {string} dirPath   - Directory to scan.
 * @param {string} fileBase  - Filename prefix to match (e.g. "productlens_abc12345").
 */
export async function cleanupSessionFiles(dirPath, fileBase) {
  if (!dirPath || !fileBase) return;
  try {
    const entries = await fs.readdir(dirPath);
    const toDelete = entries.filter((name) => name.startsWith(fileBase));
    await Promise.all(
      toDelete.map(async (name) => {
        const full = path.join(dirPath, name);
        try {
          await fs.unlink(full);
          console.log(`[Cleanup] Removed session file: ${name}`);
        } catch (e) {
          if (e.code !== 'ENOENT') console.warn(`[Cleanup] Could not delete ${name}:`, e.message);
        }
      })
    );
    if (toDelete.length === 0) {
      console.log(`[Cleanup] No temp files found for session: ${fileBase}`);
    }
  } catch (err) {
    console.warn(`[Cleanup] Session cleanup failed for ${fileBase}:`, err.message);
  }
}

/**
 * Ensure the temp directory exists.
 * @param {string} dirPath - Path to the temp directory.
 */
export async function ensureTempDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}
