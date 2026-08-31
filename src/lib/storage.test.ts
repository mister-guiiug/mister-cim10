import { beforeEach, describe, expect, it } from 'vitest';
import {
  APP_PREFIX,
  LEGACY_KEY_MAP,
  migrateLegacyStorageKeys,
} from './storage-migration';
import { appStore, buildAppBackup, restoreAppBackup } from './storage';

const SECRET = 'who_icd_client_secret';

beforeEach(() => {
  localStorage.clear();
});

describe('migration des clés sous le préfixe cim10_', () => {
  it('déplace une clé historique et retire l’ancienne', () => {
    localStorage.setItem('cr_text', 'patient diabétique');

    const moved = migrateLegacyStorageKeys();

    expect(moved).toContain('cr_text');
    expect(localStorage.getItem(`${APP_PREFIX}cr_text`)).toBe(
      'patient diabétique'
    );
    expect(localStorage.getItem('cr_text')).toBeNull();
  });

  it('n’écrase pas une valeur déjà préfixée', () => {
    localStorage.setItem('cr_text', 'ancienne');
    localStorage.setItem(`${APP_PREFIX}cr_text`, 'récente');

    migrateLegacyStorageKeys();

    expect(localStorage.getItem(`${APP_PREFIX}cr_text`)).toBe('récente');
  });

  it('est idempotente', () => {
    localStorage.setItem('analyze_mode', 'both');

    expect(migrateLegacyStorageKeys()).toEqual(['analyze_mode']);
    expect(migrateLegacyStorageKeys()).toEqual([]);
    expect(localStorage.getItem(`${APP_PREFIX}analyze_mode`)).toBe('both');
  });

  it('ne touche pas dwc_theme, clé de la famille', () => {
    localStorage.setItem('dwc_theme', 'dark');

    migrateLegacyStorageKeys();

    expect(localStorage.getItem('dwc_theme')).toBe('dark');
    expect(localStorage.getItem(`${APP_PREFIX}dwc_theme`)).toBeNull();
    expect(Object.keys(LEGACY_KEY_MAP)).not.toContain('dwc_theme');
  });

  it('laisse en place les clés d’une AUTRE app de la famille', () => {
    localStorage.setItem('mfm_favorites', '["a"]');
    localStorage.setItem('miss-genius:data', '{}');

    migrateLegacyStorageKeys();

    expect(localStorage.getItem('mfm_favorites')).toBe('["a"]');
    expect(localStorage.getItem('miss-genius:data')).toBe('{}');
  });
});

describe('sauvegarde', () => {
  it('énumère le magasin par préfixe, sans liste blanche', () => {
    appStore.setRaw('cr_text', 'texte');
    appStore.setRaw('analyze_mode', 'both');
    // Une clé ajoutée demain est reprise sans toucher à ce fichier — c'est ce
    // que l'ancienne liste blanche ne savait pas faire.
    appStore.setRaw('cle_inventee_plus_tard', '42');

    const backup = buildAppBackup();

    expect(Object.keys(backup.data).sort()).toEqual([
      'analyze_mode',
      'cle_inventee_plus_tard',
      'cr_text',
    ]);
    expect(backup.prefix).toBe(APP_PREFIX);
    expect(backup.entries).toBe(3);
  });

  it('ignore les clés des autres apps de la même origine', () => {
    appStore.setRaw('cr_text', 'texte');
    localStorage.setItem('mfm_places', '[]');
    localStorage.setItem('dwc_theme', 'dark');

    expect(Object.keys(buildAppBackup().data)).toEqual(['cr_text']);
  });

  it('n’emporte JAMAIS le mot secret OMS', () => {
    appStore.setRaw(SECRET, 'secret-en-clair');
    appStore.setRaw('who_icd_client_id', 'mon-identifiant');

    const backup = buildAppBackup();

    expect(backup.data[SECRET]).toBeUndefined();
    expect(backup.data.who_icd_client_id).toBe('mon-identifiant');
    expect(JSON.stringify(backup)).not.toContain('secret-en-clair');
    expect(backup.entries).toBe(1);
  });
});

describe('restauration', () => {
  it('fait l’aller-retour', () => {
    appStore.setRaw('cr_text', 'texte');
    appStore.setRaw('validated_diagnostics', '[{"code":"I10"}]');
    const file = JSON.stringify(buildAppBackup());
    localStorage.clear();

    const result = restoreAppBackup(file);

    expect(result).toEqual({ ok: true, restored: 2 });
    expect(appStore.getRaw('cr_text')).toBe('texte');
    expect(appStore.getRaw('validated_diagnostics')).toBe('[{"code":"I10"}]');
  });

  it('ne détruit pas le mot secret déjà saisi (fusion, pas remplacement)', () => {
    appStore.setRaw('cr_text', 'ancien');
    const file = JSON.stringify(buildAppBackup());
    appStore.setRaw(SECRET, 'saisi-sur-cet-appareil');

    expect(restoreAppBackup(file).ok).toBe(true);
    expect(appStore.getRaw(SECRET)).toBe('saisi-sur-cet-appareil');
  });

  it('REFUSE un fichier JSON quelconque — l’ancien code l’acceptait', () => {
    const result = restoreAppBackup('{"a":"b"}');

    expect(result.ok).toBe(false);
    expect(localStorage.getItem('a')).toBeNull();
  });

  it('REFUSE la sauvegarde d’une autre app de la famille', () => {
    const etranger = JSON.stringify({
      format: 'dwc-backup',
      v: 1,
      app: 'mister-family-map',
      prefix: 'mfm_',
      data: { places: '[]' },
    });

    const result = restoreAppBackup(etranger);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems.join(' ')).toContain('autre application');
    }
    expect(localStorage.getItem('mfm_places')).toBeNull();
  });

  it('ne peut PAS écrire hors du préfixe, même si le fichier le demande', () => {
    // Le fichier réclame des clés d'autres apps ; `store.setRaw` préfixe, donc
    // elles atterrissent sous `cim10_` et ne peuvent rien écraser ailleurs.
    const malveillant = JSON.stringify({
      format: 'dwc-backup',
      v: 1,
      app: 'mister-cim10',
      prefix: APP_PREFIX,
      data: { dwc_theme: 'dark', mfm_places: '[]' },
    });
    localStorage.setItem('dwc_theme', 'light');
    localStorage.setItem('mfm_places', '["intact"]');

    expect(restoreAppBackup(malveillant).ok).toBe(true);
    expect(localStorage.getItem('dwc_theme')).toBe('light');
    expect(localStorage.getItem('mfm_places')).toBe('["intact"]');
    expect(localStorage.getItem(`${APP_PREFIX}dwc_theme`)).toBe('dark');
  });

  it('refuse un fichier illisible sans rien écrire', () => {
    appStore.setRaw('cr_text', 'intact');

    const result = restoreAppBackup('{ pas du json');

    expect(result.ok).toBe(false);
    expect(appStore.getRaw('cr_text')).toBe('intact');
  });

  it('accepte encore une sauvegarde produite AVANT le préfixe', () => {
    const ancien = JSON.stringify({
      analyze_mode: 'both',
      cr_text: 'compte-rendu',
      who_icd_client_secret: 'secret-historique',
      app_theme: 'dark',
      cr_history: '[]',
    });

    const result = restoreAppBackup(ancien);

    expect(result.ok).toBe(true);
    expect(appStore.getRaw('analyze_mode')).toBe('both');
    expect(appStore.getRaw('cr_text')).toBe('compte-rendu');
    // Le mot secret d'un ancien fichier n'est pas réinjecté non plus, et les
    // clés mortes ne sont pas ressuscitées.
    expect(appStore.getRaw(SECRET)).toBeNull();
    expect(appStore.getRaw('cr_history')).toBeNull();
    expect(localStorage.getItem('app_theme')).toBeNull();
  });
});
