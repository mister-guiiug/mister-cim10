import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { useAnnouncer } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { useIdlePrefetch } from '@mister-guiiug/dev-pwa-config/react/use-prefetch';
import { recordError } from '@mister-guiiug/dev-pwa-config/react/observability';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { CodeSearch } from './CodeSearch';
import { ExportBar } from './ExportBar';
import { FavoritesPanel } from './FavoritesPanel';
import { FavoriteToggle } from './FavoriteToggle';
import type { CodeEntryFormProps, SaisieCode } from './CodeEntryForm';
import { decrireOperation } from './operations';
import {
  actionHistorique,
  estApple,
  estChampEditable,
} from '../../lib/raccourcis';
import { useI18n } from '../../i18n';
import type { ValidatedDiagnostic } from '../../types/index';

/*
 * LE FORMULAIRE DE SAISIE EST CHARGÉ À LA DEMANDE. Il ne sert qu'après un clic
 * — « Ajouter un code manuellement », « Modifier » — et il emporte le contrôle
 * de forme avec lui. Dans le morceau d'entrée, il faisait passer le préchargé
 * au-dessus de `bundleBudget.preloadGzipKb` : chaque visiteur l'aurait
 * téléchargé avant le premier affichage, pour un geste que la plupart ne font
 * pas. Hors ligne, il vient du précache du service worker comme le reste.
 *
 * Le chargeur est NOMMÉ : `lazy()` et le préchargement au repos
 * (`useIdlePrefetch`, plus bas) visent le même morceau, et le socle
 * déduplique sur l'identité du chargeur.
 *
 * UN ÉCHEC DE CHARGEMENT NE DOIT PAS FAIRE TOMBER L'ÉCRAN. `lazy()` relance
 * l'erreur jusqu'à la frontière d'erreur de l'application : un morceau
 * manquant (déploiement entre-temps, réseau coupé avant le précache) aurait
 * remplacé tout l'écran par la page de secours, pour un formulaire. Il est
 * remplacé par un message, et le formulaire se referme.
 */
const chargerFormulaire = () => import('./CodeEntryForm');
const CodeEntryForm = lazy<ComponentType<CodeEntryFormProps>>(() =>
  chargerFormulaire().then(
    module => ({ default: module.CodeEntryForm }),
    (erreur: unknown) => {
      recordError(erreur, { source: 'formulaire-code', etape: 'chargement' });
      return { default: FormulaireIndisponible };
    }
  )
);

function FormulaireIndisponible({ onCancel }: CodeEntryFormProps) {
  const { t } = useI18n();
  return (
    <div className="toolbar">
      <p className="hint error" role="alert">
        {t('common.moduleUnavailable')}
      </p>
      <button type="button" className="ghost" onClick={onCancel}>
        {t('common.close')}
      </button>
    </div>
  );
}

/**
 * Où rendre le focus une fois la liste redessinée.
 *
 * UN DÉPLACEMENT FAIT PERDRE LE FOCUS, et ce n'est pas un détail : React
 * déplace le <li> dans le DOM, et un élément retiré — même un instant — perd
 * le focus. Sans reprise, « Monter » deux fois de suite demanderait de
 * retrouver le bouton à la souris. La demande est posée par le geste, et
 * servie après le rendu (`useEffect`), quand le bouton est à sa nouvelle
 * place.
 */
type CibleFocus =
  | { type: 'element'; id: string; action: 'monter' | 'descendre' }
  | { type: 'apres-retrait'; index: number }
  | { type: 'annuler' }
  | { type: 'si-perdu' };

export function ValidatedPanel() {
  const validated = useWorkspaceStore(s => s.validated);
  const historique = useWorkspaceStore(s => s.historique);
  const removeValidated = useWorkspaceStore(s => s.removeValidated);
  const updateValidatedNote = useWorkspaceStore(s => s.updateValidatedNote);
  const addManualDiagnostic = useWorkspaceStore(s => s.addManualDiagnostic);
  const editValidated = useWorkspaceStore(s => s.editValidated);
  const moveValidated = useWorkspaceStore(s => s.moveValidated);
  const clearValidated = useWorkspaceStore(s => s.clearValidated);
  const undo = useWorkspaceStore(s => s.undo);
  const redo = useWorkspaceStore(s => s.redo);
  const annoncer = useAnnouncer();
  const { t } = useI18n();
  const apple = useMemo(() => estApple(), []);

  const validatedCodes = useMemo(
    () => new Set(validated.map(v => v.code)),
    [validated]
  );
  const hasValidated = validated.length > 0;

  // Hors du chemin critique, mais pas au premier clic : le formulaire arrive
  // quand le navigateur est au repos, et « Modifier » s'ouvre sans attendre.
  useIdlePrefetch(chargerFormulaire);

  const panneauRef = useRef<HTMLElement | null>(null);
  const listeRef = useRef<HTMLOListElement | null>(null);
  const annulerRef = useRef<HTMLButtonElement | null>(null);
  const aFocaliser = useRef<CibleFocus | null>(null);

  useEffect(() => {
    const demande = aFocaliser.current;
    if (demande === null) return;
    aFocaliser.current = null;
    const items = [...(listeRef.current?.children ?? [])].filter(
      (el): el is HTMLElement => el instanceof HTMLElement
    );
    const bouton = (li: HTMLElement | undefined, action: string) =>
      li?.querySelector<HTMLButtonElement>(`[data-action="${action}"]`) ?? null;
    const focaliser = (el: HTMLButtonElement | null): boolean => {
      if (el === null || el.disabled) return false;
      el.focus();
      return true;
    };
    const replier = () => {
      if (!focaliser(annulerRef.current)) panneauRef.current?.focus();
    };

    switch (demande.type) {
      case 'element': {
        const li = items.find(el => el.dataset.id === demande.id);
        // Arrivé en tête, « Monter » est désactivé : le focus passe à
        // « Descendre » du MÊME élément, pas ailleurs.
        const autre = demande.action === 'monter' ? 'descendre' : 'monter';
        if (!focaliser(bouton(li, demande.action))) {
          focaliser(bouton(li, autre));
        }
        return;
      }
      case 'apres-retrait': {
        const li = items[demande.index] ?? items[demande.index - 1];
        if (!focaliser(bouton(li, 'retirer'))) replier();
        return;
      }
      case 'annuler':
        replier();
        return;
      case 'si-perdu':
        if (
          document.activeElement === null ||
          document.activeElement === document.body
        ) {
          panneauRef.current?.focus();
        }
        return;
    }
  }, [validated]);

  const dernierPasse = historique.passe.at(-1);
  const dernierFutur = historique.futur.at(-1);
  const touchesAnnuler = apple ? '⌘Z' : 'Ctrl+Z';
  const touchesRetablir = apple ? '⌘⇧Z' : 'Ctrl+Y';

  const faireAnnuler = useCallback(
    (auClavier = false) => {
      const entree = undo();
      if (entree === null) {
        annoncer(t('history.nothingToUndo'));
        return;
      }
      if (auClavier) aFocaliser.current = { type: 'si-perdu' };
      annoncer(
        t('history.undone', {
          operation: decrireOperation(entree.operation, t),
        })
      );
    },
    [annoncer, t, undo]
  );

  const faireRetablir = useCallback(
    (auClavier = false) => {
      const entree = redo();
      if (entree === null) {
        annoncer(t('history.nothingToRedo'));
        return;
      }
      if (auClavier) aFocaliser.current = { type: 'si-perdu' };
      annoncer(
        t('history.redone', {
          operation: decrireOperation(entree.operation, t),
        })
      );
    },
    [annoncer, redo, t]
  );

  /*
   * CTRL+Z HORS DES CHAMPS, ET SEULEMENT LÀ. Dans le compte-rendu, la
   * recherche ou une note, Ctrl+Z appartient au navigateur : c'est lui qui
   * rend le texte qu'on vient d'effacer. Le détourner vers la liste des
   * retenus ferait perdre ce texte ET défaire un geste qu'on ne visait pas.
   * Une boîte de dialogue ouverte suspend aussi le raccourci : on n'annule pas
   * derrière une question.
   */
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const action = actionHistorique(e, apple);
      if (action === null || estChampEditable(e.target)) return;
      if (document.querySelector('[aria-modal="true"]') !== null) return;
      e.preventDefault();
      if (action === 'annuler') faireAnnuler(true);
      else faireRetablir(true);
    };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [apple, faireAnnuler, faireRetablir]);

  const deplacer = (v: ValidatedDiagnostic, delta: -1 | 1) => {
    const position = moveValidated(v.id, delta);
    if (position === null) return;
    aFocaliser.current = {
      type: 'element',
      id: v.id,
      action: delta < 0 ? 'monter' : 'descendre',
    };
    annoncer(t('validated.moved', { code: v.code, position }));
  };

  const retirer = (v: ValidatedDiagnostic, index: number) => {
    removeValidated(v.id);
    aFocaliser.current = { type: 'apres-retrait', index };
    annoncer(t('validated.removed', { code: v.code }));
  };

  const modifier = (v: ValidatedDiagnostic, saisie: SaisieCode): boolean => {
    if (!editValidated(v.id, { code: saisie.code, label: saisie.label })) {
      return false;
    }
    if (saisie.code !== v.code) {
      annoncer(
        t('validated.replaced', { ancien: v.code, nouveau: saisie.code })
      );
    } else if (saisie.label !== v.label) {
      annoncer(t('validated.edited', { code: v.code }));
    }
    return true;
  };

  const vider = () => {
    const nombre = clearValidated();
    if (nombre === 0) return;
    // Le bouton « Vider » disparaît avec la liste : le focus va à « Annuler »,
    // qui est justement le geste qu'on peut vouloir faire.
    aFocaliser.current = { type: 'annuler' };
    annoncer(
      nombre > 1
        ? t('validated.clearedMany', { count: nombre })
        : t('validated.clearedOne', { count: nombre })
    );
  };

  const aDesGestes = historique.passe.length + historique.futur.length > 0;

  return (
    <section
      className={`panel panel--validated ${hasValidated ? 'is-active' : 'is-pristine'}`}
      aria-labelledby="val-label"
      ref={panneauRef}
      // Focalisable par programme seulement : le repli quand le geste a fait
      // disparaître l'élément qui avait le focus.
      tabIndex={-1}
    >
      <div className="panel-head">
        <h2 id="val-label" className="panel-title">
          <svg
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M13.854 3.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 9.793l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
          <span className="panel-title-text">{t('validated.title')}</span>
          {hasValidated && (
            <span className="panel-count" aria-hidden="true">
              {validated.length}
            </span>
          )}
        </h2>
        {/* Rien à annuler tant qu'aucun geste n'a été fait : les deux boutons
            n'apparaissent qu'à partir du premier. Ils restent ensuite, et
            passent en `aria-disabled` quand leur pile est vide — un bouton
            `disabled` perdrait le focus sous le doigt qui vient de vider la
            pile en l'actionnant. */}
        {aDesGestes && (
          <div
            className="panel-head-actions history-actions"
            role="group"
            aria-label={t('history.groupAria')}
          >
            <button
              ref={annulerRef}
              type="button"
              className="ghost history-btn"
              aria-disabled={dernierPasse === undefined || undefined}
              aria-keyshortcuts={apple ? 'Meta+Z' : 'Control+Z'}
              title={
                dernierPasse
                  ? t('history.undoTitle', {
                      operation: decrireOperation(dernierPasse.operation, t),
                      touches: touchesAnnuler,
                    })
                  : t('history.nothingToUndo')
              }
              onClick={() => faireAnnuler()}
            >
              <svg
                aria-hidden="true"
                width={14}
                height={14}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5.5 3.5 2.5 6.5l3 3" />
                <path d="M2.5 6.5h7a4 4 0 0 1 0 8h-2" />
              </svg>
              <span>{t('history.undo')}</span>
            </button>
            <button
              type="button"
              className="ghost history-btn"
              aria-disabled={dernierFutur === undefined || undefined}
              aria-keyshortcuts={
                apple ? 'Meta+Shift+Z' : 'Control+Shift+Z Control+Y'
              }
              title={
                dernierFutur
                  ? t('history.redoTitle', {
                      operation: decrireOperation(dernierFutur.operation, t),
                      touches: touchesRetablir,
                    })
                  : t('history.nothingToRedo')
              }
              onClick={() => faireRetablir()}
            >
              <svg
                aria-hidden="true"
                width={14}
                height={14}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.5 3.5l3 3-3 3" />
                <path d="M13.5 6.5h-7a4 4 0 0 0 0 8h2" />
              </svg>
              <span>{t('history.redo')}</span>
            </button>
          </div>
        )}
      </div>
      {!hasValidated ? (
        <p className="empty">{t('validated.empty')}</p>
      ) : (
        <>
          {/* UNE LISTE ORDONNÉE, parce qu'elle l'est : son ordre est celui
              des exports, de la copie et de l'impression. */}
          <ol className="validated-list" role="list" ref={listeRef}>
            {validated.map((v, index) => (
              <ValidatedItem
                key={v.id}
                item={v}
                position={index + 1}
                total={validated.length}
                autresCodes={validatedCodes}
                onMove={delta => deplacer(v, delta)}
                onRemove={() => retirer(v, index)}
                onNote={note => updateValidatedNote(v.id, note)}
                onEdit={saisie => modifier(v, saisie)}
              />
            ))}
          </ol>
          <div className="validated-footer">
            {validated.length > 1 && (
              <p className="hint validated-order-hint">
                {t('validated.orderHint')}
              </p>
            )}
            <button
              type="button"
              className="ghost validated-clear"
              onClick={vider}
            >
              {t('validated.clear')}
            </button>
          </div>
        </>
      )}
      {/* Trois façons d'ajouter un code que le compte-rendu ne contient pas :
          depuis ses FAVORIS (un geste), par son LIBELLÉ (la recherche, qui
          interroge tout le référentiel) ou par son CODE quand on le connaît
          déjà (la saisie manuelle, repliée derrière son bouton). */}
      <FavoritesPanel existingCodes={validatedCodes} />
      <CodeSearch onAdd={addManualDiagnostic} existingCodes={validatedCodes} />
      <ManualEntryForm existingCodes={validatedCodes} />
      <ExportBar disabled={validated.length === 0} />
    </section>
  );
}

interface ValidatedItemProps {
  item: ValidatedDiagnostic;
  /** 1 = en tête. */
  position: number;
  total: number;
  /** Les codes retenus ; celui de l'élément en est retiré pour la modification. */
  autresCodes: Set<string>;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onNote: (note: string) => void;
  /** `false` si la correction est refusée : le formulaire reste ouvert. */
  onEdit: (saisie: SaisieCode) => boolean;
}

function ValidatedItem({
  item,
  position,
  total,
  autresCodes,
  onMove,
  onRemove,
  onNote,
  onEdit,
}: ValidatedItemProps) {
  const { t } = useI18n();
  const [edition, setEdition] = useState(false);
  const [noteOuverte, setNoteOuverte] = useState(false);
  const [note, setNote] = useState(item.note ?? '');
  const modifierRef = useRef<HTMLButtonElement | null>(null);
  const rendreFocus = useRef(false);

  const codesSaufLui = useMemo(() => {
    const codes = new Set(autresCodes);
    codes.delete(item.code);
    return codes;
  }, [autresCodes, item.code]);

  // Enregistré ou abandonné, le formulaire rend le focus à « Modifier » : le
  // geste suivant part d'où l'on était.
  useEffect(() => {
    if (edition || !rendreFocus.current) return;
    rendreFocus.current = false;
    modifierRef.current?.focus();
  }, [edition]);

  const fermerEdition = () => {
    rendreFocus.current = true;
    setEdition(false);
  };

  return (
    <li className="validated-item" role="listitem" data-id={item.id}>
      {edition ? (
        <Suspense fallback={null}>
          <CodeEntryForm
            // Un code venu de l'OMS se corrige en CIM-11, dans SA
            // classification : le badge ne change pas sous l'utilisateur.
            classification={item.source === 'api' ? 'cim11' : 'cim10'}
            initialCode={item.code}
            initialLabel={item.label}
            existingCodes={codesSaufLui}
            submitLabel={t('validated.save')}
            onSubmit={saisie => {
              if (onEdit(saisie)) fermerEdition();
            }}
            onCancel={fermerEdition}
          />
        </Suspense>
      ) : (
        <div className="validated-row">
          <span className="validated-pos">{position}</span>
          <strong className="validated-code">{item.code}</strong>
          <span
            className={`source-badge source-badge--${item.source ?? 'local'}`}
            title={
              item.source === 'api'
                ? t('results.sourceApiTitle')
                : t('results.sourceLocalTitle')
            }
          >
            {item.source === 'api'
              ? t('results.badgeIcd11')
              : t('results.badgeIcd10')}
          </span>
          <span className="validated-label">{item.label}</span>
          <div className="toolbar validated-actions">
            <FavoriteToggle
              code={item.code}
              label={item.label}
              source={item.source ?? 'local'}
            />
            {/* Des boutons, pas un glisser-déposer : un geste qu'un clavier,
                un lecteur d'écran ou un doigt tremblant savent faire. */}
            <button
              type="button"
              className="ghost icon-btn"
              data-action="monter"
              aria-label={t('validated.moveUpAria', { code: item.code })}
              title={t('validated.moveUp')}
              disabled={position === 1}
              onClick={() => onMove(-1)}
            >
              <svg
                aria-hidden="true"
                width={14}
                height={14}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
              </svg>
            </button>
            <button
              type="button"
              className="ghost icon-btn"
              data-action="descendre"
              aria-label={t('validated.moveDownAria', { code: item.code })}
              title={t('validated.moveDown')}
              disabled={position === total}
              onClick={() => onMove(1)}
            >
              <svg
                aria-hidden="true"
                width={14}
                height={14}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
              </svg>
            </button>
            <button
              ref={modifierRef}
              type="button"
              className="ghost"
              data-action="modifier"
              aria-label={t('validated.editAria', { code: item.code })}
              onClick={() => {
                setNoteOuverte(false);
                setEdition(true);
              }}
            >
              {t('validated.edit')}
            </button>
            <button
              type="button"
              className="ghost"
              data-action="note"
              onClick={() => {
                // Relue à l'ouverture : « Annuler » a pu changer la note depuis
                // la dernière fois, et le champ rendrait sinon l'ancienne.
                if (!noteOuverte) setNote(item.note ?? '');
                setNoteOuverte(v => !v);
              }}
              aria-pressed={noteOuverte}
            >
              {noteOuverte ? t('common.close') : t('validated.note')}
            </button>
            <button
              type="button"
              className="ghost"
              data-action="retirer"
              onClick={onRemove}
            >
              {t('common.remove')}
            </button>
          </div>
        </div>
      )}
      {!edition && noteOuverte && (
        <div className="validated-note-row">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={() => onNote(note)}
            placeholder={t('validated.notePlaceholder')}
            aria-label={`${t('validated.note')} — ${item.code}`}
            rows={2}
          />
        </div>
      )}
      {!edition && !noteOuverte && item.note && (
        <p className="validated-note-display">
          <em>{item.note}</em>
        </p>
      )}
    </li>
  );
}

interface ManualEntryFormProps {
  existingCodes: Set<string>;
}

/**
 * Un code qu'on connaît déjà, saisi à la main. Le contrôle de forme vit dans
 * `CodeEntryForm`, partagé avec « Modifier ».
 */
function ManualEntryForm({ existingCodes }: ManualEntryFormProps) {
  const { t } = useI18n();
  const addManualDiagnostic = useWorkspaceStore(s => s.addManualDiagnostic);
  const annoncer = useAnnouncer();
  const [open, setOpen] = useState(false);
  const boutonRef = useRef<HTMLButtonElement | null>(null);
  const rendreFocus = useRef(false);

  // Refermé, le formulaire rend le focus au bouton qui l'avait ouvert.
  useEffect(() => {
    if (open || !rendreFocus.current) return;
    rendreFocus.current = false;
    boutonRef.current?.focus();
  }, [open]);

  const fermer = () => {
    rendreFocus.current = true;
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        ref={boutonRef}
        type="button"
        className="ghost manual-add-toggle"
        onClick={() => setOpen(true)}
      >
        {t('validated.addManual')}
      </button>
    );
  }

  return (
    <Suspense fallback={null}>
      <CodeEntryForm
        classification="cim10"
        existingCodes={existingCodes}
        submitLabel={t('common.add')}
        onSubmit={saisie => {
          addManualDiagnostic(saisie.code, saisie.label, 'local');
          annoncer(
            saisie.horsReferentiel
              ? t('validated.addedUnknown', { code: saisie.code })
              : t('validated.added', { code: saisie.code })
          );
          fermer();
        }}
        onCancel={fermer}
      />
    </Suspense>
  );
}
