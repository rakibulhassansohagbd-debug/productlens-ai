// ============================================================
// ProductLens AI — TopBar Component
// API Key input with LocalStorage persistence + status badge
// ============================================================
import { useState, useEffect } from 'react';

const API_KEY_STORAGE = 'productlens_gemini_api_key';

export default function TopBar({ modelUsed }) {
  const [apiKey, setApiKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE) || '';
    setApiKey(stored);
    setInputValue(stored);
  }, []);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    localStorage.setItem(API_KEY_STORAGE, trimmed);
    setApiKey(trimmed);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
    setInputValue('');
    setEditing(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setInputValue(apiKey);
      setEditing(false);
    }
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 6)}${'•'.repeat(Math.max(0, apiKey.length - 10))}${apiKey.slice(-4)}`
    : '';

  return (
    <header className="border-b border-slate-800/60 bg-surface-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* ── Logo ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-violet-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4-4" strokeLinecap="round"/>
              <path d="M11 8v6M8 11h6" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold gradient-text leading-tight">ProductLens AI</h1>
            <p className="text-xs text-slate-500 leading-tight hidden sm:block">Verbatim Analysis Engine</p>
          </div>
        </div>

        {/* ── Center Spacer ───────────────────────────────────── */}
        <div className="flex-1 hidden md:block" />

        {/* ── Model Badge ─────────────────────────────────────── */}
        <div className="hidden sm:flex items-center gap-1.5 bg-surface-800 border border-slate-700/50 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-slow" />
          <span className="text-xs font-mono text-slate-400">{modelUsed || 'gemini-1.5-pro'}</span>
        </div>

        {/* ── API Key Section ──────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {editing || !apiKey ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                <input
                  id="gemini-api-key-input"
                  type="password"
                  className="input-dark pl-9 pr-3 py-2 text-sm w-56 sm:w-72"
                  placeholder="Paste Gemini API Key..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus={editing}
                />
              </div>
              <button
                id="save-api-key-btn"
                onClick={handleSave}
                disabled={!inputValue.trim()}
                className="btn-primary py-2 px-3 text-xs"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className={`key-badge cursor-pointer transition-all ${saved ? 'scale-105' : ''}`}
                onClick={() => setEditing(true)}
                title="Click to change API key"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                <span>{saved ? 'Saved ✓' : maskedKey}</span>
              </div>
              <button
                id="clear-api-key-btn"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Remove API key"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
