import { describe, it, expect } from 'vitest';
import { buildSimpleReportText, csvEscape, truncateForEmailBody, MAILTO_BODY_MAX } from './export-report.js';

describe('export-report', () => {
  it('csvEscape protège les guillemets', () => {
    expect(csvEscape('a"b')).toBe('"a""b"');
  });

  it('buildSimpleReportText inclut diagnostics et CR', () => {
    const text = buildSimpleReportText(
      [{ code: 'I10', label: 'HTA', statut: 'validé' }],
      'texte clinique'
    );
    expect(text).toContain('I10');
    expect(text).toContain('texte clinique');
  });

  it('truncateForEmailBody raccourcit les longs textes', () => {
    const long = 'x'.repeat(MAILTO_BODY_MAX + 500);
    const t = truncateForEmailBody(long);
    expect(t.length).toBeLessThan(long.length);
    expect(t).toContain('…');
  });
});
