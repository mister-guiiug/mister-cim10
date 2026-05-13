import { describe, expect, it } from 'vitest';
import { getCategoryPrefix, getFamily } from './icd-hierarchy';

describe('getCategoryPrefix', () => {
  it('extracts the 3-char category for sub-codes', () => {
    expect(getCategoryPrefix('E11.65')).toBe('E11');
    expect(getCategoryPrefix('K80.20')).toBe('K80');
  });

  it('returns the code itself when there is no dot', () => {
    expect(getCategoryPrefix('R51')).toBe('R51');
    expect(getCategoryPrefix('I10')).toBe('I10');
  });
});

describe('getFamily', () => {
  it('groups siblings by category prefix', () => {
    const { siblings } = getFamily('E11.9');
    const codes = siblings.map(s => s.code);
    expect(codes).toContain('E11.65');
    expect(codes).not.toContain('E11.9');
    expect(codes.every(c => c.startsWith('E11'))).toBe(true);
  });

  it('returns siblings sorted by code', () => {
    const { siblings } = getFamily('E11.9');
    const codes = siblings.map(s => s.code);
    const sorted = [...codes].sort((a, b) => a.localeCompare(b));
    expect(codes).toEqual(sorted);
  });

  it('returns null parent when the dataset has no standalone category entry', () => {
    const { parent } = getFamily('E11.9');
    expect(parent).toBeNull();
  });

  it('returns null parent for a top-level code that is its own category', () => {
    const { parent, siblings } = getFamily('R51');
    expect(parent).toBeNull();
    expect(siblings.every(s => s.code !== 'R51')).toBe(true);
  });

  it('excludes the queried code from its own siblings', () => {
    const { siblings } = getFamily('J44.1');
    expect(siblings.every(s => s.code !== 'J44.1')).toBe(true);
  });
});
