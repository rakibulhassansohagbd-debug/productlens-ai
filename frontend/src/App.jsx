// ============================================================
// ProductLens AI — Root Application Component
// ============================================================
import { useState, useRef, useCallback } from 'react';
import TopBar from './components/TopBar.jsx';
import AnalyzeForm from './components/AnalyzeForm.jsx';
import ProgressTracker from './components/ProgressTracker.jsx';
import OutputPanel from './components/OutputPanel.jsx';
import { streamAnalysis } from './services/api.js';

const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function App() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [currentStage, setCurrentStage] = useState('downloading');
  const [currentMessage, setCurrentMessage] = useState('');
  const [markdownResult, setMarkdownResult] = useState('');
  const [tokens, setTokens] = useState(null);
  const [modelUsed, setModelUsed] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const abortRef = useRef(null);

  const handleSubmit = useCallback(async (youtubeUrl) => {
    // Get API key from LocalStorage
    const apiKey = localStorage.getItem('productlens_gemini_api_key') || '';
    if (!apiKey) {
      setErrorMessage('No API key found. Please enter your Gemini API key in the top bar.');
      setStatus(STATUS.ERROR);
      return;
    }

    // Reset previous results
    setStatus(STATUS.LOADING);
    setMarkdownResult('');
    setTokens(null);
    setModelUsed(null);
    setErrorMessage('');
    setCurrentStage('downloading');
    setCurrentMessage('Initializing...');

    // Cancel any previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAnalysis(
        youtubeUrl,
        apiKey,
        (event) => {
          switch (event.stage) {
            case 'downloading':
              setCurrentStage('downloading');
              setCurrentMessage(event.message);
              break;
            case 'uploading':
              setCurrentStage('uploading');
              setCurrentMessage(event.message);
              break;
            case 'polling':
              setCurrentStage('polling');
              setCurrentMessage(event.message);
              break;
            case 'analyzing':
              setCurrentStage('analyzing');
              setCurrentMessage(event.message);
              break;
            case 'done':
              setMarkdownResult(event.result || '');
              setTokens(event.tokens || null);
              setModelUsed(event.modelUsed || null);
              setStatus(STATUS.SUCCESS);
              break;
            case 'error':
              setErrorMessage(event.message || 'An unknown error occurred.');
              setStatus(STATUS.ERROR);
              break;
          }
        },
        controller.signal
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus(STATUS.IDLE);
        return;
      }
      setErrorMessage(err.message || 'Connection to backend failed. Is the server running?');
      setStatus(STATUS.ERROR);
    }
  }, []);

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setStatus(STATUS.IDLE);
    setMarkdownResult('');
    setTokens(null);
    setModelUsed(null);
    setErrorMessage('');
    setCurrentStage('downloading');
    setCurrentMessage('');
  };

  const isLoading = status === STATUS.LOADING;

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col relative">
      {/* ── Ambient Background Orbs ───────────────────────────── */}
      <div className="ambient-bg">
        <div
          className="ambient-orb"
          style={{
            width: '800px', height: '800px',
            background: 'radial-gradient(circle, #6366f1, transparent)',
            top: '-200px', left: '-200px',
          }}
        />
        <div
          className="ambient-orb"
          style={{
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, #8b5cf6, transparent)',
            bottom: '100px', right: '-150px',
            opacity: 0.04,
          }}
        />
        <div
          className="ambient-orb"
          style={{
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, #ec4899, transparent)',
            top: '50%', left: '50%',
            opacity: 0.025,
          }}
        />
      </div>

      {/* ── Top Navigation Bar ────────────────────────────────── */}
      <TopBar modelUsed={modelUsed} />

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero Header ───────────────────────────────────────── */}
        <div className="text-center py-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-600/10 border border-accent-600/20 rounded-full text-xs text-accent-400 font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 pulse-dot" />
            Powered by Ashraful Islam
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight mb-3">
            Product Specification
            <span className="block gradient-text">Extraction Engine</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Upload your Amazon/brand website screen-recording to YouTube, paste the link below,
            and receive a <strong className="text-slate-300">verbatim, timestamped breakdown</strong> of every
            product feature, A+ content section, and specification — exactly as shown.
          </p>
        </div>

        {/* ── Analyze Form ─────────────────────────────────────── */}
        <AnalyzeForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* ── Progress Tracker (shown while loading or on error) ── */}
        {(isLoading || status === STATUS.ERROR) && (
          <ProgressTracker
            currentStage={currentStage}
            currentMessage={status === STATUS.ERROR ? errorMessage : currentMessage}
            isError={status === STATUS.ERROR}
          />
        )}

        {/* ── Cancel Button ────────────────────────────────────── */}
        {isLoading && (
          <div className="flex justify-center animate-fade-in">
            <button
              id="cancel-analysis-btn"
              onClick={handleReset}
              className="btn-ghost text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Cancel Analysis
            </button>
          </div>
        )}

        {/* ── Error Retry ──────────────────────────────────────── */}
        {status === STATUS.ERROR && (
          <div className="flex justify-center animate-fade-in">
            <button
              id="retry-analysis-btn"
              onClick={handleReset}
              className="btn-ghost"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              Try Again
            </button>
          </div>
        )}

        {/* ── Output Panel (shown on success) ─────────────────── */}
        {status === STATUS.SUCCESS && markdownResult && (
          <>
            {/* Success Banner */}
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-400">Analysis Complete</p>
                <p className="text-xs text-emerald-500/70">Verbatim breakdown generated successfully by {modelUsed ? modelUsed.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Gemini 1.5 Pro'}</p>
              </div>
              <button
                id="new-analysis-btn"
                onClick={handleReset}
                className="btn-ghost text-xs"
              >
                New Analysis
              </button>
            </div>

            <OutputPanel markdownText={markdownResult} tokens={tokens} />
          </>
        )}

        {/* ── Empty State ───────────────────────────────────────── */}
        {status === STATUS.IDLE && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800 border border-slate-700/50 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"/>
              </svg>
            </div>
            <p className="text-slate-600 text-sm">Your verbatim product analysis will appear here</p>
            <p className="text-slate-700 text-xs mt-1">Paste a YouTube URL above to get started</p>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-800/40 py-4 px-4 text-center">
        <p className="text-xs text-slate-700">
          ProductLens AI · Verbatim extraction powered by {modelUsed ? modelUsed.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Gemini 1.5 Pro'} · All API keys stored locally only
        </p>
      </footer>
    </div>
  );
}
