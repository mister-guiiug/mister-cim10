import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshSnapshot } from '../lib/app-store';
import {
  enregistrerAccordDictee,
  type ConstructeurReconnaissance,
  type EnvironnementDictee,
  type ReconnaissanceVocale,
} from '../lib/dictee';
import { useSpeechRecognition } from './useSpeechRecognition';

/**
 * Les chemins que le panneau n'éprouve pas : le modèle local à télécharger,
 * l'abandon d'une préparation, et le micro coupé quand l'écran s'en va.
 */

/** La langue demandée au navigateur quand l'interface est en français. */
const FR = 'fr-FR';

const instances: ReconnaissanceVocale[] = [];

function micro(statiques: {
  available?: () => Promise<string>;
  install?: () => Promise<boolean>;
}): ConstructeurReconnaissance {
  class Micro implements ReconnaissanceVocale {
    lang = '';
    continuous = false;
    interimResults = false;
    maxAlternatives = 0;
    onstart: (() => void) | null = null;
    onresult = null;
    onerror = null;
    onend: (() => void) | null = null;
    constructor() {
      instances.push(this);
    }
    start = vi.fn(() => queueMicrotask(() => this.onstart?.()));
    stop = vi.fn(() => queueMicrotask(() => this.onend?.()));
    abort = vi.fn();
  }
  let local = false;
  Object.defineProperty(Micro.prototype, 'processLocally', {
    configurable: true,
    get: () => local,
    set: (v: boolean) => {
      local = v;
    },
  });
  return Object.assign(
    Micro,
    statiques
  ) as unknown as ConstructeurReconnaissance;
}

const env = (C: ConstructeurReconnaissance): EnvironnementDictee => ({
  Reconnaissance: C,
  enLigne: () => true,
});

beforeEach(() => {
  localStorage.clear();
  refreshSnapshot();
  instances.length = 0;
});

describe('le modèle local à télécharger', () => {
  it('installé, il sert — sans question', async () => {
    const install = vi.fn(async () => true);
    const demanderAccord = vi.fn(async () => true);
    const { result } = renderHook(() =>
      useSpeechRecognition({
        langue: FR,
        onTexte: () => {},
        demanderAccord,
        environnement: env(
          micro({ available: async () => 'downloadable', install })
        ),
      })
    );

    await act(() => result.current.basculer());

    expect(install).toHaveBeenCalledWith({
      langs: [FR],
      processLocally: true,
    });
    expect(demanderAccord).not.toHaveBeenCalled();
    expect(instances[0]?.processLocally).toBe(true);
    await waitFor(() => expect(result.current.etat).toBe('ecoute'));
    expect(result.current.mode).toBe('appareil');
  });

  it('échoué, on retombe sur la dictée en ligne — donc sur la question', async () => {
    const demanderAccord = vi.fn(async () => false);
    const { result } = renderHook(() =>
      useSpeechRecognition({
        langue: FR,
        onTexte: () => {},
        demanderAccord,
        environnement: env(
          micro({
            available: async () => 'downloadable',
            install: async () => false,
          })
        ),
      })
    );

    await act(() => result.current.basculer());

    expect(demanderAccord).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(0);
    expect(result.current.etat).toBe('repos');
  });
});

describe('abandonner, couper', () => {
  it('un second clic pendant la préparation l’abandonne : rien ne démarre', async () => {
    let repondre: (etat: string) => void = () => {};
    const demanderAccord = vi.fn(async () => true);
    const { result } = renderHook(() =>
      useSpeechRecognition({
        langue: FR,
        onTexte: () => {},
        demanderAccord,
        environnement: env(
          micro({
            available: () =>
              new Promise<string>(resoudre => {
                repondre = resoudre;
              }),
          })
        ),
      })
    );

    let premier: Promise<void> = Promise.resolve();
    act(() => {
      premier = result.current.basculer();
    });
    expect(result.current.etat).toBe('preparation');

    await act(() => result.current.basculer());
    expect(result.current.etat).toBe('repos');

    await act(async () => {
      repondre('unavailable');
      await premier;
    });
    expect(demanderAccord).not.toHaveBeenCalled();
    expect(instances).toHaveLength(0);
  });

  it('un accord déjà donné ne se redemande pas', async () => {
    enregistrerAccordDictee(1);
    const demanderAccord = vi.fn(async () => true);
    const { result } = renderHook(() =>
      useSpeechRecognition({
        langue: 'en-US',
        onTexte: () => {},
        demanderAccord,
        environnement: env(micro({})),
      })
    );

    await act(() => result.current.basculer());

    expect(demanderAccord).not.toHaveBeenCalled();
    expect(instances[0]?.lang).toBe('en-US');
    expect(instances[0]?.processLocally).toBe(false);
  });

  it('quitter l’écran coupe le micro', async () => {
    enregistrerAccordDictee(1);
    const { result, unmount } = renderHook(() =>
      useSpeechRecognition({
        langue: FR,
        onTexte: () => {},
        demanderAccord: async () => true,
        environnement: env(micro({})),
      })
    );
    await act(() => result.current.basculer());
    await waitFor(() => expect(result.current.etat).toBe('ecoute'));

    unmount();

    expect(instances[0]?.abort).toHaveBeenCalled();
  });
});
