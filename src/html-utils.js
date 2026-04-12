/**
 * Échappe les caractères HTML pour toute chaîne interpolée dans un template HTML.
 * Données utilisateur, API ou stockage : toujours passer par `escapeHtml` (ou texte via `textContent`).
 */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
