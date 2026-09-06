import { useMemo, useState } from 'react';
import { searchIcdCodes } from '../../lib/analyzer';
import { useI18n } from '../../i18n';

/**
 * Chercher un code par son libellé — et l'ajouter aux diagnostics retenus.
 *
 * CE QUI MANQUAIT. L'écran n'avait qu'un champ de recherche, et il filtrait les
 * suggestions DÉJÀ calculées à partir du compte-rendu. Un terme absent du
 * compte-rendu — une comorbidité connue, un antécédent formulé autrement — était
 * donc introuvable : il fallait connaître le code par cœur et le saisir à la
 * main avec son libellé. C'est le premier geste qu'un professionnel attend d'un
 * outil de cotation, et c'était le seul que l'app ne savait pas faire.
 *
 * Le moteur est celui de `lib/analyzer.ts`, appelé dans l'autre sens (voir
 * `fuzzyTermMatch`) : rien de nouveau n'a été écrit pour comparer deux termes.
 */

/** Au-delà, la liste devient une page à faire défiler, pas une réponse. */
const MAX_RESULTS = 12;

interface CodeSearchProps {
  onAdd: (code: string, label: string) => void;
  existingCodes: Set<string>;
}

export function CodeSearch({ onAdd, existingCodes }: CodeSearchProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const results = useMemo(
    () => (trimmed.length >= 2 ? searchIcdCodes(trimmed, MAX_RESULTS) : []),
    [trimmed]
  );
  const searching = trimmed.length >= 2;

  return (
    <section className="code-search" aria-labelledby="code-search-label">
      <p className="code-search-title" id="code-search-label">
        {t('search.title')}
      </p>
      <div className="suggestion-filter-row">
        <input
          type="search"
          className="suggestion-filter-inp"
          placeholder={t('search.placeholder')}
          aria-label={t('search.aria')}
          aria-describedby="code-search-hint"
          value={query}
          onChange={e => setQuery(e.target.value)}
          spellCheck={false}
        />
        <button
          type="button"
          className="ghost"
          onClick={() => setQuery('')}
          disabled={!query}
        >
          {t('search.clear')}
        </button>
      </div>
      <p className="hint code-search-hint" id="code-search-hint">
        {t('search.hint')}
      </p>
      {searching &&
        (results.length === 0 ? (
          <p className="suggestion-compare-empty" role="status">
            {t('search.empty', { query: trimmed })}
          </p>
        ) : (
          <>
            <p className="hint code-search-count" role="status">
              {results.length > 1
                ? t('search.resultsMany', { count: results.length })
                : t('search.resultsOne', { count: results.length })}
            </p>
            <ul
              className="suggestion-compare-siblings"
              aria-label={t('search.resultsAria')}
            >
              {results.map(hit => {
                const already = existingCodes.has(hit.code);
                return (
                  <li key={hit.code}>
                    <div className="suggestion-compare-row suggestion-compare-row--sibling">
                      <span className="suggestion-compare-tag">
                        {hit.fuzzy ? t('search.approx') : t('search.exact')}
                      </span>
                      <strong className="suggestion-compare-code">
                        {hit.code}
                      </strong>
                      <span className="suggestion-compare-label">
                        {hit.label}
                      </span>
                      <button
                        type="button"
                        className="ghost"
                        disabled={already}
                        onClick={() => onAdd(hit.code, hit.label)}
                        title={
                          already
                            ? t('results.alreadyValidatedTitle')
                            : t('results.validateCodeTitle')
                        }
                      >
                        {already ? t('common.validated') : t('common.add')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ))}
    </section>
  );
}
