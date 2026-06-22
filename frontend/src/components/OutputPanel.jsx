// ============================================================
// ProductLens AI — OutputPanel Component
// Scrollable, styled Markdown output renderer
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import ExportButtons from './ExportButtons.jsx';
import TokenCounter from './TokenCounter.jsx';

// Configure marked for clean, secure rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function OutputPanel({ markdownText, tokens }) {
  const outputRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  // Sanitize and render markdown
  const renderedHTML = markdownText
    ? DOMPurify.sanitize(marked.parse(markdownText))
    : '';

  // Auto-scroll when new content arrives
  useEffect(() => {
    if (outputRef.current && !scrolled) {
      outputRef.current.scrollTop = 0;
    }
  }, [markdownText]);

  const handleScroll = (e) => {
    setScrolled(e.target.scrollTop > 50);
  };

  if (!markdownText) return null;

  return (
    <div className="glass-card overflow-hidden animate-slide-up" id="output-panel">
      {/* ── Panel Header ─────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-800/70 bg-surface-800/40">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <h2 className="text-sm font-bold text-slate-200">Analysis Output</h2>
            <span className="px-2 py-0.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-mono">
              Gemini 1.5 Pro
            </span>
          </div>
          <ExportButtons markdownText={markdownText} disabled={!markdownText} />
        </div>
      </div>

      {/* ── Token Counter ──────────────────────────────────────────── */}
      {tokens && (
        <div className="px-5 pt-4">
          <TokenCounter tokens={tokens} />
        </div>
      )}

      {/* ── Markdown Content ───────────────────────────────────────── */}
      <div
        ref={outputRef}
        onScroll={handleScroll}
        className="overflow-y-auto p-5 sm:p-6"
        style={{ maxHeight: '70vh', minHeight: '300px' }}
        id="markdown-output-container"
      >
        {/* Scroll-to-top button */}
        {scrolled && (
          <button
            onClick={() => {
              outputRef.current.scrollTop = 0;
              setScrolled(false);
            }}
            className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-accent-600 text-white flex items-center justify-center shadow-lg hover:bg-accent-500 transition-all z-50"
            title="Scroll to top"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>
            </svg>
          </button>
        )}

        <article
          className="markdown-output"
          dangerouslySetInnerHTML={{ __html: renderedHTML }}
        />
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-slate-800/50 bg-surface-900/30 flex items-center justify-between">
        <p className="text-xs text-slate-600">
          Verbatim extraction powered by <span className="text-accent-500 font-medium">Gemini 1.5 Pro</span>
        </p>
        <ExportButtons markdownText={markdownText} disabled={!markdownText} />
      </div>
    </div>
  );
}
