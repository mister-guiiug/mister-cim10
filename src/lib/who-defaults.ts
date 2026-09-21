/**
 * Les réglages OMS que le BUILD fournit — pour que l'application arrive
 * connectée, sans rien à saisir.
 *
 * CE QUI EST ICI EST PUBLIC, ET C'EST TOUT CE QUI PEUT L'ÊTRE. Une
 * `VITE_*` est recopiée en littéral dans le bundle : l'adresse de la
 * passerelle, la version de la classification et la langue s'y prêtent — elles
 * se lisent déjà dans le trafic réseau. Le compte OMS, non : `clientId` et
 * surtout `clientSecret` vivent en secrets SUR LA PASSERELLE
 * (`workers/who-icd-proxy.js`), qui les ajoute côté serveur. Les mettre ici les
 * publierait, et un mot secret publié n'en est plus un.
 *
 * L'analyse interroge les deux référentiels, et l'utilisateur n'a plus de mode
 * à choisir (cf. `../store/settingsStore.ts`). Ces variables rendent donc la
 * voie OMS réellement utilisable, au lieu de la laisser derrière un compte à
 * créer — ce que `docs/context.md`, § Confidentialité, assume : des segments du
 * compte-rendu partent chez un tiers dès que le réseau répond.
 */
import type { WhoSettings } from '../types/index';

/**
 * Ce que le build fournit. IL NE SE DÉDUIT PLUS DE L'INSTANTANÉ : celui-ci a
 * perdu la passerelle (`./app-store.ts`, version 2) alors que le build, lui,
 * la porte — c'est même devenu sa seule source. Le type se prend donc sur les
 * réglages EFFECTIFS, les trois champs publics que le build sait remplir.
 */
export type DefautsWho = Pick<WhoSettings, 'proxyUrl' | 'releaseId' | 'lang'>;

/** Version de la classification servie par défaut (cf. la liste des Réglages). */
const RELEASE_DEFAUT = '2025-01';
/** Langue des libellés demandée à l'OMS par défaut. */
const LANG_DEFAUT = 'fr';

const propre = (v: string | undefined, defaut: string): string => {
  const s = (v ?? '').trim();
  return s === '' ? defaut : s;
};

/**
 * Les réglages OMS publics du build. Une FONCTION, pas une constante de
 * module : `import.meta.env` est remplacé en littéral au build de toute façon,
 * et lire à l'appel laisse les tests poser leur propre environnement
 * (`vi.stubEnv`) sans dépendre de l'ordre des imports.
 */
export function defautsWho(): DefautsWho {
  return {
    proxyUrl: propre(import.meta.env.VITE_WHO_PROXY_URL, ''),
    releaseId: propre(import.meta.env.VITE_WHO_RELEASE_ID, RELEASE_DEFAUT),
    lang: propre(import.meta.env.VITE_WHO_LANG, LANG_DEFAUT),
  };
}

/**
 * Le build fournit-il une passerelle, et donc un compte OMS ?
 *
 * LA QUESTION N'A PLUS QU'UNE FORME, parce que la passerelle n'a plus qu'une
 * source. Elle prenait une adresse en argument, du temps où les Réglages en
 * proposaient une autre : il fallait alors distinguer celle du parc, qui porte
 * ses secrets, de celle qu'on avait tapée et dont on ne savait rien. Ce champ a
 * disparu — la CSP le rendait inopérant — et `readWhoSettings` ne rend plus que
 * l'adresse du build. Comparer cette adresse à elle-même serait une tautologie
 * déguisée en vérification.
 *
 * LA RÈGLE RESTE DÉCLARATIVE : une passerelle posée par `VITE_WHO_PROXY_URL`
 * est, par contrat, celle du parc, et celle-là porte le compte en secrets côté
 * serveur. On ne le lui demande pas — ce serait un aller-retour réseau au
 * démarrage pour une réponse que le déploiement connaît déjà. Si le contrat
 * n'est pas tenu (secrets absents du worker), l'échec est lisible : la
 * passerelle répond 400 et l'IHM affiche « identifiants refusés ».
 */
export function passerelleFournie(): boolean {
  return defautsWho().proxyUrl !== '';
}
