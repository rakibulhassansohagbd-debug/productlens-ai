// ============================================================
// ProductLens AI — AnalyzeForm Component
// YouTube URL input + submit button
// ============================================================
import { useState } from 'react';

export default function AnalyzeForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateYouTube = (val) => {
    try {
      const u = new URL(val);
      return (
        u.hostname.includes('youtube.com') ||
        u.hostname === 'youtu.be'
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const apiKey = localStorage.getItem('productlens_gemini_api_key');
    if (!apiKey) {
      setError('Please paste your Gemini API key in the top bar first.');
      return;
    }

    if (!url.trim()) {
      setError('Please enter a YouTube URL.');
      return;
    }

    if (!validateYouTube(url.trim())) {
      setError('That doesn\'t look like a valid YouTube URL. Try: https://youtube.com/watch?v=...');
      return;
    }

    onSubmit(url.trim());
  };

  const exampleUrls = [
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/VIDEO_ID',
  ];

  return (
    <div className="glass-card p-6 sm:p-8 animate-slide-up">
      {/* ── Section Header ────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Video Analysis</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Paste the YouTube URL of your screen-recording. Gemini 1.5 Pro will extract every visible product specification, A+ content detail, and text element — verbatim and chronologically.
        </p>
      </div>

      {/* ── Form ──────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="youtube-url-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            YouTube Video URL
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <svg
                className="w-4 h-4 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                viewBox="0 0 24 24" fill="currentColor"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <input
                id="youtube-url-input"
                type="url"
                className="input-dark pl-10 pr-4 py-3 text-sm"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
              />
            </div>
            <button
              id="generate-breakdown-btn"
              type="submit"
              disabled={isLoading || !url.trim()}
              className="btn-primary py-3 px-5 sm:px-6 flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px' }} />
                  <span className="hidden sm:inline">Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                  </svg>
                  <span className="hidden sm:inline">Generate Verbatim Breakdown</span>
                  <span className="sm:hidden">Analyze</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* ── Info Card ─────────────────────────────────────────── */}
        <div className="p-4 rounded-xl bg-surface-800/60 border border-slate-700/40">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-accent-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1">Processing Time</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Analysis typically takes <span className="text-accent-400 font-medium">1–3 minutes</span> depending on video length. The backend will download your video, upload it to Google's infrastructure, and run Gemini 1.5 Pro's full visual analysis pipeline.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
