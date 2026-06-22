// ============================================================
// ProductLens AI — ProgressTracker Component
// Animated multi-stage progress display for SSE events
// ============================================================
import { useEffect, useState } from 'react';

const STAGES = [
  {
    id: 'downloading',
    label: 'Downloading Video',
    description: 'Fetching video via yt-dlp...',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
      </svg>
    ),
  },
  {
    id: 'uploading',
    label: 'Uploading to Google',
    description: 'Sending video bytes to Files API...',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.023 11.095"/>
      </svg>
    ),
  },
  {
    id: 'polling',
    label: 'File Verification',
    description: 'Waiting for Google to activate the file...',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
      </svg>
    ),
  },
  {
    id: 'analyzing',
    label: 'Gemini 1.5 Pro Analysis',
    description: 'Analyzing visual content second-by-second...',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
    ),
  },
];

function getStageIndex(stageId) {
  return STAGES.findIndex((s) => s.id === stageId);
}

export default function ProgressTracker({ currentStage, currentMessage, isError }) {
  const [dots, setDots] = useState('');
  const currentIdx = getStageIndex(currentStage);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-6 animate-slide-up">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        {isError ? (
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-accent-600/20 flex items-center justify-center relative">
            <div className="spinner" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-slate-200">
            {isError ? 'Analysis Failed' : `Processing${dots}`}
          </h3>
          <p className="text-xs text-slate-500">
            {isError ? 'An error occurred during processing' : 'This may take 1–3 minutes'}
          </p>
        </div>
      </div>

      {/* ── Stages ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = currentIdx > idx;
          const isActive = currentIdx === idx;
          const isPending = currentIdx < idx;

          let stageClass = 'progress-stage pending';
          if (isActive && !isError) stageClass = 'progress-stage active';
          if (isCompleted) stageClass = 'progress-stage completed';

          return (
            <div key={stage.id} className={stageClass}>
              {/* Icon / Indicator */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-success/20 text-success'
                    : isActive && !isError
                    ? 'bg-accent-600/20 text-accent-400'
                    : 'bg-surface-700 text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                ) : isActive && !isError ? (
                  <div className="spinner" style={{ width: '14px', height: '14px' }} />
                ) : (
                  stage.icon
                )}
              </div>

              {/* Label */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold transition-colors ${
                    isCompleted ? 'text-success/90' : isActive ? 'text-slate-100' : 'text-slate-600'
                  }`}
                >
                  {stage.label}
                </p>
                {isActive && currentMessage && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{currentMessage}</p>
                )}
                {isCompleted && (
                  <p className="text-xs text-success/60 mt-0.5">Complete</p>
                )}
              </div>

              {/* Stage Number */}
              <span
                className={`text-xs font-mono flex-shrink-0 ${
                  isCompleted ? 'text-success/50' : isActive ? 'text-accent-500' : 'text-slate-700'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Error Detail ─────────────────────────────────────────── */}
      {isError && currentMessage && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 font-mono break-all">{currentMessage}</p>
        </div>
      )}

      {/* ── Animated Progress Bar ────────────────────────────────── */}
      {!isError && (
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Progress</span>
            <span>{Math.round(((currentIdx + 0.5) / STAGES.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-600 to-violet-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${((currentIdx + 0.5) / STAGES.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
