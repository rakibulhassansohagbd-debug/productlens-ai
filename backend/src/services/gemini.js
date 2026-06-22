// ============================================================
// ProductLens AI — Google Gen AI (Gemini) Service
// ============================================================
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { EXTRACTION_PROMPT, GEMINI_MODEL } from '../config/prompt.js';

const POLL_INTERVAL_MS = 5000;   // Poll every 5 seconds
const MAX_POLL_ATTEMPTS = 60;    // Wait up to 5 minutes

/**
 * Uploads a local video file to the Google Gen AI Files API,
 * polls until it's ACTIVE, runs Gemini analysis, and returns the result.
 *
 * @param {string} apiKey        - User-supplied Gemini API key.
 * @param {string} videoFilePath - Absolute path to the local video file.
 * @param {Function} onProgress  - SSE progress callback (message: string).
 * @returns {Promise<{text: string, usageMetadata: object}>}
 */
export async function analyzeVideoWithGemini(apiKey, videoFilePath, onProgress) {
  const ai = new GoogleGenAI({ apiKey });

  // ── Step 1: Upload the video file ──────────────────────────────────────────
  onProgress?.('Uploading video bytes to Google Files API...');
  console.log(`[Gemini] Uploading: ${path.basename(videoFilePath)}`);

  let uploadedFile;
  try {
    // Pass the file path string directly — the Node.js SDK reads the file
    // and sets size_bytes automatically. Do NOT pass a ReadStream.
    uploadedFile = await ai.files.upload({
      file: videoFilePath,
      config: {
        mimeType: 'video/mp4',
        displayName: path.basename(videoFilePath),
      },
    });
  } catch (err) {
    throw new Error(`Files API upload failed: ${err.message}`);
  }

  console.log(`[Gemini] File uploaded. Name: ${uploadedFile.name} | State: ${uploadedFile.state}`);

  // ── Step 2: Poll until ACTIVE ──────────────────────────────────────────────
  onProgress?.('Waiting for Google to process the video file...');
  let fileState = uploadedFile.state;
  let attempts = 0;

  while (fileState !== 'ACTIVE') {
    if (fileState === 'FAILED') {
      throw new Error('Google Files API reported the uploaded file as FAILED. Please try again.');
    }
    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw new Error('Timed out waiting for the video file to become ACTIVE on Google servers.');
    }

    await sleep(POLL_INTERVAL_MS);
    attempts++;

    const refreshed = await ai.files.get({ name: uploadedFile.name });
    fileState = refreshed.state;
    onProgress?.(`Polling file status... (${fileState}) — attempt ${attempts}`);
    console.log(`[Gemini] Poll ${attempts}: state = ${fileState}`);
  }

  onProgress?.('Video file is ACTIVE. Sending to Gemini 1.5 Pro for analysis...');
  console.log(`[Gemini] File ACTIVE. Running ${GEMINI_MODEL} analysis...`);

  // ── Step 3: Call Gemini with the video + locked prompt ────────────────────
  let response;
  const modelsToTry = [GEMINI_MODEL, 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError = null;
  let modelUsed = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini] Running analysis using model: ${model}...`);
      onProgress?.(`Sending video to ${model} for analysis...`);
      response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                fileData: {
                  mimeType: 'video/mp4',
                  fileUri: uploadedFile.uri,
                },
              },
              {
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });
      modelUsed = model;
      lastError = null;
      break;
    } catch (err) {
      console.warn(`[Gemini] Model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }

  if (lastError) {
    try {
      const modelsList = await ai.models.list();
      console.log('[Gemini Debug] Available models for this API key:', modelsList.models ? modelsList.models.map(m => m.name) : modelsList);
    } catch (listErr) {
      console.error('[Gemini Debug] Failed to list models:', listErr.message);
    }
    throw new Error(`Gemini generateContent failed: ${lastError.message}`);
  }

  // Extract text — try shortcut first, fallback to candidates chain
  const text = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const usageMetadata = response.usageMetadata ?? {};

  console.log(`[Gemini] Analysis complete. Tokens used:`, usageMetadata);

  // ── Step 4: Optionally delete the uploaded file to save quota ─────────────
  try {
    await ai.files.delete({ name: uploadedFile.name });
    console.log(`[Gemini] Deleted remote file: ${uploadedFile.name}`);
  } catch (_) {
    // Non-fatal — file will expire automatically
  }

  return { text, usageMetadata, modelUsed };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
