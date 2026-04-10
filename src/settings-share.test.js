import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encodeSnapshot, decodeSnapshot, applySnapshotToStorage } from './settings-share.js';
import {
  LS_ANALYZE_MODE,
  LS_WHO_CLIENT_ID,
  LS_WHO_CLIENT_SECRET,
  LS_WHO_LANG,
  LS_WHO_PROXY,
  LS_WHO_RELEASE,
} from './app-settings.js';

const mem = new Map();

describe('settings-share', () => {
  beforeEach(() => {
    mem.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
      clear: () => mem.clear(),
    });
  });

  it('encode / decode aller-retour', () => {
    const snap = {
      v: 1,
      mode: 'both',
      clientId: 'id-test',
      clientSecret: 'secret',
      proxyUrl: 'https://proxy.example/api',
      releaseId: '2025-01',
      lang: 'fr',
    };
    const enc = encodeSnapshot(snap);
    expect(enc.length).toBeGreaterThan(4);
    const back = decodeSnapshot(enc);
    expect(back).toEqual(snap);
  });

  it('applySnapshotToStorage écrit le stockage', () => {
    const ok = applySnapshotToStorage({
      v: 1,
      mode: 'api',
      clientId: 'c',
      clientSecret: '',
      proxyUrl: 'https://p',
      releaseId: '2024-01',
      lang: 'en',
    });
    expect(ok).toBe(true);
    expect(mem.get(LS_ANALYZE_MODE)).toBe('api');
    expect(mem.get(LS_WHO_CLIENT_ID)).toBe('c');
    expect(mem.get(LS_WHO_LANG)).toBe('en');
  });
});
