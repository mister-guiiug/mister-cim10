import { describe, expect, it } from 'vitest';
import { passageOmsTropLarge } from './terme-affiche';
import type { AnalysisResult } from '../types/index';

function sug(
  patch: Partial<AnalysisResult> &
    Pick<AnalysisResult, 'matchedTerm' | 'source'>
): AnalysisResult {
  return {
    id: '1',
    code: 'X',
    label: 'X',
    score: 1,
    confidence: 0.5,
    ...patch,
  };
}

describe('passageOmsTropLarge', () => {
  it('ignore le dictionnaire local, même sur un long texte', () => {
    expect(
      passageOmsTropLarge(
        sug({
          source: 'local',
          matchedTerm:
            'patient diabétique type 2, HTA, suivi pour BPCO et autre chose',
        })
      )
    ).toBe(false);
  });

  it('accepte un terme OMS court', () => {
    expect(
      passageOmsTropLarge(sug({ source: 'api', matchedTerm: 'diabète type 2' }))
    ).toBe(false);
  });

  it('signale un segment OMS qui est presque tout le CR', () => {
    expect(
      passageOmsTropLarge(
        sug({
          source: 'api',
          matchedTerm: 'patient diabétique type 2, HTA, suivi pour BPCO',
        })
      )
    ).toBe(true);
  });
});
