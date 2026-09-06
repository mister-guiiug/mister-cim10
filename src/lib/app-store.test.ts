import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_SESSIONS,
  SCHEMA_VERSION,
  SNAPSHOT_KEY,
  readSnapshot,
  refreshSnapshot,
  updateSnapshot,
} from './app-store';
import { APP_PREFIX } from './storage-migration';
import {
  readAnalyzeMode,
  readMinConfidenceThreshold,
  readWhoSettings,
} from './settings';
import { buildAppBackup, restoreAppBackup } from './storage';

/**
 * L'INSTANTANÉ DES CLÉS D'AUJOURD'HUI.
 *
 * Dix clés éparses sous `cim10_`, exactement dans la forme que l'application
 * écrit AVANT ce magasin : des chaînes brutes, `'1'` pour un booléen, du JSON
 * pour la liste des diagnostics. C'est cet état-là qu'un utilisateur a sur son
 * appareil aujourd'hui, et c'est lui que la mise à jour ne doit pas perdre.
 */
const HIER = {
  analyze_mode: 'both',
  who_icd_client_id: 'mon-identifiant',
  who_icd_client_secret: 'mot-secret-en-clair',
  who_icd_release: '2024-01',
  who_icd_lang: 'en',
  who_icd_proxy_url: 'https://passerelle.test',
  min_confidence_threshold: '0.65',
  disclaimer_dismissed: '1',
  validated_diagnostics: JSON.stringify([
    {
      id: 'a1',
      code: 'E11.9',
      label: 'Diabète sucré de type 2, sans complication',
      note: 'motif principal',
      validatedAt: 1757000000000,
      source: 'local',
    },
    {
      id: 'b2',
      code: 'I10',
      label: 'Hypertension essentielle (primitive)',
      validatedAt: 1757000001000,
      source: 'local',
    },
  ]),
  cr_text: 'Patient diabétique de type 2, HTA suivie depuis 2019.',
};

/** Pose l'état d'hier tel quel dans le stockage, puis vide le cache mémoire. */
function poserEtatDHier(): void {
  for (const [court, valeur] of Object.entries(HIER)) {
    localStorage.setItem(`${APP_PREFIX}${court}`, valeur);
  }
  refreshSnapshot();
}

beforeEach(() => {
  localStorage.clear();
  refreshSnapshot();
});

describe('reprise des clés cim10_ d’aujourd’hui (migration 0 → 1)', () => {
  it('retrouve INTÉGRALEMENT l’état d’hier, valeur par valeur', () => {
    poserEtatDHier();

    const snapshot = readSnapshot();

    // Compte-rendu en cours et diagnostics retenus — le travail de la journée.
    expect(snapshot.crText).toBe(HIER.cr_text);
    expect(snapshot.validated).toEqual(JSON.parse(HIER.validated_diagnostics));

    // Réglages : mode, seuil, avertissement masqué.
    expect(snapshot.mode).toBe('both');
    expect(snapshot.minConfidence).toBe(0.65);
    expect(snapshot.disclaimerDismissed).toBe(true);

    // Connexion OMS (le mot secret garde sa clé propre, cf. test suivant).
    expect(snapshot.who).toEqual({
      clientId: 'mon-identifiant',
      proxyUrl: 'https://passerelle.test',
      releaseId: '2024-01',
      lang: 'en',
    });

    // Et par les fonctions que l'application appelle réellement.
    expect(readAnalyzeMode()).toBe('both');
    expect(readMinConfidenceThreshold()).toBe(0.65);
    expect(readWhoSettings()).toEqual({
      clientId: 'mon-identifiant',
      clientSecret: 'mot-secret-en-clair',
      proxyUrl: 'https://passerelle.test',
      releaseId: '2024-01',
      lang: 'en',
    });
  });

  it('écrit l’enveloppe versionnée et met l’état d’hier de côté', () => {
    poserEtatDHier();

    readSnapshot();

    const brut = localStorage.getItem(`${APP_PREFIX}${SNAPSHOT_KEY}`);
    expect(brut).not.toBeNull();
    expect(JSON.parse(brut as string).v).toBe(SCHEMA_VERSION);
    // Le socle copie de côté AVANT toute transformation : l'état d'hier reste
    // lisible tel quel si la migration s'était trompée.
    expect(
      localStorage.getItem(`${APP_PREFIX}${SNAPSHOT_KEY}.backup-v0`)
    ).not.toBeNull();
  });

  it('ne fait PAS entrer le mot secret OMS dans l’instantané', () => {
    poserEtatDHier();

    readSnapshot();

    // Ni dans l'instantané, ni dans la copie de côté : `buildAppBackup`
    // énumère TOUT le préfixe, un secret glissé là repartirait en clair dans
    // le fichier de sauvegarde.
    for (const cle of [SNAPSHOT_KEY, `${SNAPSHOT_KEY}.backup-v0`]) {
      expect(localStorage.getItem(`${APP_PREFIX}${cle}`)).not.toContain(
        'mot-secret-en-clair'
      );
    }
    expect(localStorage.getItem(`${APP_PREFIX}who_icd_client_secret`)).toBe(
      'mot-secret-en-clair'
    );
    expect(JSON.stringify(buildAppBackup())).not.toContain(
      'mot-secret-en-clair'
    );
  });

  it('ne touche pas la langue, qui appartient à l’i18n du socle', () => {
    localStorage.setItem(`${APP_PREFIX}locale`, 'en');
    poserEtatDHier();

    readSnapshot();

    expect(localStorage.getItem(`${APP_PREFIX}locale`)).toBe('en');
  });

  it('est idempotente : une seconde ouverture ne rejoue rien', () => {
    poserEtatDHier();
    readSnapshot();
    const apres = localStorage.getItem(`${APP_PREFIX}${SNAPSHOT_KEY}`);

    refreshSnapshot();
    const snapshot = readSnapshot();

    expect(localStorage.getItem(`${APP_PREFIX}${SNAPSHOT_KEY}`)).toBe(apres);
    expect(snapshot.crText).toBe(HIER.cr_text);
  });

  it('sur un appareil vierge, rend l’état initial sans rien écrire', () => {
    const snapshot = readSnapshot();

    expect(snapshot.crText).toBe('');
    expect(snapshot.validated).toEqual([]);
    expect(snapshot.sessions).toEqual([]);
    expect(snapshot.mode).toBe('local');
    expect(localStorage.getItem(`${APP_PREFIX}${SNAPSHOT_KEY}`)).toBeNull();
  });
});

describe('le magasin versionné ne détruit jamais en silence', () => {
  it('met de côté un instantané d’une version PLUS RÉCENTE', () => {
    localStorage.setItem(
      `${APP_PREFIX}${SNAPSHOT_KEY}`,
      JSON.stringify({ v: SCHEMA_VERSION + 99, data: { crText: 'du futur' } })
    );
    refreshSnapshot();

    const snapshot = readSnapshot();

    expect(snapshot.crText).toBe('');
    expect(
      localStorage.getItem(
        `${APP_PREFIX}${SNAPSHOT_KEY}.backup-v${SCHEMA_VERSION + 99}`
      )
    ).toContain('du futur');
  });

  it('met de côté un instantané illisible', () => {
    localStorage.setItem(`${APP_PREFIX}${SNAPSHOT_KEY}`, '{ tronqué');
    refreshSnapshot();

    expect(readSnapshot().crText).toBe('');
    expect(
      localStorage.getItem(`${APP_PREFIX}${SNAPSHOT_KEY}.backup-illisible`)
    ).toBe('{ tronqué');
  });
});

describe('l’instantané et la sauvegarde JSON', () => {
  it('fait l’aller-retour par le fichier de sauvegarde', () => {
    poserEtatDHier();
    readSnapshot();
    const fichier = JSON.stringify(buildAppBackup());

    localStorage.clear();
    refreshSnapshot();
    expect(restoreAppBackup(fichier).ok).toBe(true);
    refreshSnapshot();

    const snapshot = readSnapshot();
    expect(snapshot.crText).toBe(HIER.cr_text);
    expect(snapshot.validated).toHaveLength(2);
    expect(snapshot.mode).toBe('both');
  });

  it('reprend une sauvegarde d’AVANT l’instantané sans être muette', () => {
    // L'appareil a déjà basculé sur l'instantané…
    updateSnapshot({ crText: 'travail du jour', mode: 'local' });
    // …et l'utilisateur restaure un fichier produit par une version d'avant,
    // qui ne contient que des clés éparses. Les ignorer ferait une
    // restauration qui écrit le fichier sans que rien ne change à l'écran.
    const ancien = JSON.stringify({
      analyze_mode: 'both',
      cr_text: 'compte-rendu restauré',
    });

    expect(restoreAppBackup(ancien).ok).toBe(true);
    const snapshot = readSnapshot();

    expect(snapshot.crText).toBe('compte-rendu restauré');
    expect(snapshot.mode).toBe('both');
    // Les champs que le fichier ne portait pas survivent (fusion, pas
    // remplacement) et les clés éparses ne traînent plus.
    expect(snapshot.sessions).toEqual([]);
    expect(localStorage.getItem(`${APP_PREFIX}cr_text`)).toBeNull();
  });
});

describe('sessions nommées', () => {
  it('borne l’historique à cinq entrées, la plus récente en tête', () => {
    const sessions = Array.from({ length: MAX_SESSIONS + 2 }, (_, i) => ({
      id: `s${i}`,
      name: `dossier ${i}`,
      savedAt: 1757000000000 + i,
      crText: `cr ${i}`,
      validated: [],
    }));

    updateSnapshot({ sessions: sessions.slice(0, MAX_SESSIONS + 2) });

    expect(readSnapshot().sessions).toHaveLength(MAX_SESSIONS);
    expect(readSnapshot().sessions[0]?.name).toBe('dossier 0');
  });
});
