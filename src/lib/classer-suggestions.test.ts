import { describe, expect, it } from 'vitest';
import { classerSuggestions } from './classer-suggestions';
import type { AnalysisResult } from '../types/index';

function sug(
  code: string,
  source: 'local' | 'api',
  confidence: number
): AnalysisResult {
  return {
    id: code,
    code,
    label: code,
    matchedTerm: code,
    score: confidence,
    confidence,
    source,
  };
}

describe('classerSuggestions', () => {
  const jeu = [
    sug('J44.9', 'local', 0.61),
    sug('I10', 'local', 0.57),
    sug('5A11', 'api', 0.43),
  ];

  it('par défaut (api) : CIM-11 d’abord, puis CIM-10 par confiance', () => {
    expect(classerSuggestions(jeu, 'api').map(s => s.code)).toEqual([
      '5A11',
      'J44.9',
      'I10',
    ]);
  });

  it('priorité local : CIM-10 d’abord, puis CIM-11', () => {
    expect(classerSuggestions(jeu, 'local').map(s => s.code)).toEqual([
      'J44.9',
      'I10',
      '5A11',
    ]);
  });

  it('déduplique par code en gardant la première occurrence', () => {
    const doubles = [sug('I10', 'local', 0.5), sug('I10', 'local', 0.9)];
    expect(classerSuggestions(doubles, 'api')).toHaveLength(1);
    expect(classerSuggestions(doubles, 'api')[0]?.confidence).toBe(0.5);
  });
});
