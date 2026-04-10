/** Identifiant unique, y compris hors contexte « secure » (sans `crypto.randomUUID`). */
export function randomId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
