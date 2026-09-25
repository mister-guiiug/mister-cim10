import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AnnouncerProvider } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../../i18n';
import { SocleLabelsBridge } from '../../components/SocleLabelsBridge';
import { DialogProvider } from '../../components/DialogProvider';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { refreshSnapshot } from '../../lib/app-store';
import {
  lireAccordDictee,
  type ConstructeurReconnaissance,
  type EnvironnementDictee,
  type EvenementResultat,
  type ReconnaissanceVocale,
} from '../../lib/dictee';
import { CrPanel } from './CrPanel';

/**
 * CE QUE CE FICHIER TIENT. La dictée d'un compte-rendu médical, et d'abord la
 * question de savoir OÙ part la voix : sur l'appareil, rien n'est demandé ; en
 * ligne, rien ne démarre sans un accord explicite, gardé et révocable. Puis ce
 * que la dictée écrit — au curseur, une fois par segment — et ce qu'elle dit
 * quand elle échoue. Et le raccourci Ctrl+Entrée, qui vit dans le même
 * panneau.
 *
 * LA DICTÉE EST CHARGÉE À LA DEMANDE : le premier clic touche une DOUBLURE,
 * que le vrai bouton relève une fois le module arrivé. Les attentes portent
 * donc sur ce que la dictée FAIT (un micro ouvert, un état affiché), jamais
 * sur le seul `aria-pressed` du bouton — la doublure le pose aussi, dès le
 * clic, pendant le chargement.
 */

/** Un micro de test : on lui fait « entendre » des phrases à la main. */
class FauxMicro implements ReconnaissanceVocale {
  static instances: FauxMicro[] = [];
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  onstart: (() => void) | null = null;
  onresult: ((e: EvenementResultat) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  arrete = false;
  private resultats: { transcript: string; isFinal: boolean }[] = [];

  constructor() {
    FauxMicro.instances.push(this);
  }

  start() {
    queueMicrotask(() => this.onstart?.());
  }

  stop() {
    this.arrete = true;
    queueMicrotask(() => this.onend?.());
  }

  abort() {
    queueMicrotask(() => this.onend?.());
  }

  /** Un résultat intermédiaire remplace le précédent ; un définitif le fige. */
  entendre(transcript: string, isFinal: boolean) {
    const dernier = this.resultats.at(-1);
    const index =
      dernier && !dernier.isFinal
        ? this.resultats.length - 1
        : this.resultats.length;
    this.resultats[index] = { transcript, isFinal };
    const results = this.resultats.map(r => ({
      isFinal: r.isFinal,
      length: 1,
      0: { transcript: r.transcript },
    }));
    this.onresult?.({ resultIndex: index, results });
  }
}

/** Un navigateur récent, qui sait reconnaître sur l'appareil. */
function microLocal(): ConstructeurReconnaissance {
  class MicroLocal extends FauxMicro {}
  Object.defineProperty(MicroLocal.prototype, 'processLocally', {
    configurable: true,
    get(this: { local?: boolean }) {
      return this.local ?? false;
    },
    set(this: { local?: boolean }, valeur: boolean) {
      this.local = valeur;
    },
  });
  return Object.assign(MicroLocal, {
    available: vi.fn(async () => 'available'),
  }) as unknown as ConstructeurReconnaissance;
}

function environnement(
  Reconnaissance: ConstructeurReconnaissance | null = FauxMicro,
  enLigne = true
): EnvironnementDictee {
  return { Reconnaissance, enLigne: () => enLigne };
}

function monter(
  env: EnvironnementDictee = environnement(),
  onAnalyze = vi.fn()
) {
  render(
    <MemoryRouter>
      <I18nProvider>
        <SocleLabelsBridge>
          <AnnouncerProvider>
            <DialogProvider>
              <CrPanel onAnalyze={onAnalyze} dictationEnvironment={env} />
            </DialogProvider>
          </AnnouncerProvider>
        </SocleLabelsBridge>
      </I18nProvider>
    </MemoryRouter>
  );
  return onAnalyze;
}

const boutonDictee = () => screen.getByRole('button', { name: 'Dictée' });
const zone = () =>
  screen.getByRole('textbox', {
    name: 'Texte du compte-rendu',
  }) as HTMLTextAreaElement;
const annonce = () =>
  document.querySelector('.dwc-sr-only[aria-live="polite"]')?.textContent ?? '';
const dernierMicro = () => FauxMicro.instances.at(-1)!;

// Le module est transformé une fois ici, pas pendant le premier test : sur ce
// poste, sa transformation à froid dépasse le délai par défaut de `findBy*`.
beforeAll(async () => {
  await import('./Dictation');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  refreshSnapshot();
  FauxMicro.instances = [];
  useWorkspaceStore.setState({ crText: '', isAnalyzing: false });
});

describe('le bouton Dictée', () => {
  it('n’existe pas quand le navigateur n’a pas l’API', () => {
    monter(environnement(null));
    expect(screen.queryByRole('button', { name: 'Dictée' })).toBeNull();
  });

  it('existe, bouton bascule, quand elle est là', () => {
    monter();
    expect(boutonDictee()).toHaveAttribute('aria-pressed', 'false');
  });

  it('au repos, le vrai bouton relève la doublure — sans rien démarrer, et en gardant le focus', async () => {
    let auRepos: (() => void) | undefined;
    vi.stubGlobal('requestIdleCallback', (rappel: () => void) => {
      auRepos = rappel;
      return 1;
    });
    vi.stubGlobal('cancelIdleCallback', () => {});
    monter();
    const doublure = boutonDictee();
    doublure.focus();

    await act(async () => {
      auRepos?.();
    });

    await waitFor(() => expect(boutonDictee()).not.toBe(doublure));
    expect(document.activeElement).toBe(boutonDictee());
    expect(boutonDictee()).toHaveAttribute('aria-pressed', 'false');
    expect(FauxMicro.instances).toHaveLength(0);
  });

  it('un second clic pendant le chargement renonce : rien ne démarre', async () => {
    monter(environnement(microLocal()));
    fireEvent.click(boutonDictee());
    expect(boutonDictee()).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(boutonDictee());

    // Le module arrive quand même : le vrai bouton relève la doublure, au repos.
    await waitFor(() =>
      expect(boutonDictee()).toHaveAttribute('aria-pressed', 'false')
    );
    await new Promise(fin => setTimeout(fin, 50));
    expect(FauxMicro.instances).toHaveLength(0);
  });
});

describe('en ligne : rien ne démarre sans accord', () => {
  it('pose la question au premier usage ; un refus ne démarre rien', async () => {
    monter();
    fireEvent.click(boutonDictee());

    const boite = await screen.findByRole('alertdialog', {
      name: 'Dictée en ligne : où part votre voix',
    });
    expect(boite).toHaveTextContent(/Google pour Chrome/u);
    expect(boite).toHaveTextContent(/aucune donnée identifiante/u);

    fireEvent.click(screen.getByRole('button', { name: 'Ne pas dicter' }));

    await waitFor(() => expect(annonce()).toMatch(/Dictée annulée/u));
    expect(FauxMicro.instances).toHaveLength(0);
    expect(lireAccordDictee()).toBeNull();
    expect(boutonDictee()).toHaveAttribute('aria-pressed', 'false');
  });

  it('accepté : l’accord est gardé, la dictée démarre, et on ne redemande plus', async () => {
    monter();
    fireEvent.click(boutonDictee());
    fireEvent.click(
      await screen.findByRole('button', { name: 'Accepter et dicter' })
    );

    await waitFor(() => expect(FauxMicro.instances).toHaveLength(1));
    expect(lireAccordDictee()).not.toBeNull();
    const micro = dernierMicro();
    expect(micro).toMatchObject({
      lang: 'fr-FR',
      continuous: true,
      interimResults: true,
    });
    await waitFor(() =>
      expect(boutonDictee()).toHaveAttribute('aria-pressed', 'true')
    );
    expect(
      screen.getByText(/service en ligne de votre navigateur/u)
    ).toBeInTheDocument();

    // Second clic : arrêt, et c'est dit.
    fireEvent.click(boutonDictee());
    await waitFor(() =>
      expect(boutonDictee()).toHaveAttribute('aria-pressed', 'false')
    );
    expect(micro.arrete).toBe(true);
    // L'annonce part de l'effet qui VOIT la fin de l'écoute : un rendu après
    // le bouton, d'où l'attente.
    await waitFor(() => expect(annonce()).toBe('Dictée arrêtée.'));

    // Nouveau départ : plus de question.
    fireEvent.click(boutonDictee());
    await waitFor(() => expect(FauxMicro.instances).toHaveLength(2));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('hors connexion, ni question ni démarrage : une erreur lisible', async () => {
    monter(environnement(FauxMicro, false));
    fireEvent.click(boutonDictee());

    expect(
      await screen.findByText(/Hors connexion : la dictée passe ici/u)
    ).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(FauxMicro.instances).toHaveLength(0);
  });
});

describe('sur l’appareil : rien ne sort, rien à accepter', () => {
  it('démarre sans question, en exigeant le traitement local', async () => {
    const Micro = microLocal();
    monter(environnement(Micro));
    fireEvent.click(boutonDictee());

    await waitFor(() => expect(FauxMicro.instances).toHaveLength(1));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect((dernierMicro() as ReconnaissanceVocale).processLocally).toBe(true);
    expect(Micro.available).toHaveBeenCalledWith({
      langs: ['fr-FR'],
      processLocally: true,
    });
    expect(lireAccordDictee()).toBeNull();
    expect(
      await screen.findByText(/reconnaissance sur l’appareil/u)
    ).toBeInTheDocument();
  });
});

describe('ce que la dictée écrit', () => {
  async function dicterDepuis(texte: string, curseur: number) {
    useWorkspaceStore.setState({ crText: texte });
    monter(environnement(microLocal()));
    const ta = zone();
    ta.focus();
    ta.setSelectionRange(curseur, curseur);
    // Cliquer « Dictée » sort le focus de la zone de texte.
    boutonDictee().focus();
    fireEvent.click(boutonDictee());
    await waitFor(() => expect(FauxMicro.instances).toHaveLength(1));
    await screen.findByText(/reconnaissance sur l’appareil/u);
    return dernierMicro();
  }

  it('montre l’intermédiaire, écrit le définitif AU CURSEUR, une seule fois', async () => {
    const micro = await dicterDepuis('Patient HTA', 7);

    act(() => micro.entendre('diabé', false));
    expect(screen.getByText('Entendu : « diabé »')).toBeInTheDocument();
    expect(useWorkspaceStore.getState().crText).toBe('Patient HTA');

    act(() => micro.entendre('diabétique de type 2', true));
    expect(useWorkspaceStore.getState().crText).toBe(
      'Patient diabétique de type 2 HTA'
    );
    expect(screen.queryByText(/Entendu :/u)).toBeNull();

    // Le segment suivant se pose après le précédent, pas à la fin du texte.
    act(() => micro.entendre('suivi', true));
    expect(useWorkspaceStore.getState().crText).toBe(
      'Patient diabétique de type 2 suivi HTA'
    );
  });

  it('dit ses erreurs, et s’arrête', async () => {
    const micro = await dicterDepuis('', 0);

    act(() => {
      micro.onerror?.({ error: 'not-allowed' });
      micro.onend?.();
    });

    expect(
      screen.getByText(/Micro refusé : autorisez l’accès au micro/u)
    ).toBeInTheDocument();
    expect(boutonDictee()).toHaveAttribute('aria-pressed', 'false');
  });

  it('« Nouvelle session » coupe la dictée sans rien écrire de plus', async () => {
    const micro = await dicterDepuis('Patient A', 9);
    const abandon = vi.spyOn(micro, 'abort');

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle session' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmer' }));

    await waitFor(() => expect(abandon).toHaveBeenCalled());
    // Un résultat en route n'atterrit pas dans le dossier suivant.
    micro.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, length: 1, 0: { transcript: 'fin' } }],
    });
    expect(useWorkspaceStore.getState().crText).toBe('');
  });
});

describe('Ctrl+Entrée dans le compte-rendu', () => {
  it('lance l’analyse, et le bouton le déclare', () => {
    useWorkspaceStore.setState({ crText: 'Patient HTA' });
    const onAnalyze = monter();

    fireEvent.keyDown(zone(), { key: 'Enter', ctrlKey: true });

    expect(onAnalyze).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Analyser' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Enter'
    );
    // La zone de texte le dit à qui l'écoute.
    const description = document.getElementById(
      zone().getAttribute('aria-describedby') ?? ''
    );
    expect(description).toHaveTextContent(
      'Ctrl + Entrée lance l’analyse sans quitter le compte-rendu.'
    );
  });

  it('Entrée seule reste un retour à la ligne, et une analyse en cours ne se relance pas', () => {
    useWorkspaceStore.setState({ crText: 'Patient HTA' });
    const onAnalyze = monter();

    fireEvent.keyDown(zone(), { key: 'Enter' });
    expect(onAnalyze).not.toHaveBeenCalled();

    act(() => useWorkspaceStore.setState({ isAnalyzing: true }));
    fireEvent.keyDown(zone(), { key: 'Enter', ctrlKey: true });
    expect(onAnalyze).not.toHaveBeenCalled();
  });
});
