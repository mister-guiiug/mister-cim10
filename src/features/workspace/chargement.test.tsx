import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncerProvider } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../../i18n';
import { SocleLabelsBridge } from '../../components/SocleLabelsBridge';
import { DialogProvider } from '../../components/DialogProvider';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { refreshSnapshot } from '../../lib/app-store';
import { historiqueVide } from '../../lib/historique';
import type { ConstructeurReconnaissance } from '../../lib/dictee';
import { CrPanel } from './CrPanel';
import { ValidatedPanel } from './ValidatedPanel';

/**
 * UN MORCEAU QUI NE VIENT PAS NE FAIT PAS TOMBER L'ÉCRAN.
 *
 * La dictée et le formulaire de saisie sont chargés à la demande. Entre deux
 * déploiements, ou réseau coupé avant que le service worker ait tout mis en
 * cache, leur morceau peut manquer. `lazy()` aurait alors relancé l'erreur
 * jusqu'à la frontière d'erreur de l'application — la page de secours à la
 * place de l'outil, pour un bouton. Ici, les deux modules LÈVENT à l'import.
 */
vi.mock('./Dictation', () => {
  throw new Error('morceau introuvable');
});
vi.mock('./CodeEntryForm', () => {
  throw new Error('morceau introuvable');
});

class FauxMicro {
  start() {}
  stop() {}
  abort() {}
}

function monter(enfant: React.ReactNode) {
  render(
    <MemoryRouter>
      <I18nProvider>
        <SocleLabelsBridge>
          <AnnouncerProvider>
            <DialogProvider>{enfant}</DialogProvider>
          </AnnouncerProvider>
        </SocleLabelsBridge>
      </I18nProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  refreshSnapshot();
  useWorkspaceStore.setState({
    crText: 'Patient HTA',
    validated: [],
    favorites: [],
    historique: historiqueVide(),
  });
});

describe('chargement à la demande qui échoue', () => {
  it('la dictée le dit, et le compte-rendu reste là', async () => {
    monter(
      <CrPanel
        onAnalyze={vi.fn()}
        dictationEnvironment={{
          Reconnaissance: FauxMicro as unknown as ConstructeurReconnaissance,
          enLigne: () => true,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dictée' }));

    expect(
      await screen.findByText(/Cette fonction n’a pas pu se charger/u)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dictée' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(
      screen.getByRole('textbox', { name: 'Texte du compte-rendu' })
    ).toHaveValue('Patient HTA');
  });

  it('le formulaire le dit, et se referme', async () => {
    monter(<ValidatedPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: /ajouter un code manuellement/iu })
    );

    expect(
      await screen.findByText(/Cette fonction n’a pas pu se charger/u)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(
      screen.getByRole('button', { name: /ajouter un code manuellement/iu })
    ).toBeInTheDocument();
  });
});
