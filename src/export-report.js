/** Limite prudente pour les liens mailto: (varie selon les clients). */
export const MAILTO_BODY_MAX = 1600;

export function buildSimpleReportText(validated, compteRendu) {
  const when = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const diagBlocks = validated.map((v, i) => {
    let b = `${i + 1}. ${v.code} — ${v.label}\n   Statut : ${v.statut}`;
    if (v.matchedTerm) b += `\n   Terme repéré : ${v.matchedTerm}`;
    return b;
  });
  const cr = compteRendu.trim() || '(aucun texte saisi)';
  return [
    'Cotation CIM-10 — Export',
    '================================',
    `Date : ${when}`,
    '',
    `Diagnostics retenus (${validated.length})`,
    '--------------------------------',
    ...diagBlocks,
    '',
    'Compte-rendu analysé',
    '--------------------------------',
    cr,
    '',
    '— Document généré par l’application Cotation CIM-10 (aide à la cotation ; à valider selon les règles en vigueur).',
  ].join('\n');
}

export function csvEscape(s) {
  const t = String(s).replace(/"/g, '""');
  return `"${t}"`;
}

export function buildCsvString(validated, compteRendu) {
  const rows = [
    ['exportéLe', 'code', 'label', 'statut', 'termeRepéré', 'compteRendu_extrait'],
    ...validated.map((v) => [
      new Date().toISOString(),
      v.code,
      csvEscape(v.label),
      v.statut,
      csvEscape(v.matchedTerm || ''),
      csvEscape(compteRendu.slice(0, 500)),
    ]),
  ];
  return rows.map((r) => r.join(';')).join('\n');
}

export function dateSlug() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

export function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function buildMailtoUrl(subject, body) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function truncateForEmailBody(text) {
  if (text.length <= MAILTO_BODY_MAX) return text;
  const cut = MAILTO_BODY_MAX - 120;
  return `${text.slice(0, cut)}\n\n[… Message tronqué — utilisez « Texte (.txt) » ou « Tableur (.csv) » pour l’export complet.]`;
}

/**
 * @param {{ code: string; label: string; statut: string; matchedTerm?: string }[]} validated
 */
export function exportTextFile(validated, compteRendu) {
  const text = buildSimpleReportText(validated, compteRendu);
  const blob = new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `mister-cim10-${dateSlug()}.txt`);
}

/**
 * @param {{ code: string; label: string; statut: string; matchedTerm?: string }[]} validated
 */
export function exportCsv(validated, compteRendu) {
  const blob = new Blob(['\ufeff' + buildCsvString(validated, compteRendu)], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `mister-cim10-${dateSlug()}.csv`);
}

/**
 * @param {{ code: string; label: string; statut: string; matchedTerm?: string }[]} validated
 */
export function exportViaEmail(validated, compteRendu) {
  if (!validated.length) return;
  const body = truncateForEmailBody(buildSimpleReportText(validated, compteRendu));
  const subject = `Export Cotation CIM-10 (${dateSlug()})`;
  window.location.href = buildMailtoUrl(subject, body);
}

/**
 * @param {{ code: string; label: string; statut: string; matchedTerm?: string }[]} validated
 */
export async function shareExport(validated, compteRendu) {
  if (!validated.length) return;
  const fullText = buildSimpleReportText(validated, compteRendu);
  const filename = `mister-cim10-${dateSlug()}.txt`;
  const file = new File(['\ufeff' + fullText], filename, { type: 'text/plain' });
  const title = 'Export Cotation CIM-10';
  const shortText = `Export du ${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} — ${validated.length} diagnostic(s).`;

  const shareDataFile = { files: [file], title, text: shortText };

  if (navigator.share && navigator.canShare?.(shareDataFile)) {
    await navigator.share(shareDataFile);
    return;
  }

  if (navigator.share) {
    const text =
      fullText.length <= 14_000
        ? `${shortText}\n\n---\n${fullText}`
        : `${shortText}\n\n${fullText.slice(0, 12_000)}\n\n[… Tronqué — ouvrez l’export Texte (.txt) pour la version complète.]`;
    await navigator.share({ title, text });
    return;
  }

  exportViaEmail(validated, compteRendu);
}
