import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLE_ACCORD_DICTEE,
  enregistrerAccordDictee,
  environnementDuNavigateur,
  lireAccordDictee,
  retirerAccordDictee,
  type ConstructeurReconnaissance,
  type EnvironnementDictee,
} from './dictee';
import {
  etatReconnaissanceLocale,
  insererAuCurseur,
  installerReconnaissanceLocale,
  traduireErreurDictee,
} from './dictee-moteur';
import { APP_PREFIX } from './storage-migration';

/**
 * CE QUE CE FICHIER TIENT : la question « où part la voix ? » reçoit la bonne
 * réponse sur chaque visage de l'API — absente, en ligne seulement, locale
 * disponible, locale à télécharger — et l'accord ne se forge pas.
 */

/** Un constructeur minimal, avec ou sans les ajouts récents de l'API. */
function faux(options: {
  local?: boolean;
  available?: ConstructeurReconnaissance['available'];
  install?: ConstructeurReconnaissance['install'];
}): ConstructeurReconnaissance {
  class Reconnaissance {
    lang = '';
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    onstart = null;
    onresult = null;
    onerror = null;
    onend = null;
    start() {}
    stop() {}
    abort() {}
  }
  // Comme dans Chrome : un ACCESSEUR du prototype, pas un champ d'instance.
  if (options.local) {
    Object.defineProperty(Reconnaissance.prototype, 'processLocally', {
      configurable: true,
      get: () => false,
      set: () => {},
    });
  }
  return Object.assign(Reconnaissance, {
    available: options.available,
    install: options.install,
  }) as unknown as ConstructeurReconnaissance;
}

/** La langue demandée au navigateur quand l'interface est en français. */
const FR = 'fr-FR';

const env = (C: ConstructeurReconnaissance | null): EnvironnementDictee => ({
  Reconnaissance: C,
  enLigne: () => true,
});

beforeEach(() => {
  localStorage.clear();
});

describe('l’API existe-t-elle ?', () => {
  it('préfère la forme standard, retombe sur la préfixée, sinon rien', () => {
    const standard = faux({});
    const prefixee = faux({});
    expect(
      environnementDuNavigateur({
        SpeechRecognition: standard,
        webkitSpeechRecognition: prefixee,
      }).Reconnaissance
    ).toBe(standard);
    expect(
      environnementDuNavigateur({ webkitSpeechRecognition: prefixee })
        .Reconnaissance
    ).toBe(prefixee);
    expect(environnementDuNavigateur({}).Reconnaissance).toBeNull();
  });

  it('se sait hors connexion quand le navigateur le dit', () => {
    expect(
      environnementDuNavigateur({ navigator: { onLine: false } }).enLigne()
    ).toBe(false);
    expect(
      environnementDuNavigateur({ navigator: { onLine: true } }).enLigne()
    ).toBe(true);
  });
});

describe('reconnaître sur l’appareil ?', () => {
  it('oui quand le navigateur le dit, pour la langue demandée', async () => {
    const available = vi.fn(async () => 'available');
    expect(
      await etatReconnaissanceLocale(env(faux({ local: true, available })), FR)
    ).toBe('disponible');
    expect(available).toHaveBeenCalledWith({
      langs: [FR],
      processLocally: true,
    });
  });

  it('« à installer » quand le modèle se télécharge et qu’on sait l’installer', async () => {
    const C = faux({
      local: true,
      available: async () => 'downloadable',
      install: async () => true,
    });
    expect(await etatReconnaissanceLocale(env(C), FR)).toBe('a-installer');
    expect(await installerReconnaissanceLocale(env(C), FR)).toBe(true);
  });

  it('non sans `available()`, sans `processLocally`, ou si la question lève', async () => {
    expect(await etatReconnaissanceLocale(env(faux({})), FR)).toBe(
      'indisponible'
    );
    expect(
      await etatReconnaissanceLocale(
        env(faux({ available: async () => 'available' })),
        FR
      )
    ).toBe('indisponible');
    expect(
      await etatReconnaissanceLocale(
        env(
          faux({
            local: true,
            available: async () => {
              throw new Error('refus');
            },
          })
        ),
        FR
      )
    ).toBe('indisponible');
    expect(
      await etatReconnaissanceLocale(
        env(faux({ local: true, available: async () => 'unavailable' })),
        FR
      )
    ).toBe('indisponible');
    expect(await etatReconnaissanceLocale(env(null), FR)).toBe('indisponible');
  });

  it('une installation qui échoue ou lève rend `false`', async () => {
    expect(
      await installerReconnaissanceLocale(
        env(faux({ install: async () => false })),
        FR
      )
    ).toBe(false);
    expect(
      await installerReconnaissanceLocale(
        env(
          faux({
            install: async () => {
              throw new Error('réseau');
            },
          })
        ),
        FR
      )
    ).toBe(false);
  });
});

describe('l’accord pour la dictée en ligne', () => {
  it('se donne, se lit, se retire', () => {
    expect(lireAccordDictee()).toBeNull();

    enregistrerAccordDictee(1_758_000_000_000);
    expect(lireAccordDictee()).toBe(1_758_000_000_000);
    expect(localStorage.getItem(`${APP_PREFIX}${CLE_ACCORD_DICTEE}`)).toBe(
      '1758000000000'
    );

    retirerAccordDictee();
    expect(lireAccordDictee()).toBeNull();
  });

  it('une valeur illisible ne vaut pas accord', () => {
    localStorage.setItem(`${APP_PREFIX}${CLE_ACCORD_DICTEE}`, 'oui');
    expect(lireAccordDictee()).toBeNull();
    localStorage.setItem(`${APP_PREFIX}${CLE_ACCORD_DICTEE}`, '0');
    expect(lireAccordDictee()).toBeNull();
  });
});

describe('les erreurs de l’API, en cas explicables', () => {
  it.each([
    ['not-allowed', 'micro-refuse'],
    ['service-not-allowed', 'service-refuse'],
    ['no-speech', 'rien-entendu'],
    ['audio-capture', 'pas-de-micro'],
    ['network', 'reseau'],
    ['language-not-supported', 'langue'],
    ['bad-grammar', 'inconnue'],
  ])('%s → %s', (code, attendu) => {
    expect(traduireErreurDictee(code)).toBe(attendu);
  });

  it('« aborted » ne se dit pas : c’est l’application qui a coupé', () => {
    expect(traduireErreurDictee('aborted')).toBeNull();
  });
});

describe('le texte dicté s’insère au curseur', () => {
  it('au milieu, avec une espace de chaque côté', () => {
    expect(insererAuCurseur('Patient HTA', 7, 7, 'diabétique')).toEqual({
      texte: 'Patient diabétique HTA',
      curseur: 18,
    });
  });

  it('remplace la sélection', () => {
    expect(insererAuCurseur('Patient XXX suivi', 8, 11, 'diabétique')).toEqual({
      texte: 'Patient diabétique suivi',
      curseur: 18,
    });
  });

  it('en fin de texte, et dans un texte vide', () => {
    expect(insererAuCurseur('Patient', 7, 7, ' diabétique ')).toEqual({
      texte: 'Patient diabétique',
      curseur: 18,
    });
    expect(insererAuCurseur('', 0, 0, 'HTA')).toEqual({
      texte: 'HTA',
      curseur: 3,
    });
  });

  it('pas d’espace devant la ponctuation qui suit', () => {
    expect(insererAuCurseur('Patient, HTA', 7, 7, 'diabétique').texte).toBe(
      'Patient diabétique, HTA'
    );
  });

  it('des bornes hors du texte sont ramenées dedans', () => {
    expect(insererAuCurseur('HTA', 40, 40, 'BPCO')).toEqual({
      texte: 'HTA BPCO',
      curseur: 8,
    });
  });

  it('un fragment vide ne change rien', () => {
    expect(insererAuCurseur('HTA', 1, 1, '   ')).toEqual({
      texte: 'HTA',
      curseur: 1,
    });
  });
});
