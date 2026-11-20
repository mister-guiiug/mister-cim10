import { useMemo, useRef, type KeyboardEvent } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useVueStore, type Vue } from '../../store/vueStore';
import { useI18n } from '../../i18n';
import { suggestionsATrancher } from './aTrancher';
import { regionsEnOnglets, vueAffichee, type Disposition } from './disposition';

/**
 * LES ÉTAPES DE LA COTATION, EN ONGLETS, quand l'écran ne montre pas les trois
 * régions à la fois. Jusqu'au 20/11/2026, le téléphone empilait tout : après
 * une analyse, la page faisait 4 239 px et « Copier pour DPI » était à cinq
 * écrans du compte-rendu. Chaque onglet porte son compte, et l'analyse ouvre
 * les suggestions d'elle-même.
 *
 * Le motif ARIA des onglets : flèches gauche/droite, Début/Fin, un seul onglet
 * dans l'ordre de tabulation (le choisi).
 */
export function WorkspaceTabs({ disposition }: { disposition: Disposition }) {
  const { t } = useI18n();
  const vue = useVueStore(s => s.vue);
  const setVue = useVueStore(s => s.setVue);
  const suggestions = useWorkspaceStore(s => s.suggestions);
  const rejectedIds = useWorkspaceStore(s => s.rejectedIds);
  const validated = useWorkspaceStore(s => s.validated);
  const minConfidence = useSettingsStore(s => s.minConfidence);
  const boutons = useRef<Partial<Record<Vue, HTMLButtonElement | null>>>({});

  const aTrancher = useMemo(
    () =>
      suggestionsATrancher(
        suggestions,
        rejectedIds,
        new Set(validated.map(v => v.code)),
        minConfidence
      ).length,
    [suggestions, rejectedIds, validated, minConfidence]
  );

  const regions = regionsEnOnglets(disposition);
  if (regions.length === 0) return null;
  const choisie = vueAffichee(disposition, vue);

  const libelles: Record<Vue, string> = {
    cr: t('workspace.tabCr'),
    suggestions: t('workspace.tabSuggestions'),
    retenus: t('workspace.tabRetenus'),
  };
  const comptes: Record<Vue, number | null> = {
    cr: null,
    suggestions: suggestions.length > 0 ? aTrancher : null,
    retenus: validated.length > 0 ? validated.length : null,
  };

  const choisir = (region: Vue) => {
    setVue(region);
    boutons.current[region]?.focus();
  };

  const auClavier = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = regions.indexOf(choisie);
    const cible =
      e.key === 'ArrowRight'
        ? regions[(i + 1) % regions.length]
        : e.key === 'ArrowLeft'
          ? regions[(i - 1 + regions.length) % regions.length]
          : e.key === 'Home'
            ? regions[0]
            : e.key === 'End'
              ? regions[regions.length - 1]
              : undefined;
    if (!cible) return;
    e.preventDefault();
    choisir(cible);
  };

  return (
    <div
      className="workspace-tabs"
      role="tablist"
      aria-label={t('workspace.tabsLabel')}
    >
      {regions.map((region, index) => {
        const actif = region === choisie;
        const compte = comptes[region];
        return (
          <button
            key={region}
            ref={el => {
              boutons.current[region] = el;
            }}
            type="button"
            role="tab"
            id={`onglet-${region}`}
            aria-controls={`region-${region}`}
            aria-selected={actif}
            tabIndex={actif ? 0 : -1}
            className="workspace-tab"
            onClick={() => setVue(region)}
            onKeyDown={auClavier}
          >
            <span className="workspace-tab-step" aria-hidden="true">
              {index + 1}
            </span>
            <span className="workspace-tab-label">{libelles[region]}</span>
            {compte !== null && (
              <span className="workspace-tab-count">{compte}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
