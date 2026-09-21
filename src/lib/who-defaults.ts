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
 * Aucune de ces variables n'ACTIVE quoi que ce soit : le mode d'analyse reste
 * `local` par défaut, et c'est délibéré (cf. `docs/context.md`, §
 * Confidentialité — en mode OMS, des segments du compte-rendu partent chez un
 * tiers). Elles rendent seulement le mode OMS utilisable quand il est choisi.
 */
import type { WhoPublicSettings } from './app-store';

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
export function defautsWho(): Omit<WhoPublicSettings, 'clientId'> {
  return {
    proxyUrl: propre(import.meta.env.VITE_WHO_PROXY_URL, ''),
    releaseId: propre(import.meta.env.VITE_WHO_RELEASE_ID, RELEASE_DEFAUT),
    lang: propre(import.meta.env.VITE_WHO_LANG, LANG_DEFAUT),
  };
}

/**
 * La passerelle du build s'authentifie-t-elle seule ?
 *
 * On ne le lui demande pas — ce serait un aller-retour réseau au démarrage pour
 * une réponse que le déploiement connaît déjà. LA RÈGLE EST DÉCLARATIVE : une
 * passerelle posée par `VITE_WHO_PROXY_URL` est, par contrat, celle du parc, et
 * celle-là porte ses secrets. Une passerelle saisie à la main dans les
 * Réglages, on n'en sait rien : elle exige un compte.
 *
 * Si le contrat n'est pas tenu (secrets absents du worker), l'échec est
 * lisible : la passerelle répond 400 et l'IHM affiche « identifiants refusés ».
 */
export function passerelleFournieParLeBuild(proxyUrl: string): boolean {
  const defaut = defautsWho().proxyUrl;
  return defaut !== '' && proxyUrl.trim() === defaut;
}
