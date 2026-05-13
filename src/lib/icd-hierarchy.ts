import { icdEntries } from '../icd10-data.js';
import type { ICD10Code } from '../types/index';

export function getCategoryPrefix(code: string): string {
  const dot = code.indexOf('.');
  return dot === -1 ? code : code.slice(0, dot);
}

export interface IcdFamily {
  parent: ICD10Code | null;
  siblings: ICD10Code[];
}

export function getFamily(code: string): IcdFamily {
  const prefix = getCategoryPrefix(code);
  const all = (icdEntries as ICD10Code[]).filter(
    e => getCategoryPrefix(e.code) === prefix
  );
  const parent =
    code === prefix ? null : (all.find(e => e.code === prefix) ?? null);
  const siblings = all
    .filter(e => e.code !== code && e.code !== prefix)
    .sort((a, b) => a.code.localeCompare(b.code));
  return { parent, siblings };
}
