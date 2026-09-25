import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getFamily } from '../../lib/icd-hierarchy';
import { useI18n } from '../../i18n';
import { FavoriteToggle } from './FavoriteToggle';
import type { AnalysisResult, ICD10Code } from '../../types/index';

type ConfidenceLevel = 'high' | 'medium' | 'low';

function confidenceLevel(c: number): ConfidenceLevel {
  if (c >= 0.8) return 'high';
  if (c >= 0.5) return 'medium';
  return 'low';
}

/**
 * UN TERME REPÉRÉ, UNE CARTE.
 *
 * Relevé en production le 17/09/2026 : sur « BPCO avec exacerbation », l'app
 * proposait `J44.1` ET `J44.9` — deux cartes, MÊME terme repéré (`bpco`), MÊME
 * confiance (61 %). Ce n'étaient pas deux suggestions concurrentes à départager
 * mais un code et sa précision, présentés comme un choix dont rien n'aidait à
 * sortir. On les réunit : le mieux classé porte la carte, les autres sont ses
 * précisions, et le lien entre eux devient visible.
 *
 * ATTENTION À CE QUE ÇA NE RÈGLE PAS. `E11.9` (« diabete type 2 ») et `E10.9`
 * (« diabete type 1 ») sortent à égalité sur un texte qui dit « type 2 », mais
 * leurs termes DIFFÈRENT : c'est un faux positif du moteur, pas un doublon
 * d'affichage. Les regrouper ici le masquerait au lieu de le corriger.
 */
function groupeParTerme(liste: AnalysisResult[]): AnalysisResult[][] {
  const parTerme = new Map<string, AnalysisResult[]>();
  for (const s of liste) {
    // Une suggestion sans terme repéré reste seule : sa clé est son identité. Le
    // préfixe est un NUL ÉCHAPPÉ, pas tapé : écrit en clair dans le source, il
    // faisait classer le fichier BINAIRE par git, et toute modification de ce
    // composant arrivait en « Bin 19147 -> 19852 bytes » dans les revues.
    const cle = s.matchedTerm?.trim().toLowerCase() || `\u0000${s.id}`;
    const groupe = parTerme.get(cle);
    if (groupe) groupe.push(s);
    else parTerme.set(cle, [s]);
  }
  // `liste` arrive triée par confiance : l'ordre d'insertion la conserve.
  return [...parTerme.values()];
}

export function SuggestionsPanel() {
  const suggestions = useWorkspaceStore(s => s.suggestions);
  const validated = useWorkspaceStore(s => s.validated);
  const rejectedIds = useWorkspaceStore(s => s.rejectedIds);
  const filterText = useWorkspaceStore(s => s.filterText);
  const setFilterText = useWorkspaceStore(s => s.setFilterText);
  const validate = useWorkspaceStore(s => s.validateSuggestion);
  const reject = useWorkspaceStore(s => s.rejectSuggestion);
  const validateAll = useWorkspaceStore(s => s.validateAll);
  const rejectAll = useWorkspaceStore(s => s.rejectAll);
  const setHighlightedMatchedTerm = useWorkspaceStore(
    s => s.setHighlightedMatchedTerm
  );
  const addManualDiagnostic = useWorkspaceStore(s => s.addManualDiagnostic);
  const isAnalyzing = useWorkspaceStore(s => s.isAnalyzing);
  const minConfidence = useSettingsStore(s => s.minConfidence);
  const { t } = useI18n();

  const validatedCodes = useMemo(
    () => new Set(validated.map(v => v.code)),
    [validated]
  );

  const visible = useMemo(() => {
    const f = filterText.trim().toLowerCase();
    return suggestions.filter(s => {
      if (rejectedIds.has(s.id)) return false;
      if (validatedCodes.has(s.code)) return false;
      if (s.confidence < minConfidence) return false;
      if (!f) return true;
      return (
        s.code.toLowerCase().includes(f) ||
        s.label.toLowerCase().includes(f) ||
        s.matchedTerm.toLowerCase().includes(f)
      );
    });
  }, [suggestions, rejectedIds, validatedCodes, filterText, minConfidence]);

  const groupes = useMemo(() => groupeParTerme(visible), [visible]);

  const hasSuggestions = suggestions.length > 0;
  const pristine = !hasSuggestions && !isAnalyzing;

  /*
   * ENCHAÎNER AU CLAVIER, ce que l'app interdisait.
   *
   * Mesuré en production le 17/09/2026 : après un « Valider », le focus
   * retombait sur `BODY`. Il fallait alors DOUZE tabulations pour revenir au
   * « Valider » suivant, parmi soixante éléments focusables — sur neuf codes à
   * trancher, l'outil était inutilisable sans souris.
   *
   * La carte traitée disparaît de la liste : l'index qu'elle occupait est donc
   * celui de la SUIVANTE après le rendu. On y va, et s'il n'y a plus rien on
   * replie sur le panneau — voir le détail dans `suivreLeFocus`.
   */
  const listeRef = useRef<HTMLUListElement | null>(null);
  const panneauRef = useRef<HTMLElement | null>(null);
  const [annonce, setAnnonce] = useState('');
  const [aFocaliser, setAFocaliser] = useState<number | null>(null);

  /*
   * LE FOCUS SE POSE APRÈS LE RENDU, ET C'EST `useEffect` QUI LE SAIT.
   *
   * Première version : `requestAnimationFrame`. Elle passait les tests et
   * ÉCHOUAIT dans un vrai navigateur — mesuré le 17/09/2026 sur le serveur de
   * préversion, le focus repartait au corps malgré le correctif. La frame
   * s'exécute avant que React ait validé son rendu : on focalisait le bouton
   * juste avant qu'il soit retiré du document, ce qui ne focalise rien. En
   * jsdom, `rAF` est un `setTimeout` qui tombe APRÈS le commit — d'où des
   * tests verts sur un code faux.
   *
   * `useEffect` s'exécute après le commit, par construction. Il n'y a plus de
   * course à gagner.
   */
  useEffect(() => {
    if (aFocaliser === null) return;
    // CE `setState` EST LA CONSOMMATION D'UN SIGNAL, pas un calcul dérivé : on
    // éteint la demande pour ne pas la rejouer au rendu suivant. La règle le
    // signale parce qu'un état posé depuis un effet cascade en général ; ici
    // il en SORT un, et la cascade s'arrête à `null`.
    //
    // La réécriture évidente — un `ref` au lieu d'un état — ne tient pas : un
    // `ref` ne déclenche pas l'effet, et c'est précisément l'ordre qui compte
    // (cf. le commentaire ci-dessus : `rAF` échouait EN NAVIGATEUR pendant que
    // les tests passaient). On ne remanie pas ce mécanisme pour une heuristique.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAFocaliser(null);
    const boutons = listeRef.current?.querySelectorAll<HTMLButtonElement>(
      '[data-role="valider-principal"]'
    );
    const cible = boutons?.[Math.min(aFocaliser, boutons.length - 1)];
    if (cible) {
      cible.focus();
      return;
    }
    /*
     * PLUS RIEN À TRANCHER : on replie sur le panneau, pas sur la barre
     * d'actions groupées — ses boutons sont DÉSACTIVÉS quand la liste est
     * vide, et un bouton désactivé ne prend pas le focus.
     */
    panneauRef.current?.focus();
  }, [aFocaliser, groupes]);

  const suivreLeFocus = useCallback((index: number) => {
    setAFocaliser(index);
  }, []);

  return (
    <section
      className={`panel panel--suggestions ${pristine ? 'is-pristine' : 'is-active'}`}
      aria-labelledby="sug-label"
      ref={panneauRef}
      // Focalisable par programme seulement : c'est le repli quand il ne reste
      // plus rien à trancher, pour que le focus atterrisse sur quelque chose
      // qui se nomme plutôt que sur le corps du document.
      tabIndex={-1}
    >
      <div className="panel-head">
        <h2 id="sug-label" className="panel-title">
          <svg
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 1a5 5 0 0 0-2.5 9.33V12h5v-1.67A5 5 0 0 0 8 1zM6.5 13v1.5h3V13h-3z" />
          </svg>
          <span className="panel-title-text">{t('results.title')}</span>
          {hasSuggestions && (
            <span className="panel-count" aria-hidden="true">
              {visible.length}
            </span>
          )}
        </h2>
      </div>
      {hasSuggestions && (
        <>
          <div className="suggestion-filter-row">
            <input
              type="search"
              className="suggestion-filter-inp"
              placeholder={t('results.filterPlaceholder')}
              aria-label={t('results.filterAria')}
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
            />
            <button
              type="button"
              className="ghost"
              onClick={() => setFilterText('')}
              disabled={!filterText}
            >
              {t('results.clearFilter')}
            </button>
          </div>
          <div className="toolbar suggestion-bulk-toolbar">
            <button
              type="button"
              className="secondary"
              onClick={() => validateAll(visible)}
              disabled={visible.length === 0}
            >
              {t('results.validateFiltered')}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => rejectAll(visible.map(v => v.id))}
              disabled={visible.length === 0}
            >
              {t('results.rejectFiltered')}
            </button>
            <span className="hint suggestion-filter-count">
              {visible.length > 1
                ? t('results.shownMany', { count: visible.length })
                : t('results.shownOne', { count: visible.length })}
            </span>
          </div>
        </>
      )}
      {/* CE QUI SE PASSE EN BAS, DIT EN HAUT. « Diagnostics retenus » commence
          1 834 px sous les suggestions sur desktop, et 1 150 px SOUS le bas de
          l'écran sur mobile : valider un code n'avait aucun effet visible.
          Ce rappel est là où le regard travaille. Sur grand écran les deux
          colonnes se voient, il s'efface. */}
      {validated.length > 0 && (
        <div className="retenus-rappel">
          <span className="retenus-rappel-compte">
            {validated.length > 1
              ? t('results.retainedMany', { count: validated.length })
              : t('results.retainedOne', { count: validated.length })}
          </span>
          <button
            type="button"
            className="ghost"
            onClick={() =>
              document
                .getElementById('val-label')
                ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
            }
          >
            {t('results.retainedSee')}
          </button>
        </div>
      )}
      {/* L'ACTION EST ANNONCÉE : la carte disparaît de la liste et sa
          destination est hors champ — sans ça, un lecteur d'écran ne sait pas
          que quelque chose a eu lieu. */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {annonce}
      </p>
      <div className="suggestions-root">
        {visible.length === 0 ? (
          isAnalyzing ? (
            <p className="empty empty--analyzing">
              <span className="analyzing-spinner" aria-hidden="true" />
              {t('results.analyzing')}
            </p>
          ) : (
            <p className="empty">
              {suggestions.length === 0
                ? t('results.emptyPristine')
                : t('results.emptyFiltered')}
            </p>
          )
        ) : (
          <ul className="suggestion-list" role="list" ref={listeRef}>
            {groupes.map((groupe, index) => (
              <SuggestionCard
                key={groupe[0]!.id}
                groupe={groupe}
                validatedCodes={validatedCodes}
                onValidate={s => {
                  validate(s);
                  setAnnonce(t('results.announceValidated', { code: s.code }));
                  suivreLeFocus(index);
                }}
                onReject={s => {
                  reject(s.id);
                  setAnnonce(t('results.announceRejected', { code: s.code }));
                  suivreLeFocus(index);
                }}
                onHighlight={s => setHighlightedMatchedTerm(s.matchedTerm)}
                onValidateRelated={(code, label) =>
                  addManualDiagnostic(code, label)
                }
                onAnnounce={setAnnonce}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

interface SuggestionCardProps {
  /** Le mieux classé en tête ; les suivants sont ses précisions. */
  groupe: AnalysisResult[];
  validatedCodes: Set<string>;
  onValidate: (s: AnalysisResult) => void;
  onReject: (s: AnalysisResult) => void;
  onHighlight: (s: AnalysisResult) => void;
  onValidateRelated: (code: string, label: string) => void;
  /** La région d'annonce du panneau, que l'étoile partage. */
  onAnnounce: (message: string) => void;
}

function SuggestionCard({
  groupe,
  validatedCodes,
  onValidate,
  onReject,
  onHighlight,
  onValidateRelated,
  onAnnounce,
}: SuggestionCardProps) {
  const { t } = useI18n();
  const suggestion = groupe[0]!;
  const precisions = groupe.slice(1);
  const [comparing, setComparing] = useState(false);
  /*
   * LA FAMILLE EST CALCULÉE D'EMBLÉE, pour savoir s'il y a un bouton à
   * proposer. Elle ne l'était qu'au clic, et le bouton était donc offert sur
   * TOUTES les cartes : mesuré en production le 17/09/2026 sur sept
   * suggestions, « Aucun code apparenté dans le référentiel embarqué » six
   * fois sur sept. Un bouton qui déçoit six fois sur sept apprend à ne plus
   * être cliqué — et fait douter des fois où il aurait servi.
   *
   * Le coût est une recherche par carte dans un référentiel de 147 entrées,
   * mémorisée sur le code : moins cher qu'une déception.
   */
  const family = useMemo(() => getFamily(suggestion.code), [suggestion.code]);
  const hasFamily =
    family !== null && (family.parent !== null || family.siblings.length > 0);
  const pct = Math.round(suggestion.confidence * 100);
  const level = confidenceLevel(suggestion.confidence);
  const levelLabel = t(`results.confidence.${level}`);

  return (
    <li className="suggestion-card" role="listitem">
      <div className="suggestion-card-head">
        <strong className="suggestion-code">{suggestion.code}</strong>
        <span
          className={`source-badge source-badge--${suggestion.source ?? 'local'}`}
          title={
            suggestion.source === 'api'
              ? t('results.sourceApiTitle')
              : t('results.sourceLocalTitle')
          }
        >
          {suggestion.source === 'api'
            ? t('results.badgeIcd11')
            : t('results.badgeIcd10')}
        </span>
        <FavoriteToggle
          code={suggestion.code}
          label={suggestion.label}
          source={suggestion.source ?? 'local'}
          onAnnounce={onAnnounce}
        />
      </div>
      <p className="suggestion-label">{suggestion.label}</p>
      <div className={`confidence-meter is-${level}`}>
        <span
          className="confidence-meter-track"
          role="img"
          aria-label={t('results.confidenceAria', {
            level: levelLabel.toLowerCase(),
            pct,
          })}
        >
          <span
            className="confidence-meter-fill"
            style={{ width: `${pct}%` }}
          />
        </span>
        <span className="confidence-meter-readout">
          <span className="confidence-meter-level">{levelLabel}</span>
          <span className="confidence-meter-pct">{pct} %</span>
        </span>
      </div>
      {suggestion.matchedTerm && (
        <p className="suggestion-term">
          {t('results.matchedTerm')}{' '}
          <button
            type="button"
            className="suggestion-term-link"
            onClick={() => onHighlight(suggestion)}
            title={t('results.matchedTermTitle')}
          >
            {suggestion.matchedTerm}
          </button>
        </p>
      )}
      {/* LES PRÉCISIONS DU MÊME TERME, sous le code qui les porte. Deux cartes
          côte à côte à la même confiance ne disaient pas laquelle choisir ;
          ici la hiérarchie est lisible, et chacune se valide d'un clic. */}
      {precisions.length > 0 && (
        <div className="suggestion-precisions">
          <p className="suggestion-precisions-titre">
            {t('results.precisionsTitle', { terme: suggestion.matchedTerm })}
          </p>
          <ul role="list">
            {precisions.map(p => (
              <li key={p.id}>
                <span className="suggestion-precision-code">{p.code}</span>
                <span className="suggestion-precision-label">{p.label}</span>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => onValidate(p)}
                  title={t('results.validateCodeTitle')}
                >
                  {t('common.validate')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="toolbar">
        <button
          type="button"
          className="primary"
          data-role="valider-principal"
          onClick={() => onValidate(suggestion)}
        >
          {t('common.validate')}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => onReject(suggestion)}
        >
          {t('common.reject')}
        </button>
        {hasFamily && (
          <button
            type="button"
            className="ghost"
            onClick={() => setComparing(v => !v)}
            aria-expanded={comparing}
            aria-controls={`compare-${suggestion.id}`}
            title={t('results.compareTitle')}
          >
            {comparing ? t('common.close') : t('results.compare')}
          </button>
        )}
      </div>
      {comparing && family && (
        <CompareFamily
          id={`compare-${suggestion.id}`}
          family={family}
          validatedCodes={validatedCodes}
          onValidate={onValidateRelated}
        />
      )}
    </li>
  );
}

interface CompareFamilyProps {
  id: string;
  family: { parent: ICD10Code | null; siblings: ICD10Code[] };
  validatedCodes: Set<string>;
  onValidate: (code: string, label: string) => void;
}

/**
 * Le panneau n'existe plus que s'il a quelque chose à montrer : le bouton qui
 * l'ouvre n'est rendu que dans ce cas. La branche « aucun code apparenté »
 * était devenue inatteignable — on la retire plutôt que de la laisser
 * suggérer un cas qui ne peut plus se produire.
 */
function CompareFamily({
  id,
  family,
  validatedCodes,
  onValidate,
}: CompareFamilyProps) {
  return (
    <div id={id} className="suggestion-compare-panel">
      {family.parent && (
        <CompareRow
          entry={family.parent}
          variant="parent"
          alreadyValidated={validatedCodes.has(family.parent.code)}
          onValidate={onValidate}
        />
      )}
      {family.siblings.length > 0 && (
        <ul className="suggestion-compare-siblings" role="list">
          {family.siblings.map(sib => (
            <li key={sib.code}>
              <CompareRow
                entry={sib}
                variant="sibling"
                alreadyValidated={validatedCodes.has(sib.code)}
                onValidate={onValidate}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CompareRowProps {
  entry: ICD10Code;
  variant: 'parent' | 'sibling';
  alreadyValidated: boolean;
  onValidate: (code: string, label: string) => void;
}

function CompareRow({
  entry,
  variant,
  alreadyValidated,
  onValidate,
}: CompareRowProps) {
  const { t } = useI18n();
  return (
    <div
      className={`suggestion-compare-row suggestion-compare-row--${variant}`}
    >
      <span className="suggestion-compare-tag">
        {variant === 'parent' ? t('results.parent') : t('results.related')}
      </span>
      <strong className="suggestion-compare-code">{entry.code}</strong>
      <span className="suggestion-compare-label">{entry.label}</span>
      <button
        type="button"
        className="ghost"
        onClick={() => onValidate(entry.code, entry.label)}
        disabled={alreadyValidated}
        title={
          alreadyValidated
            ? t('results.alreadyValidatedTitle')
            : t('results.validateCodeTitle')
        }
      >
        {alreadyValidated ? t('common.validated') : t('common.validate')}
      </button>
    </div>
  );
}
