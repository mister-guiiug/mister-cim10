import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AnnouncerProvider } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../../i18n';
import { SocleLabelsBridge } from '../../components/SocleLabelsBridge';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { refreshSnapshot } from '../../lib/app-store';
import { historiqueVide } from '../../lib/historique';
import type { ValidatedDiagnostic } from '../../types/index';
import { ValidatedPanel } from './ValidatedPanel';

/**
 * CE QUE CE FICHIER TIENT : les gestes sur les diagnostics retenus, tels qu'un
 * clavier ou un lecteur d'écran les vivent. Le rendu compte moins que ce qui
 * se passe APRÈS le clic : où va le focus, ce qui est dit, ce qui est refusé.
 */

const state = () => useWorkspaceStore.getState();
const codes = () => state().validated.map(v => v.code);

function diagnostic(code: string, label: string): ValidatedDiagnostic {
  return { id: `id-${code}`, code, label, source: 'local', validatedAt: 1 };
}

/** Ce que la région d'annonce du socle dit en ce moment. */
function annonce(): string {
  return (
    document
      .querySelector('.dwc-sr-only[aria-live="polite"]')
      ?.textContent?.trim() ?? ''
  );
}

function monter() {
  return render(
    <I18nProvider>
      <SocleLabelsBridge>
        <AnnouncerProvider>
          <ValidatedPanel />
        </AnnouncerProvider>
      </SocleLabelsBridge>
    </I18nProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  refreshSnapshot();
  useWorkspaceStore.setState({
    validated: [
      diagnostic('C34.9', 'Tumeur maligne des bronches'),
      diagnostic('B01.9', 'Varicelle'),
      diagnostic('A00.0', 'Choléra'),
    ],
    favorites: [],
    historique: historiqueVide(),
    crText: '',
  });
});

describe('réordonner au clavier', () => {
  it('désactive Monter en tête et Descendre en bas', () => {
    monter();
    expect(screen.getByRole('button', { name: 'Monter C34.9' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Descendre A00.0' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Monter B01.9' })
    ).not.toBeDisabled();
  });

  it('déplace, annonce la position, et le focus reste sur l’élément déplacé', async () => {
    monter();
    const monterA = screen.getByRole('button', { name: 'Monter A00.0' });
    monterA.focus();
    fireEvent.click(monterA);

    expect(codes()).toEqual(['C34.9', 'A00.0', 'B01.9']);
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Monter A00.0' })
      )
    );
    expect(annonce()).toBe('A00.0 déplacé en position 2');

    // En tête, « Monter » est désactivé : le focus passe à « Descendre » du
    // MÊME élément.
    fireEvent.click(screen.getByRole('button', { name: 'Monter A00.0' }));
    expect(codes()).toEqual(['A00.0', 'C34.9', 'B01.9']);
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Descendre A00.0' })
      )
    );
    expect(annonce()).toBe('A00.0 déplacé en position 1');
  });

  it('le rang affiché suit l’ordre, qui est celui des exports', () => {
    const { container } = monter();
    fireEvent.click(screen.getByRole('button', { name: 'Descendre C34.9' }));
    const lignes = [...container.querySelectorAll('.validated-item')].map(
      li =>
        `${li.querySelector('.validated-pos')?.textContent} ${li.querySelector('.validated-code')?.textContent}`
    );
    expect(lignes).toEqual(['1 B01.9', '2 C34.9', '3 A00.0']);
  });
});

describe('modifier un code retenu', () => {
  it('à sa place, avec le même contrôle de format ; Échap annule et rend le focus', async () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier B01.9' }));
    const champ = await screen.findByRole('textbox', { name: 'Code CIM-10' });
    expect(champ).toHaveValue('B01.9');
    expect(document.activeElement).toBe(champ);

    fireEvent.change(champ, { target: { value: 'B1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(champ).toHaveAttribute('aria-invalid', 'true');
    const erreur = screen.getByText(/pas la forme d’un code CIM-10/u);
    expect(champ.getAttribute('aria-describedby')).toContain(erreur.id);
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);

    fireEvent.keyDown(champ, { key: 'Escape' });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Modifier B01.9' })
      )
    );
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
  });

  it('enregistre la forme normalisée, sans bouger l’élément', async () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier B01.9' }));
    fireEvent.change(
      await screen.findByRole('textbox', { name: 'Code CIM-10' }),
      {
        target: { value: 'b02,9' },
      }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Libellé du diagnostic' }),
      { target: { value: 'Varicelle sans complication' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(codes()).toEqual(['C34.9', 'B02.9', 'A00.0']);
    expect(state().validated[1]?.label).toBe('Varicelle sans complication');
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Modifier B02.9' })
      )
    );
    expect(annonce()).toBe('B01.9 remplacé par B02.9.');
  });

  it('refuse de devenir un code déjà retenu', async () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier B01.9' }));
    const champ = await screen.findByRole('textbox', { name: 'Code CIM-10' });
    fireEvent.change(champ, { target: { value: 'A00.0' } });

    expect(
      screen.getByText('Ce code est déjà dans les diagnostics retenus.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
  });
});

describe('modifier un code venu de l’OMS', () => {
  it('se corrige en CIM-11, dans SA classification', async () => {
    useWorkspaceStore.setState({
      validated: [
        {
          id: 'oms',
          code: 'BA00',
          label: 'Hypertension essentielle',
          source: 'api',
          validatedAt: 1,
        },
      ],
    });
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier BA00' }));
    const champ = await screen.findByRole('textbox', { name: 'Code CIM-11' });

    // Une forme CIM-10 n'est pas une correction d'un code CIM-11.
    fireEvent.change(champ, { target: { value: 'I10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(
      screen.getByText(/pas la forme d’un code CIM-11/u)
    ).toBeInTheDocument();

    fireEvent.change(champ, { target: { value: 'ba01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(state().validated[0]).toMatchObject({
      code: 'BA01',
      source: 'api',
    });
  });
});

describe('saisie manuelle : le format est contrôlé', () => {
  /** Le formulaire est chargé à la demande : il arrive après le clic. */
  function ouvrir() {
    fireEvent.click(
      screen.getByRole('button', { name: /ajouter un code manuellement/iu })
    );
    return screen.findByRole('textbox', { name: 'Code CIM-10' });
  }

  it('refuse une forme fausse, relie le message au champ', async () => {
    useWorkspaceStore.setState({ validated: [] });
    monter();
    const champ = await ouvrir();
    fireEvent.change(champ, { target: { value: 'diabète' } });
    // Pas d'erreur à la frappe : « d » n'est pas encore une erreur.
    expect(champ).toHaveAttribute('aria-invalid', 'false');

    fireEvent.blur(champ);
    expect(champ).toHaveAttribute('aria-invalid', 'true');
    const erreur = screen.getByText(/pas la forme d’un code CIM-10/u);
    expect(champ.getAttribute('aria-describedby')).toContain(erreur.id);

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(codes()).toEqual([]);
  });

  it('un code inconnu passe, signalé, avec ses voisins de catégorie', async () => {
    useWorkspaceStore.setState({ validated: [] });
    monter();
    const champ = await ouvrir();
    fireEvent.change(champ, { target: { value: 'e118' } });

    expect(
      screen.getByText(/Absent du référentiel embarqué/u)
    ).toBeInTheDocument();
    const voisins = screen.getByRole('list', { name: /même catégorie/u });
    expect(
      within(voisins)
        .getAllByRole('button')
        .map(b => b.querySelector('strong')?.textContent)
    ).toEqual(['E11.65', 'E11.9']);

    // La forme normalisée remplace la saisie en quittant le champ.
    fireEvent.blur(champ);
    expect(champ).toHaveValue('E11.8');

    // Sans libellé, un code inconnu ne peut pas partir…
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    const libelle = screen.getByRole('textbox', {
      name: 'Libellé du diagnostic',
    });
    expect(libelle).toHaveAttribute('aria-invalid', 'true');
    expect(document.activeElement).toBe(libelle);
    expect(codes()).toEqual([]);

    // …avec, il part, et l'annonce dit qu'il est à vérifier.
    fireEvent.change(libelle, { target: { value: 'Diabète compliqué' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(codes()).toEqual(['E11.8']);
    expect(annonce()).toMatch(/absent du référentiel embarqué/u);
  });

  it('un code connu reprend son libellé de référence', async () => {
    useWorkspaceStore.setState({ validated: [] });
    monter();
    const champ = await ouvrir();
    fireEvent.change(champ, { target: { value: 'i10' } });
    expect(
      screen.getByText(
        'Dans le référentiel embarqué : « Hypertension essentielle (primitive) ».'
      )
    ).toBeInTheDocument();
    fireEvent.blur(champ);
    expect(
      screen.getByRole('textbox', { name: 'Libellé du diagnostic' })
    ).toHaveValue('Hypertension essentielle (primitive)');

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(state().validated[0]).toMatchObject({
      code: 'I10',
      label: 'Hypertension essentielle (primitive)',
    });
  });

  it('choisir un voisin remplit le code et le libellé', async () => {
    useWorkspaceStore.setState({ validated: [] });
    monter();
    const champ = await ouvrir();
    fireEvent.change(champ, { target: { value: 'J44' } });
    fireEvent.click(screen.getByRole('button', { name: /J44\.1/u }));

    expect(champ).toHaveValue('J44.1');
    expect(
      screen.getByRole('textbox', { name: 'Libellé du diagnostic' })
    ).toHaveValue('BPCO avec exacerbation aiguë');
  });
});

describe('annuler / rétablir', () => {
  it('les boutons n’apparaissent qu’après un premier geste', () => {
    monter();
    expect(screen.queryByRole('button', { name: 'Annuler' })).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: 'Retirer' })[0]!);

    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Z'
    );
    expect(screen.getByRole('button', { name: 'Rétablir' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('annule et rétablit, en le disant', () => {
    monter();
    fireEvent.click(screen.getAllByRole('button', { name: 'Retirer' })[1]!);
    expect(codes()).toEqual(['C34.9', 'A00.0']);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
    expect(annonce()).toBe('Annulé : retrait de B01.9.');

    fireEvent.click(screen.getByRole('button', { name: 'Rétablir' }));
    expect(codes()).toEqual(['C34.9', 'A00.0']);
    expect(annonce()).toBe('Rétabli : retrait de B01.9.');
  });

  it('Ctrl+Z hors champ annule, Ctrl+Maj+Z et Ctrl+Y rétablissent', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Descendre C34.9' }));
    expect(codes()).toEqual(['B01.9', 'C34.9', 'A00.0']);

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);

    fireEvent.keyDown(document.body, {
      key: 'Z',
      ctrlKey: true,
      shiftKey: true,
    });
    expect(codes()).toEqual(['B01.9', 'C34.9', 'A00.0']);

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });
    expect(codes()).toEqual(['B01.9', 'C34.9', 'A00.0']);
  });

  it('DANS un champ de saisie, Ctrl+Z reste au navigateur', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Descendre C34.9' }));
    const recherche = screen.getByRole('searchbox', {
      name: 'Chercher un code à ajouter',
    });

    fireEvent.keyDown(recherche, { key: 'z', ctrlKey: true });

    expect(codes()).toEqual(['B01.9', 'C34.9', 'A00.0']);
  });

  it('« Vider la liste » s’annule, et le focus attend sur « Annuler »', async () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: 'Vider la liste' }));

    expect(codes()).toEqual([]);
    expect(annonce()).toMatch(/Liste vidée : 3 diagnostics retirés/u);
    const annuler = screen.getByRole('button', { name: 'Annuler' });
    await waitFor(() => expect(document.activeElement).toBe(annuler));

    fireEvent.click(annuler);
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
  });
});

describe('favoris', () => {
  it('l’étoile bascule, se dit, et le panneau ajoute en un geste', () => {
    useWorkspaceStore.setState({ validated: [] });
    monter();
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Chercher un code à ajouter' }),
      { target: { value: 'diabète' } }
    );
    const ligne = within(
      screen.getByRole('list', { name: 'Résultats de la recherche de codes' })
    )
      .getAllByRole('listitem')
      .find(li => li.textContent?.includes('E11.9'))!;
    const etoile = within(ligne).getByRole('button', { name: 'Favori E11.9' });
    expect(etoile).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(etoile);

    expect(etoile).toHaveAttribute('aria-pressed', 'true');
    expect(annonce()).toBe('E11.9 ajouté aux favoris.');

    const favoris = screen.getByRole('list', { name: 'Codes favoris' });
    fireEvent.click(within(favoris).getByRole('button', { name: 'Ajouter' }));
    expect(codes()).toEqual(['E11.9']);
    // « Déjà retenu » garde le focus : `aria-disabled`, pas `disabled`.
    const deja = within(favoris).getByRole('button', { name: 'Validé' });
    expect(deja).toHaveAttribute('aria-disabled', 'true');
    expect(deja).not.toBeDisabled();
  });

  it('retirer un favori depuis le panneau garde le focus dans la liste', async () => {
    const favori = (code: string) => ({
      code,
      label: `libellé de ${code}`,
      source: 'local' as const,
      addedAt: 1,
    });
    useWorkspaceStore.setState({
      validated: [],
      favorites: [favori('E11.9'), favori('I10')],
    });
    monter();
    const favoris = screen.getByRole('list', { name: 'Codes favoris' });
    const premiere = within(favoris).getByRole('button', {
      name: 'Favori E11.9',
    });
    premiere.focus();

    fireEvent.click(premiere);

    // La ligne disparaît ; le focus passe à l'étoile suivante…
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Favori I10' })
      )
    );
    // …et au sommaire du panneau quand il n'en reste plus.
    fireEvent.click(screen.getByRole('button', { name: 'Favori I10' }));
    await waitFor(() =>
      expect(document.activeElement?.tagName).toBe('SUMMARY')
    );
    expect(state().favorites).toEqual([]);
  });

  it('l’étoile d’un diagnostic retenu garde son référentiel', () => {
    useWorkspaceStore.setState({
      validated: [
        {
          id: 'x',
          code: 'BA00',
          label: 'Hypertension essentielle',
          source: 'api',
          validatedAt: 1,
        },
      ],
    });
    monter();

    fireEvent.click(screen.getByRole('button', { name: 'Favori BA00' }));

    expect(state().favorites).toMatchObject([{ code: 'BA00', source: 'api' }]);
  });
});
