import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { prefetchWhenIdle } from '@mister-guiiug/dev-pwa-config/prefetch';
import { recordError } from '@mister-guiiug/dev-pwa-config/react/observability';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { SessionsPanel } from './SessionsPanel';
import { BoutonDictee } from './BoutonDictee';
import type {
  ControleDictee,
  DictationProps,
  SelectionCompteRendu,
} from './Dictation';
import { useDialog } from '../../hooks/useDialog';
import {
  environnementDuNavigateur,
  type EnvironnementDictee,
} from '../../lib/dictee';
import { estApple, estRaccourciAnalyse } from '../../lib/raccourcis';
import { useI18n } from '../../i18n';

/*
 * LA DICTÉE EST CHARGÉE À LA DEMANDE. Le crochet, l'état affiché, la boîte
 * d'accord et l'insertion au curseur ne servent qu'à qui dicte ; dans le
 * morceau d'entrée, ils pesaient sur le premier affichage de tout le monde et
 * tenaient le préchargé à 0,7 kB de `bundleBudget.preloadGzipKb`. Ils
 * arrivent au repos, après le premier affichage — ou au premier clic, si
 * celui-ci vient avant.
 *
 * `import()` ET NON `lazy()`, pour deux raisons. Un morceau qui ne se charge
 * pas (déploiement entre-temps, réseau coupé avant le précache) ferait lever
 * `lazy()` jusqu'à la frontière d'erreur de l'application : l'écran entier
 * tomberait pour un bouton. Et le composant chargé, gardé dans l'état,
 * remplace la doublure en un seul rendu, sans passage par un repli.
 */
const chargerDictee = () => import('./Dictation');

interface CrPanelProps {
  onAnalyze: () => void;
  /** Injectable pour les tests : la reconnaissance vocale du navigateur sinon. */
  dictationEnvironment?: EnvironnementDictee;
}

export function CrPanel({ onAnalyze, dictationEnvironment }: CrPanelProps) {
  const crText = useWorkspaceStore(s => s.crText);
  const setCrText = useWorkspaceStore(s => s.setCrText);
  const isAnalyzing = useWorkspaceStore(s => s.isAnalyzing);
  const analyzeError = useWorkspaceStore(s => s.analyzeError);
  // Lu dans le magasin, plus reçu en propriété : le motif du repli n'est connu
  // qu'APRÈS la tentative, il ne peut donc plus être calculé par le parent au
  // rendu. Le garde `useActionGuard` a disparu avec le mode OMS seul — le
  // dictionnaire embarqué répond toujours, « Analyser » n'est plus désactivé.
  const analyzeNotice = useWorkspaceStore(s => s.analyzeNotice);
  const resetSession = useWorkspaceStore(s => s.resetSession);
  const highlightedMatchedTerm = useWorkspaceStore(
    s => s.highlightedMatchedTerm
  );
  const dialog = useDialog();
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const apple = useMemo(() => estApple(), []);
  const touches = `${apple ? '⌘' : 'Ctrl'} + ${t('report.enterKey')}`;

  useEffect(() => {
    if (!highlightedMatchedTerm || !textareaRef.current) return;
    const ta = textareaRef.current;
    const idx = ta.value
      .toLowerCase()
      .indexOf(highlightedMatchedTerm.toLowerCase());
    if (idx === -1) return;
    ta.focus();
    ta.setSelectionRange(idx, idx + highlightedMatchedTerm.length);
  }, [highlightedMatchedTerm]);

  // La dernière sélection de la zone de texte : cliquer « Dictée » en sort le
  // focus, et c'est là que la dictée écrira (cf. `Dictation.tsx`).
  const selectionRef = useRef<SelectionCompteRendu | null>(null);
  const memoriserSelection = () => {
    const ta = textareaRef.current;
    if (ta === null) return;
    selectionRef.current = {
      debut: ta.selectionStart,
      fin: ta.selectionEnd,
      texte: ta.value,
    };
  };

  /* ── La dictée : détectée ici, chargée à la demande ─────────────────── */

  const environnement = useMemo(
    () => dictationEnvironment ?? environnementDuNavigateur(),
    [dictationEnvironment]
  );
  const dicteeProposee = environnement.Reconnaissance !== null;
  const [Dictation, setDictation] =
    useState<ComponentType<DictationProps> | null>(null);
  // La doublure a été cliquée : on attend le module pour démarrer.
  const [dicteeDemandee, setDicteeDemandee] = useState(false);
  const [dicteeIndisponible, setDicteeIndisponible] = useState(false);
  const [zoneStatut, setZoneStatut] = useState<HTMLDivElement | null>(null);
  const doublureRef = useRef<HTMLButtonElement | null>(null);
  const demarrerRef = useRef(false);
  const focusRef = useRef(false);
  const controleRef = useRef<ControleDictee | null>(null);

  const monterDictee = useCallback(
    (module: Awaited<ReturnType<typeof chargerDictee>>) => {
      // La doublure va disparaître : si elle a le focus, le vrai bouton le
      // reprendra au montage.
      const doublure = doublureRef.current;
      focusRef.current =
        doublure !== null && document.activeElement === doublure;
      setDictation(() => module.Dictation);
    },
    []
  );

  // Au repos, après le premier affichage : le vrai bouton remplace sa
  // doublure avant qu'on ait besoin de lui. Un échec reste muet ici — le clic
  // retentera, et le dira.
  useEffect(() => {
    if (!dicteeProposee) return;
    let actif = true;
    const annuler = prefetchWhenIdle(() =>
      chargerDictee().then(module => {
        if (actif) monterDictee(module);
      })
    );
    return () => {
      actif = false;
      annuler();
    };
  }, [dicteeProposee, monterDictee]);

  const cliquerDoublure = () => {
    // Second clic pendant le chargement : on renonce, comme pendant la
    // préparation d'une dictée chargée.
    if (dicteeDemandee) {
      demarrerRef.current = false;
      setDicteeDemandee(false);
      return;
    }
    demarrerRef.current = true;
    setDicteeDemandee(true);
    setDicteeIndisponible(false);
    chargerDictee().then(monterDictee, (erreur: unknown) => {
      demarrerRef.current = false;
      setDicteeDemandee(false);
      setDicteeIndisponible(true);
      recordError(erreur, { source: 'dictee', etape: 'chargement' });
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  /*
   * CTRL+ENTRÉE DANS LE COMPTE-RENDU. Le geste de qui vient de taper ou de
   * dicter : pas de détour par la souris ni par six tabulations. Une analyse
   * en cours ne se relance pas ; un texte vide, lui, passe — `onAnalyze` dit
   * pourquoi il n'y a rien à faire, là où le bouton grisé se tait.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!estRaccourciAnalyse(e.nativeEvent)) return;
    e.preventDefault();
    if (!isAnalyzing) onAnalyze();
  };

  // Le patient change : la dictée en cours s'arrête sans rien écrire de plus
  // dans le dossier suivant — et une dictée demandée mais pas encore chargée
  // ne démarre plus.
  const couperDictee = () => {
    demarrerRef.current = false;
    setDicteeDemandee(false);
    controleRef.current?.interrompre();
  };

  const handleNewSession = async () => {
    if (await dialog.confirm(t('report.resetConfirm'))) {
      couperDictee();
      resetSession();
    }
  };

  return (
    <section className="panel panel--cr" aria-labelledby="cr-label">
      <div className="panel-head">
        <h2 id="cr-label" className="panel-title">
          <svg
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm1 2v1h6V4H5zm0 2.5v1h6v-1H5zm0 2.5v1h4v-1H5z" />
          </svg>
          <span className="panel-title-text">{t('report.title')}</span>
        </h2>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="cr"
          name="cr"
          placeholder={t('report.placeholder')}
          aria-label={t('report.ariaLabel')}
          aria-describedby="cr-raccourci"
          value={crText}
          onChange={e => setCrText(e.target.value)}
          onKeyDown={handleKeyDown}
          onSelect={memoriserSelection}
          onBlur={memoriserSelection}
        />
        {/* La phrase entière pour qui écoute ; l'œil, lui, a la touche à côté
            du bouton. */}
        <span id="cr-raccourci" className="visually-hidden">
          {t('report.shortcutDescription', { touches })}
        </span>
        <div className="toolbar">
          <button
            type="submit"
            className="primary"
            disabled={isAnalyzing || !crText.trim()}
            aria-keyshortcuts={apple ? 'Meta+Enter' : 'Control+Enter'}
          >
            {isAnalyzing ? t('report.analyzing') : t('common.analyze')}
          </button>
          <span className="kbd-hint" aria-hidden="true">
            <kbd>{apple ? '⌘' : 'Ctrl'}</kbd>+<kbd>{t('report.enterKey')}</kbd>
          </span>
          {/* RIEN quand l'API manque (Firefox, par exemple) : un bouton qui ne
              peut que répondre « indisponible » encombre la barre pour tout le
              monde, et le micro du clavier mobile reste là. */}
          {dicteeProposee &&
            (Dictation !== null ? (
              <Dictation
                environnement={environnement}
                textareaRef={textareaRef}
                selectionRef={selectionRef}
                zoneStatut={zoneStatut}
                controleRef={controleRef}
                demarrerRef={demarrerRef}
                focusRef={focusRef}
              />
            ) : (
              <BoutonDictee
                ref={doublureRef}
                actif={dicteeDemandee}
                ecoute={false}
                onClick={cliquerDoublure}
              />
            ))}
          <button
            type="button"
            className="secondary"
            onClick={() => setCrText('')}
            disabled={!crText}
          >
            {t('report.clear')}
          </button>
          <button type="button" className="ghost" onClick={handleNewSession}>
            {t('report.newSession')}
          </button>
        </div>
      </form>
      {dicteeProposee && (
        <>
          {Dictation === null && dicteeDemandee && (
            <p className="hint dictation-status">{t('dictation.preparing')}</p>
          )}
          {dicteeIndisponible && (
            <p className="hint error" role="alert">
              {t('common.moduleUnavailable')}
            </p>
          )}
          {/* L'état de la dictée chargée s'affiche ICI, sous le formulaire, par
              un portail : là où il était quand la dictée faisait partie du
              morceau d'entrée. */}
          <div ref={setZoneStatut} />
        </>
      )}
      <p className="hint">{t('report.dictationHint')}</p>
      {analyzeNotice && (
        <p className="hint offline" role="status">
          {analyzeNotice}
        </p>
      )}
      {analyzeError && (
        <p className="hint error" role="alert">
          {analyzeError}
        </p>
      )}
      {/* Les dossiers enregistrés sont ici, sous le compte-rendu : c'est ce
          texte-là qu'on met de côté et qu'on rouvre. Repliés par défaut — la
          journée type n'en ouvre aucun, et « Analyser » ne doit pas descendre
          d'un écran pour autant. */}
      <SessionsPanel onBeforeOpen={couperDictee} />
    </section>
  );
}
