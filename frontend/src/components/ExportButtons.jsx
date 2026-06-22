// ============================================================
// ProductLens AI — ExportButtons Component
// Copy to Clipboard + Download as .txt (Markdown)
// ============================================================
import { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function ExportButtons({ markdownText, disabled }) {
  const [copyState, setCopyState] = useState('idle'); // idle | success | error

  const handleCopy = async () => {
    if (!markdownText) return;
    try {
      marked.setOptions({
        breaks: true,
        gfm: true,
      });
      const htmlText = DOMPurify.sanitize(marked.parse(markdownText));
      const blobHtml = new Blob([htmlText], { type: 'text/html' });
      const blobText = new Blob([markdownText], { type: 'text/plain' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        })
      ]);
      setCopyState('success');
      setTimeout(() => setCopyState('idle'), 2500);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  const handleDownload = () => {
    if (!markdownText) return;
    const blob = new Blob([markdownText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `productlens_analysis_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLabel = {
    idle: (
      <>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/>
        </svg>
        Copy to Clipboard
      </>
    ),
    success: (
      <>
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        <span className="text-emerald-400">Copied!</span>
      </>
    ),
    error: (
      <>
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        <span className="text-red-400">Failed</span>
      </>
    ),
  }[copyState];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Copy Button */}
      <button
        id="copy-to-clipboard-btn"
        onClick={handleCopy}
        disabled={disabled || !markdownText}
        className={`btn-ghost transition-all ${
          copyState === 'success' ? 'border-emerald-500/40 bg-emerald-500/10' : ''
        }`}
      >
        {copyLabel}
      </button>

      {/* Download Button */}
      <button
        id="download-markdown-btn"
        onClick={handleDownload}
        disabled={disabled || !markdownText}
        className="btn-ghost"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        Download as .txt
      </button>

      {/* Word count */}
      {markdownText && (
        <span className="text-xs text-slate-600 font-mono ml-1">
          {markdownText.split(/\s+/).filter(Boolean).length.toLocaleString()} words
          {' · '}
          {markdownText.length.toLocaleString()} chars
        </span>
      )}
    </div>
  );
}
