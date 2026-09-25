import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  enregistrerAccordDictee,
  environnementDuNavigateur,
  lireAccordDictee,
  type EnvironnementDictee,
  type ReconnaissanceVocale,
} from '../lib/dictee';
import {
  etatReconnaissanceLocale,
  installerReconnaissanceLocale,
  traduireErreurDictee,
  type ErreurDictee,
  type ModeDictee,
} from '../lib/dictee-moteur';

/**
 * `preparation` couvre tout ce qui précède l'écoute : savoir où la parole sera
 * traitée, télécharger le modèle local s'il le faut, demander l'accord, puis
 * attendre que le navigateur ait ouvert le micro.
 */
export type EtatDictee = 'repos' | 'preparation' | 'ecoute';

export interface OptionsDictee {
  /** Étiquette BCP-47 : `fr-FR`, `en-US`. */
  langue: string;
  /**
   * Chaque segment DÉFINITIF, une fois. Les résultats intermédiaires ne
   * passent pas par là : ils changent à chaque syllabe et ne s'écrivent pas
   * dans le compte-rendu, ils s'affichent à côté.
   */
  onTexte: (texte: string) => void;
  /**
   * Pose la question de l'accord pour la dictée en ligne ; `true` si
   * l'utilisateur accepte. N'est appelée qu'au premier usage en ligne.
   */
  demanderAccord: () => Promise<boolean>;
  /** Injectable pour les tests : le navigateur courant sinon. */
  environnement?: EnvironnementDictee;
}

export interface Dictee {
  /** L'API existe : le bouton a lieu d'être. */
  proposee: boolean;
  etat: EtatDictee;
  /** Où la parole est traitée pendant l'écoute en cours (ou la dernière). */
  mode: ModeDictee | null;
  /** Ce que le navigateur croit entendre, pas encore arrêté. */
  intermediaire: string;
  erreur: ErreurDictee | null;
  /**
   * Premier clic : prépare et démarre. Second clic : arrête — ou abandonne la
   * préparation en cours.
   */
  basculer: () => Promise<void>;
  arreter: () => void;
  /**
   * Coupe SANS rendre ce qui était en cours de reconnaissance. Pour un
   * changement de dossier : la fin d'une phrase dictée pour un patient ne doit
   * pas atterrir dans le compte-rendu du suivant.
   */
  interrompre: () => void;
}

/**
 * La dictée du compte-rendu, sur l'API Web Speech.
 *
 * LE CHOIX DU MODE EST REFAIT À CHAQUE DÉMARRAGE, et c'est ce qui permet de ne
 * rien stocker à ce sujet : un navigateur qui a appris à reconnaître sur
 * l'appareil depuis la dernière fois est utilisé comme tel, accord ou pas.
 *
 * L'ACCORD N'EST DEMANDÉ QU'EN LIGNE. Sur l'appareil, rien ne sort — il n'y a
 * rien à accepter, et une question sans objet apprend à cliquer « Oui » sans
 * lire.
 */
export function useSpeechRecognition({
  langue,
  onTexte,
  demanderAccord,
  environnement,
}: OptionsDictee): Dictee {
  const env = useMemo(
    () => environnement ?? environnementDuNavigateur(),
    [environnement]
  );
  const [etat, setEtat] = useState<EtatDictee>('repos');
  const [mode, setMode] = useState<ModeDictee | null>(null);
  const [intermediaire, setIntermediaire] = useState('');
  const [erreur, setErreur] = useState<ErreurDictee | null>(null);

  const reconnaissance = useRef<ReconnaissanceVocale | null>(null);
  /** La préparation en cours : un second clic la marque abandonnée. */
  const preparation = useRef<{ abandonnee: boolean } | null>(null);
  const monte = useRef(true);

  // Les rappels changent à chaque rendu du parent ; une écoute, elle, dure
  // plusieurs rendus. Elle lit donc toujours les derniers.
  const rappels = useRef({ onTexte, demanderAccord });
  useEffect(() => {
    rappels.current = { onTexte, demanderAccord };
  });

  // Quitter l'écran coupe le micro : une écoute qui survivrait à son
  // composant écrirait dans un compte-rendu que plus rien n'affiche.
  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
      const r = reconnaissance.current;
      reconnaissance.current = null;
      if (r) {
        r.onstart = null;
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
        r.abort();
      }
    };
  }, []);

  const demarrer = useCallback(
    (choisi: ModeDictee) => {
      const Reconnaissance = env.Reconnaissance;
      if (Reconnaissance === null) return;
      const r = new Reconnaissance();
      r.lang = langue;
      // En continu : une pause pour chercher un mot ne coupe pas la dictée.
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      if (choisi === 'appareil') r.processLocally = true;
      // Un segment ne s'écrit qu'une fois : Chrome sur Android renvoie parfois
      // un résultat définitif déjà livré.
      const livres = new Set<number>();
      r.onstart = () => setEtat('ecoute');
      r.onresult = evenement => {
        let provisoire = '';
        for (let i = evenement.resultIndex; i < evenement.results.length; i++) {
          const resultat = evenement.results[i];
          const texte = resultat?.[0]?.transcript ?? '';
          if (!resultat?.isFinal) {
            provisoire += texte;
          } else if (!livres.has(i)) {
            livres.add(i);
            if (texte.trim() !== '') rappels.current.onTexte(texte);
          }
        }
        setIntermediaire(provisoire.trim());
      };
      r.onerror = evenement => {
        const code = traduireErreurDictee(evenement.error);
        if (code !== null) setErreur(code);
      };
      r.onend = () => {
        if (reconnaissance.current === r) reconnaissance.current = null;
        setEtat('repos');
        setIntermediaire('');
      };
      reconnaissance.current = r;
      setMode(choisi);
      setIntermediaire('');
      try {
        r.start();
      } catch {
        reconnaissance.current = null;
        setErreur('inconnue');
        setEtat('repos');
      }
    },
    [env, langue]
  );

  const arreter = useCallback(() => {
    // `stop` et non `abort` : ce qui a été dit juste avant le clic arrive
    // encore, en résultat définitif, avant la fin.
    reconnaissance.current?.stop();
  }, []);

  const interrompre = useCallback(() => {
    if (preparation.current !== null) {
      preparation.current.abandonnee = true;
      preparation.current = null;
    }
    const r = reconnaissance.current;
    if (r === null) {
      setEtat('repos');
      return;
    }
    // Plus rien ne doit être écrit, même un résultat déjà en route.
    r.onresult = null;
    r.abort();
  }, []);

  const basculer = useCallback(async () => {
    if (reconnaissance.current !== null) {
      arreter();
      return;
    }
    if (preparation.current !== null) {
      preparation.current.abandonnee = true;
      preparation.current = null;
      setEtat('repos');
      return;
    }
    if (env.Reconnaissance === null) return;

    const jeton = { abandonnee: false };
    preparation.current = jeton;
    const abandonnee = () => jeton.abandonnee || !monte.current;
    const renoncer = () => {
      if (preparation.current === jeton) preparation.current = null;
      setEtat('repos');
    };
    setErreur(null);
    setEtat('preparation');

    let choisi: ModeDictee = 'en-ligne';
    const local = await etatReconnaissanceLocale(env, langue);
    if (local === 'disponible') {
      choisi = 'appareil';
    } else if (
      local === 'a-installer' &&
      (await installerReconnaissanceLocale(env, langue))
    ) {
      choisi = 'appareil';
    }
    if (abandonnee()) return;

    if (choisi === 'en-ligne') {
      // Hors connexion, le service ne répondra pas : inutile de demander un
      // accord pour un envoi qui ne peut pas avoir lieu.
      if (!env.enLigne()) {
        renoncer();
        setErreur('hors-ligne');
        return;
      }
      if (lireAccordDictee() === null) {
        const accepte = await rappels.current.demanderAccord();
        if (abandonnee()) return;
        if (!accepte) {
          renoncer();
          return;
        }
        enregistrerAccordDictee();
      }
    }

    preparation.current = null;
    demarrer(choisi);
  }, [arreter, demarrer, env, langue]);

  return {
    proposee: env.Reconnaissance !== null,
    etat,
    mode,
    intermediaire,
    erreur,
    basculer,
    arreter,
    interrompre,
  };
}
