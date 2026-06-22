// ============================================================
// ProductLens AI — /api/analyze Route (SSE Streaming)
// ============================================================
import express from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { downloadVideo } from '../services/downloader.js';
import { analyzeVideoWithGemini } from '../services/gemini.js';
import { cleanupFile, cleanupSessionFiles, ensureTempDir } from '../services/cleanup.js';

const router = express.Router();
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || './temp');

// ── Helpers ────────────────────────────────────────────────────────────────

function sendEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function validateYouTubeUrl(url) {
  try {
    const parsed = new URL(url);
    const isYT =
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'youtu.be' ||
      parsed.hostname === 'm.youtube.com';
    return isYT;
  } catch {
    return false;
  }
}

// ── Route Handler ──────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  // ── Auth: grab API key from Authorization header ────────────────────────
  const authHeader = req.headers['authorization'] || '';
  const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!apiKey) {
    return res.status(401).json({
      error: 'No Gemini API key provided. Please set your API key in the dashboard.',
    });
  }

  const { youtubeUrl } = req.body;

  if (!youtubeUrl || !validateYouTubeUrl(youtubeUrl)) {
    return res.status(400).json({ error: 'Please provide a valid YouTube URL.' });
  }

  // ── Set SSE headers ─────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if present
  res.flushHeaders();

  const sessionId = uuidv4().slice(0, 8);
  // Do NOT add .mp4 here — yt-dlp will resolve the final extension after merge
  const videoFileBase = `productlens_${sessionId}`;
  const videoOutputTemplate = path.join(TEMP_DIR, `${videoFileBase}.%(ext)s`);
  // We'll discover the actual output file path after yt-dlp finishes
  let actualVideoPath = null;

  console.log(`\n[Session ${sessionId}] New analysis request: ${youtubeUrl}`);

  try {
    // ── Ensure temp directory exists ──────────────────────────────────────
    await ensureTempDir(TEMP_DIR);

    // ── Stage 1: Download ─────────────────────────────────────────────────
    sendEvent(res, {
      stage: 'downloading',
      message: 'Initializing video download via yt-dlp...',
    });

    actualVideoPath = await downloadVideo(youtubeUrl, videoOutputTemplate, videoFileBase, TEMP_DIR, (msg) => {
      sendEvent(res, { stage: 'downloading', message: msg });
    });

    sendEvent(res, {
      stage: 'uploading',
      message: 'Video downloaded. Uploading to Google Files API...',
    });

    // ── Stage 2 & 3: Upload + Analyze ─────────────────────────────────────
    const { text, usageMetadata, modelUsed } = await analyzeVideoWithGemini(
      apiKey,
      actualVideoPath,
      (msg) => {
        // Determine stage from message content for frontend display
        const stage = msg.toLowerCase().includes('poll') || msg.toLowerCase().includes('waiting')
          ? 'polling'
          : msg.toLowerCase().includes('active') || msg.toLowerCase().includes('gemini')
          ? 'analyzing'
          : 'uploading';

        sendEvent(res, { stage, message: msg });
      }
    );

    // ── Stage 4: Done ──────────────────────────────────────────────────────
    sendEvent(res, {
      stage: 'done',
      result: text,
      modelUsed,
      tokens: {
        promptTokens: usageMetadata.promptTokenCount ?? 0,
        candidateTokens: usageMetadata.candidatesTokenCount ?? 0,
        totalTokens: usageMetadata.totalTokenCount ?? 0,
      },
    });

    console.log(`[Session ${sessionId}] Analysis complete.`);
  } catch (err) {
    console.error(`[Session ${sessionId}] Error:`, err.message);
    sendEvent(res, { stage: 'error', message: err.message });
  } finally {
    // ── Cleanup all temp files for this session ───────────────────────────
    await cleanupSessionFiles(TEMP_DIR, videoFileBase);
    res.end();
  }
});

export default router;
