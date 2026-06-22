// ============================================================
// ProductLens AI — API Service (SSE via fetch streaming)
// Uses fetch with ReadableStream for SSE instead of EventSource
// because EventSource doesn't support custom headers (API key).
// ============================================================

const BACKEND_URL = '/api/analyze';

/**
 * Stream a product analysis from the backend via SSE.
 *
 * @param {string} youtubeUrl       - YouTube URL to analyze.
 * @param {string} apiKey           - Gemini API key from LocalStorage.
 * @param {Function} onEvent        - Callback for each SSE event object.
 * @param {AbortSignal} signal      - AbortController signal to cancel the stream.
 */
export async function streamAnalysis(youtubeUrl, apiKey, onEvent, signal) {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ youtubeUrl }),
    signal,
  });

  if (!response.ok) {
    let errorMsg = `Server error: ${response.status}`;
    try {
      const json = await response.json();
      errorMsg = json.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE format: each event is "data: {...}\n\n"
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? ''; // Keep incomplete last chunk

    for (const chunk of events) {
      const line = chunk.trim();
      if (line.startsWith('data: ')) {
        try {
          const eventData = JSON.parse(line.slice(6));
          onEvent(eventData);
        } catch (e) {
          console.warn('[API] Failed to parse SSE event:', line);
        }
      }
    }
  }
}
