// ============================================================
// ProductLens AI — TokenCounter Component
// Displays prompt, candidate, and total token counts
// ============================================================

export default function TokenCounter({ tokens }) {
  if (!tokens) return null;

  const { promptTokens = 0, candidateTokens = 0, totalTokens = 0 } = tokens;

  const fmt = (n) => n.toLocaleString();

  const items = [
    {
      label: 'Input Tokens',
      value: fmt(promptTokens),
      color: 'text-violet-400',
      dotColor: 'bg-violet-400',
      tooltip: 'Tokens consumed by the video + prompt',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
        </svg>
      ),
    },
    {
      label: 'Output Tokens',
      value: fmt(candidateTokens),
      color: 'text-accent-400',
      dotColor: 'bg-accent-400',
      tooltip: 'Tokens in the generated response',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
        </svg>
      ),
    },
    {
      label: 'Total Tokens',
      value: fmt(totalTokens),
      color: 'text-emerald-400',
      dotColor: 'bg-emerald-400',
      tooltip: 'Combined token usage for this analysis',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"/>
        </svg>
      ),
    },
  ];

  // Estimate cost at Gemini 1.5 Pro pricing (approximate)
  const COST_PER_1K_INPUT = 0.00125;
  const COST_PER_1K_OUTPUT = 0.005;
  const estimatedCost = (
    (promptTokens / 1000) * COST_PER_1K_INPUT +
    (candidateTokens / 1000) * COST_PER_1K_OUTPUT
  ).toFixed(4);

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/>
          </svg>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Token Usage</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">~${estimatedCost} estimated</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="token-chip flex-1 min-w-fit"
            title={item.tooltip}
          >
            <span className={`${item.dotColor} pulse-dot`} />
            <span className={`${item.color} font-bold tabular-nums`}>{item.value}</span>
            <span className="text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Visual proportion bar */}
      <div className="mt-3 flex gap-0.5 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-violet-500 transition-all duration-700"
          style={{ width: `${totalTokens > 0 ? (promptTokens / totalTokens) * 100 : 0}%` }}
        />
        <div
          className="bg-accent-500 transition-all duration-700"
          style={{ width: `${totalTokens > 0 ? (candidateTokens / totalTokens) * 100 : 0}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-slate-600">
        <span>Input</span>
        <span>Output</span>
      </div>
    </div>
  );
}
