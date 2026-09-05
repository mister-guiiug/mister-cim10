import type { ReactNode } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { AppUpdates } from '@mister-guiiug/dev-pwa-config/react/app-updates';
import { useI18n } from '../i18n';
import { createLogger } from '@mister-guiiug/dev-pwa-config/logger';

const log = createLogger('pwa');

/**
 * Mise à jour de l'application : enregistrement du service worker, bandeau
 * « une nouvelle version est disponible », et état partagé avec le bouton
 * « Recharger l'application » des Paramètres.
 *
 * REMPLACE `src/register-sw.ts`. L'ancien fichier fabriquait son bandeau en DOM
 * natif, avant React, donc hors du contexte i18n : il relisait la locale dans
 * `localStorage` pour choisir sa langue. Ici le bandeau est un composant rendu
 * SOUS `I18nProvider` — la langue suit le contexte, sans clé de stockage ni
 * duplication de la logique de repli.
 *
 * POURQUOI `AppUpdates` ET PAS `UpdatePromptBanner`. Deux endroits parlent de
 * mise à jour dans cette app : ce bandeau, et le bouton des Paramètres. Le
 * fournisseur reçoit `registerSW` UNE fois et publie l'état pour tout l'arbre ;
 * `UpdateButton`, posé bien plus bas dans `SettingsPage`, n'a donc rien à
 * recevoir et partage le même `updating`. Deux montages du hook
 * enregistreraient deux fois le service worker.
 *
 * `registerSW` EST PASSÉ SANS CONDITION. `virtual:pwa-register` est résolu par
 * vite-plugin-pwa vers un module DIFFÉRENT selon la commande : en `vite dev`
 * (sans `devOptions.enabled`, le cas ici) son `registerSW` est un corps vide
 * qui ne touche à rien. Le garde `if (!import.meta.env.PROD) return;` de
 * l'ancien fichier était donc redondant — et il aurait rendu le bandeau
 * intestable, Vitest posant `PROD` à faux.
 *
 * `checkEvery` EST NOUVEAU, et il compense le passage de `registerType:
 * 'autoUpdate'` à `'prompt'` (voir `vite.config.ts`) : une PWA installée
 * laissée ouverte plusieurs jours ne redemande jamais le `sw.js` d'elle-même.
 * Sans cette revérification, le bandeau n'apparaîtrait qu'au prochain démarrage
 * à froid, ce qui laisserait l'utilisateur plus longtemps sur une version
 * périmée qu'avant la migration.
 */
export function PwaUpdates({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <AppUpdates
      registerSW={registerSW}
      checkEvery="1h"
      bannerProps={{
        title: t('pwa.updateAvailable'),
        updateLabel: t('pwa.updateAction'),
        // Le bandeau du socle n'est pas positionné : `components.css` lui donne
        // l'habillage (fond, filet, rayon, cible tactile), l'app le place. Il
        // passe au-dessus de l'en-tête collant (`z-index: 50`) et sous le lien
        // d'évitement (`10001`), comme l'ancienne barre.
        className:
          'fixed inset-x-2 z-[9999] mx-auto max-w-[46rem] top-[max(0.5rem,var(--safe-t,0px))]',
      }}
      // Les deux rappels que l'ancien `register-sw.ts` posait. `onRegisteredSW`
      // et NON `onRegistered` : le socle passe toujours `onRegisteredSW` à
      // `registerSW`, et le module de vite-plugin-pwa n'appelle `onRegistered`
      // que si `onRegisteredSW` est absent — le second ne se déclencherait
      // jamais dans un vrai build.
      onRegisteredSW={(swUrl, registration) => {
        console.log('[PWA] Service worker registered', swUrl, registration);
      }}
      onRegisterError={error => {
        log.error('Service worker registration error', { error });
      }}
    >
      {children}
    </AppUpdates>
  );
}
