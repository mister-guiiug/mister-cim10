export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * @param {{ lang?: string; onResult?: (t: string) => void; onError?: (e: Error) => void }} opts
 */
export function createSpeechRecognizer(opts = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const rec = new SpeechRecognition();
  rec.lang = opts.lang || 'fr-FR';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let lastFinal = '';

  rec.onresult = (ev) => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      const t = r[0]?.transcript || '';
      if (r.isFinal) lastFinal += (lastFinal && !lastFinal.endsWith(' ') ? ' ' : '') + t.trim();
      else interim += t;
    }
    const combined = [lastFinal, interim].filter(Boolean).join(' ').trim();
    if (combined && opts.onResult) opts.onResult(combined);
  };

  rec.onerror = (ev) => {
    if (opts.onError) opts.onError(new Error(ev.error || 'speech'));
  };

  return {
    start() {
      lastFinal = '';
      rec.start();
    },
    stop() {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    },
    abort() {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    },
  };
}
