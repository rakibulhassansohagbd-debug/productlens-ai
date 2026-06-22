# ============================================================
# ProductLens AI — Dockerfile for Railway Deployment
# ============================================================
# Stage 1: Build the React frontend
FROM node:20-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Build frontend into dist/
RUN npm run build

# ============================================================
# Stage 2: Production server
FROM node:20-slim AS production

# Install system dependencies: ffmpeg + yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Force fresh yt-dlp install (cache bust via date argument)
ARG CACHEBUST=2026-06-22
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && /usr/local/bin/yt-dlp --version

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend from Stage 1 into backend/public
COPY --from=frontend-builder /build/frontend/dist ./backend/public

# Create temp directory for video processing
RUN mkdir -p /app/backend/temp

# Expose port (Railway uses $PORT env variable)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3001}/health || exit 1

# Start the backend server
CMD ["node", "backend/src/server.js"]
