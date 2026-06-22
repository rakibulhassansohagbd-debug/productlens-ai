// ============================================================
// ProductLens AI — Express Server Entry Point
// ============================================================
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import analyzeRouter from './routes/analyze.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

config(); // Load .env

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────

// In production: same-origin requests (no CORS needed)
// In development: allow Vite dev server origins
app.use(cors({
  origin: IS_PRODUCTION ? true : [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));

// ── Routes ─────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ProductLens AI Backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/analyze', analyzeRouter);

// ── Static Frontend (Production Only) ──────────────────────────────────────
// Only activates when backend/public/ exists (after Docker build).
// Local development is completely unaffected.
const publicDir = join(__dirname, '..', 'public');
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // Send index.html for all non-API routes (React Router support)
  app.get('*', (_req, res) => {
    res.sendFile(join(publicDir, 'index.html'));
  });
} else {
  // 404 fallback (development only)
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║     ProductLens AI — Backend Server       ║');
  console.log(`║     Listening on http://localhost:${PORT}    ║`);
  console.log('╚═══════════════════════════════════════════╝\n');
});
