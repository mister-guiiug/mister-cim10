import { useEffect, useRef } from 'react';
import { useAnnouncer } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { MAX_FAVORIS } from '../../lib/favoris';
import { FavoriteToggle } from './FavoriteToggle';
import { useI18n } from '../../i18n';

interface FavoritesPanelProps {
  existingCodes: Set<string>;
}

/**
 * Les favoris, à un geste des diagnostics retenus.
 *
 * REPLIÉ PAR DÉFAUT, comme les dossiers enregistrés : cent codes dépliés
 * pousseraient la recherche et l'export un écran plus bas. Une fois ouvert, il
 * le reste pendant la séance — c'est de là qu'on ajoute, code après code.
 *
 * « DÉJÀ RETENU » NE DÉSACTIVE PAS LE BOUTON. Il passe en `aria-disabled` :
 * un bouton `disabled` perd le focus sous le doigt qui vient de l'actionner,
 * et le suivant au clavier repartirait du haut de la page. Actionné, il dit
 * que le code y est déjà.
 */
export function FavoritesPanel({ existingCodes }: FavoritesPanelProps) {
  const favorites = useWorkspaceStore(s => s.favorites);
  const addManualDiagnostic = useWorkspaceStore(s => s.addManualDiagnostic);
  const annoncer = useAnnouncer();
  const { t } = useI18n();
  const listeRef = useRef<HTMLUListElement | null>(null);
  const sommaireRef = useRef<HTMLElement | null>(null);
  /** Le rang de la ligne dont on vient de retirer l'étoile. */
  const retireA = useRef<number | null>(null);

  // RETIRER UN FAVORI D'ICI FAIT DISPARAÎTRE SA LIGNE, et l'étoile qui avait le
  // focus avec elle. Le focus passe à l'étoile suivante — la précédente pour
  // la dernière —, et au sommaire quand il n'en reste aucune : on peut
  // désherber la liste au clavier sans repartir du haut de la page.
  useEffect(() => {
    const rang = retireA.current;
    if (rang === null) return;
    retireA.current = null;
    const etoiles =
      listeRef.current?.querySelectorAll<HTMLButtonElement>('.star-toggle');
    const cible = etoiles?.[Math.min(rang, etoiles.length - 1)];
    if (cible) cible.focus();
    else sommaireRef.current?.focus();
  }, [favorites]);

  return (
    <details className="favorites-block">
      <summary className="sessions-summary" ref={sommaireRef}>
        <span className="sessions-summary-title">{t('favorites.title')}</span>
        <span className="sessions-summary-hint">
          {favorites.length > 1
            ? t('favorites.countMany', { count: favorites.length })
            : t('favorites.countOne', { count: favorites.length })}
        </span>
      </summary>
      <div className="favorites-body">
        {favorites.length === 0 ? (
          <p className="sessions-empty">{t('favorites.empty')}</p>
        ) : (
          <ul
            className="suggestion-compare-siblings favorites-list"
            role="list"
            aria-label={t('favorites.listAria')}
            ref={listeRef}
          >
            {favorites.map((f, rang) => {
              const deja = existingCodes.has(f.code);
              return (
                <li key={f.code}>
                  <div className="suggestion-compare-row suggestion-compare-row--sibling">
                    <span
                      className={`source-badge source-badge--${f.source}`}
                      title={
                        f.source === 'api'
                          ? t('results.sourceApiTitle')
                          : t('results.sourceLocalTitle')
                      }
                    >
                      {f.source === 'api'
                        ? t('results.badgeIcd11')
                        : t('results.badgeIcd10')}
                    </span>
                    <strong className="suggestion-compare-code">
                      {f.code}
                    </strong>
                    <span className="suggestion-compare-label">{f.label}</span>
                    <span className="row-actions">
                      <FavoriteToggle
                        code={f.code}
                        label={f.label}
                        source={f.source}
                        onToggled={resultat => {
                          if (resultat === 'retire') retireA.current = rang;
                        }}
                      />
                      <button
                        type="button"
                        className="ghost"
                        aria-disabled={deja || undefined}
                        title={
                          deja
                            ? t('results.alreadyValidatedTitle')
                            : t('favorites.addTitle')
                        }
                        onClick={() => {
                          if (deja) {
                            annoncer(
                              t('favorites.alreadyValidated', { code: f.code })
                            );
                            return;
                          }
                          addManualDiagnostic(f.code, f.label, f.source);
                          annoncer(
                            t('favorites.addedToValidated', { code: f.code })
                          );
                        }}
                      >
                        {deja ? t('common.validated') : t('common.add')}
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {favorites.length >= MAX_FAVORIS && (
          <p className="hint">{t('favorites.full', { max: MAX_FAVORIS })}</p>
        )}
      </div>
    </details>
  );
}
