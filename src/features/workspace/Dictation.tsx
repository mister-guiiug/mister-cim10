import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useAnnouncer } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { localeToBcp47 } from '@mister-guiiug/dev-pwa-config/speech';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useDialog } from '../../hooks/useDialog';
import {
  useSpeechRecognition,
  type Dictee,
} from '../../hooks/useSpeechRecognition';
import type { EnvironnementDictee } from '../../lib/dictee';
import { insererAuCurseur } from '../../lib/dictee-moteur';
import { BoutonDictee } from './BoutonDictee';
import { useI18n } from '../../i18n';

/** La dernière position connue du curseur, et le texte qu'elle désignait. */
export interface SelectionCompteRendu {
  debut: number;
  fin: number;
  texte: string;
}

/** Ce que `CrPanel` peut demander à la dictée chargée. */
export interface ControleDictee {
  /** Couper sans rien écrire de plus : le dossier change. */
  interrompre: () => void;
}

export interface DictationProps {
  environnement: EnvironnementDictee;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** Tenue à jour par `CrPanel`, qui porte la zone de texte. */
  selectionRef: RefObject<SelectionCompteRendu | null>;
  /** Où dire l'état de la dictée : sous le formulaire, pas dans la barre. */
  zoneStatut: HTMLElement | null;
  controleRef: RefObject<ControleDictee | null>;
  /** Jeton à usage unique : la doublure a été cliquée avant le chargement. */
  demarrerRef: RefObject<boolean>;
  /** La doublure avait le focus quand elle a été remplacée. */
  focusRef: RefObject<boolean>;
}

/**
 * La dictée du compte-rendu, CHARGÉE À LA DEMANDE — au repos après le premier
 * affichage, ou au premier clic sur la doublure (cf. `CrPanel`).
 *
 * Tout ce qui ne sert qu'une fois la dictée lancée vit ici : le crochet, l'état
 * affiché, la boîte d'accord, l'insertion au curseur. Le morceau d'entrée ne
 * garde que le bouton (`BoutonDictee`) et la détection de l'API : sans elles,
 * on ne saurait pas s'il y a un bouton à montrer.
 */
export function Dictation({
  environnement,
  textareaRef,
  selectionRef,
  zoneStatut,
  controleRef,
  demarrerRef,
  focusRef,
}: DictationProps) {
  const crText = useWorkspaceStore(s => s.crText);
  const setCrText = useWorkspaceStore(s => s.setCrText);
  const dialog = useDialog();
  const annoncer = useAnnouncer();
  const { t, locale } = useI18n();
  const boutonRef = useRef<HTMLButtonElement | null>(null);
  const curseurAPoser = useRef<number | null>(null);

  /*
   * LE CURSEUR, QUAND LE FOCUS EST AILLEURS. Cliquer « Dictée » sort le focus
   * de la zone de texte ; le navigateur garde la sélection, mais un texte
   * remplacé depuis (dossier rouvert, texte effacé) la rendrait fausse.
   * `CrPanel` retient donc la position AVEC le texte qu'elle désignait : si le
   * texte a changé entre-temps, la dictée s'écrit à la fin plutôt qu'au milieu
   * d'un autre compte-rendu.
   */
  const insererDictee = useCallback(
    (fragment: string) => {
      const courant = useWorkspaceStore.getState().crText;
      const ta = textareaRef.current;
      let debut = courant.length;
      let fin = courant.length;
      if (ta !== null && document.activeElement === ta) {
        debut = ta.selectionStart;
        fin = ta.selectionEnd;
      } else if (selectionRef.current?.texte === courant) {
        debut = selectionRef.current.debut;
        fin = selectionRef.current.fin;
      }
      const suite = insererAuCurseur(courant, debut, fin, fragment);
      setCrText(suite.texte);
      selectionRef.current = {
        debut: suite.curseur,
        fin: suite.curseur,
        texte: suite.texte,
      };
      curseurAPoser.current = suite.curseur;
    },
    [selectionRef, setCrText, textareaRef]
  );

  // Réécrire la valeur d'une zone de texte envoie son curseur à la fin : si
  // l'utilisateur y est, on le remet juste après ce qui vient d'être dicté.
  useLayoutEffect(() => {
    const curseur = curseurAPoser.current;
    const ta = textareaRef.current;
    curseurAPoser.current = null;
    if (curseur === null || ta === null || document.activeElement !== ta) {
      return;
    }
    ta.setSelectionRange(curseur, curseur);
  }, [crText, textareaRef]);

  const demanderAccord = useCallback(async () => {
    const accepte = await dialog.confirm(t('dictation.consentMessage'), {
      title: t('dictation.consentTitle'),
      okLabel: t('dictation.consentAccept'),
      cancelLabel: t('dictation.consentDecline'),
    });
    if (!accepte) annoncer(t('dictation.declined'));
    return accepte;
  }, [annoncer, dialog, t]);

  const dictee = useSpeechRecognition({
    langue: localeToBcp47(locale),
    onTexte: insererDictee,
    demanderAccord,
    environnement,
  });
  const { basculer, interrompre } = dictee;

  useImperativeHandle(controleRef, () => ({ interrompre }), [interrompre]);

  /*
   * LA RELÈVE DE LA DOUBLURE. Si elle avait le focus, le vrai bouton le
   * reprend — elle vient de disparaître sous le clavier. Si elle avait été
   * cliquée, la dictée démarre : le clic a eu lieu avant le chargement, il ne
   * doit pas être perdu. Deux jetons à usage unique, consommés ici : en mode
   * strict, React joue cet effet deux fois, et un second `basculer`
   * abandonnerait la préparation que le premier vient de lancer.
   */
  useEffect(() => {
    if (focusRef.current) {
      focusRef.current = false;
      boutonRef.current?.focus();
    }
    if (demarrerRef.current) {
      demarrerRef.current = false;
      void basculer();
    }
  }, [basculer, demarrerRef, focusRef]);

  // La fin d'une écoute se dit ; son début non — la voix de synthèse d'un
  // lecteur d'écran qui parle pendant qu'on dicte se retrouverait transcrite.
  // Une fin sur erreur est dite par l'erreur elle-même.
  const etatPrecedent = useRef(dictee.etat);
  useEffect(() => {
    if (
      etatPrecedent.current === 'ecoute' &&
      dictee.etat === 'repos' &&
      dictee.erreur === null
    ) {
      annoncer(t('dictation.stopped'));
    }
    etatPrecedent.current = dictee.etat;
  }, [annoncer, dictee.erreur, dictee.etat, t]);

  return (
    <>
      <BoutonDictee
        ref={boutonRef}
        actif={dictee.etat !== 'repos'}
        ecoute={dictee.etat === 'ecoute'}
        onClick={() => void basculer()}
      />
      {zoneStatut !== null &&
        createPortal(<StatutDictee dictee={dictee} />, zoneStatut)}
    </>
  );
}

/**
 * Ce que la dictée dit d'elle-même : où la voix est traitée, ce que le
 * navigateur croit entendre, et pourquoi elle s'est arrêtée.
 *
 * LES RÉSULTATS INTERMÉDIAIRES NE SONT PAS ANNONCÉS. Ils changent à chaque
 * syllabe : lus au fil de l'eau, ils couvriraient la voix de qui dicte — et
 * un lecteur d'écran qui parle pendant l'écoute se fait transcrire. L'état
 * passe par `aria-pressed` du bouton ; les erreurs, elles, arrivent après la
 * fin de l'écoute, et sont dites (`role="alert"`).
 */
function StatutDictee({ dictee }: { dictee: Dictee }) {
  const { t } = useI18n();
  return (
    <>
      {dictee.etat === 'preparation' && (
        <p className="hint dictation-status">{t('dictation.preparing')}</p>
      )}
      {dictee.etat === 'ecoute' && (
        <div className="dictation-live">
          <p className="dictation-status">
            <span className="dictation-dot" aria-hidden="true" />
            {dictee.mode === 'appareil'
              ? t('dictation.listeningDevice')
              : t('dictation.listeningOnline')}
          </p>
          {dictee.intermediaire !== '' && (
            <p className="dictation-interim">
              {t('dictation.interim', { texte: dictee.intermediaire })}
            </p>
          )}
        </div>
      )}
      {dictee.erreur !== null && (
        <p className="hint error" role="alert">
          {t(`dictation.errors.${dictee.erreur}`)}
        </p>
      )}
    </>
  );
}
