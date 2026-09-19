import { useActionGuard } from '@mister-guiiug/dev-pwa-config/react/use-action-guard';
import { useOnline } from '@mister-guiiug/dev-pwa-config/react/use-online';
import { PwaInstallPrompt } from '@mister-guiiug/dev-pwa-config/react/pwa-install-prompt';
import { GESTES, trackEvent } from '@mister-guiiug/dev-pwa-config/analytics';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { CrPanel } from '../features/workspace/CrPanel';
import { SuggestionsPanel } from '../features/workspace/SuggestionsPanel';
import { ValidatedPanel } from '../features/workspace/ValidatedPanel';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSettingsStore } from '../store/settingsStore';
import { suggestFromText } from '../lib/analyzer';
import { OmsError, suggestFromOms } from '../lib/oms';
import { useI18n } from '../i18n';
import type { AnalysisResult } from '../types/index';

/**
 * Dédup par code (CIM-10 et CIM-11 ne se chevauchent pas), tri par confiance.
 *
 * Sortie du corps de `handleAnalyze` parce qu'elle a maintenant DEUX
 * appelants : l'analyse complète, et l'échec OMS qui ne garde que la moitié
 * locale. Fonction pure — elle ne lit ni l'état ni les réglages.
 */
function classerParConfiance(results: AnalysisResult[]): AnalysisResult[] {
  const byCode = new Map<string, AnalysisResult>();
  for (const r of results) if (!byCode.has(r.code)) byCode.set(r.code, r);
  return [...byCode.values()].sort((a, b) => b.confidence - a.confidence);
}

export function HomePage() {
  const setSuggestions = useWorkspaceStore(s => s.setSuggestions);
  const setIsAnalyzing = useWorkspaceStore(s => s.setIsAnalyzing);
  const setAnalyzeError = useWorkspaceStore(s => s.setAnalyzeError);
  const crText = useWorkspaceStore(s => s.crText);
  const mode = useSettingsStore(s => s.mode);
  const who = useSettingsStore(s => s.who);
  const isReady = useSettingsStore(s => s.isReady());
  const { t } = useI18n();

  /**
   * L'OMS est le SEUL appel réseau de l'app ; le dictionnaire CIM-10, lui, est
   * embarqué et répond hors connexion. D'où deux traitements distincts :
   *
   *   - mode « api » : l'OMS est l'unique source. Hors connexion le bouton n'a
   *     rien à produire, on le garde (motif `offline` du socle, message affiché).
   *   - mode « both » : le local suffit à répondre. Le bouton RESTE actif, et
   *     seule la moitié OMS s'annonce indisponible. Avant, l'échec de l'OMS
   *     levait avant `setSuggestions` : les résultats locaux déjà calculés
   *     partaient à la poubelle et l'utilisateur repartait les mains vides.
   *   - mode « local » (défaut) : rien ne change, aucun mot.
   */
  const isOnline = useOnline();
  const analyzeGuard = useActionGuard({ online: mode === 'api' });
  const omsSkipped = mode === 'both' && !isOnline;

  const handleAnalyze = async () => {
    if (!isReady) {
      setAnalyzeError(t('errors.configure'));
      return;
    }
    if (!crText.trim()) {
      setAnalyzeError(t('errors.emptyReport'));
      return;
    }
    setAnalyzeError(null);
    setIsAnalyzing(true);
    /*
     * L'ANALYSE, MESURÉE PAR SON ISSUE — et par son MODE, qui est le point.
     *
     * Cette application a deux référentiels : le dictionnaire local, immédiat,
     * et la passerelle OMS, qui passe par le réseau. `mode` dit lequel a été
     * demandé (`local`, `api`, `both`) et c'est la seule ventilation utile :
     * la passerelle est le point faible connu de l'app, et on ne savait pas à
     * quelle fréquence elle échoue chez les utilisateurs.
     *
     * RIEN D'AUTRE NE PART. Ni le compte-rendu, ni sa longueur, ni le nombre
     * de codes trouvés, ni leur nature. Chacune de ces mesures serait un pas
     * vers le texte clinique, et c'est exactement ce que l'ADR 0012 refuse.
     */
    trackEvent(GESTES.OPERATION, { nom: 'analyse', etape: 'lancee', mode });
    /*
     * DÉCLARÉS HORS DU `try`, ET C'EST TOUT LE CORRECTIF. Le dictionnaire
     * local remplit `results` AVANT que la passerelle OMS soit interrogée :
     * tant que ces deux variables vivaient dans le `try`, l'échec réseau
     * emportait avec lui des résultats déjà calculés.
     */
    const results: AnalysisResult[] = [];
    let localRepondu = false;
    try {
      // Dictionnaire local CIM-10 (immédiat).
      if (mode === 'local' || mode === 'both') {
        results.push(...suggestFromText(crText));
        localRepondu = true;
      }
      // OMS CIM-11 via la passerelle (réseau) — sautée hors connexion, où elle
      // ne peut qu'échouer : la partie locale, elle, a déjà répondu.
      if ((mode === 'api' || mode === 'both') && isOnline) {
        results.push(...(await suggestFromOms(crText, who)));
      }
      setSuggestions(classerParConfiance(results));
      trackEvent(GESTES.OPERATION, { nom: 'analyse', etape: 'reussie', mode });
    } catch (err) {
      /*
       * UN ÉCHEC DE L'OMS N'EST PAS UN ÉCHEC DE L'ANALYSE. En mode « both »,
       * le dictionnaire CIM-10 a déjà répondu quand la passerelle lève : ses
       * codes sont publiés, et le message dit seulement ce qui manque. Avant,
       * ce `catch` n'appelait jamais `setSuggestions` — l'utilisateur voyait
       * une erreur nue là où la moitié locale de son analyse était prête.
       *
       * EN MODE « API », RIEN N'A ÉTÉ PRODUIT, et la liste précédente est
       * laissée en place : l'effacer ferait perdre des codes valides sur une
       * simple reprise après une passerelle qui tousse.
       *
       * Le compteur, lui, ne change pas de sens : `etape: 'echouee'` dit que
       * la passerelle a échoué, `mode` dit ce que l'utilisateur a quand même
       * obtenu.
       */
      trackEvent(GESTES.OPERATION, { nom: 'analyse', etape: 'echouee', mode });
      if (localRepondu) setSuggestions(classerParConfiance(results));
      const raison =
        err instanceof OmsError
          ? t(
              `errors.oms.${err.code}`,
              err.status === undefined ? undefined : { status: err.status }
            )
          : t('errors.oms.unknown');
      // Le suffixe n'est ajouté que s'il y a vraiment quelque chose à voir :
      // une analyse locale sans correspondance ne doit pas annoncer des codes
      // qui n'existent pas.
      setAnalyzeError(
        results.length > 0 ? t('errors.oms.localKept', { raison }) : raison
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <AppHeader />
      {/*
       * DEUX COLONNES AU-DESSUS DE 1024 px, et ce n'est pas de l'esthétique.
       *
       * Mesuré en production le 17/09/2026, en 1280 × 900 : la page faisait
       * 3 475 px, « Diagnostics retenus » commençait à 2 582 px, et un
       * « Valider » se trouvait à 1 834 px — DEUX ÉCRANS — de l'endroit où son
       * code allait atterrir. Valider n'avait donc aucun effet visible. La
       * place existait pourtant : les cartes s'étiraient sur 1 234 px pour un
       * code et quatre mots de libellé.
       *
       * Le travail à gauche (saisie puis suggestions), le résultat à droite,
       * collant. Sous le seuil, la colonne unique reste — et le rappel du
       * panneau des suggestions prend le relais.
       */}
      <main id="main-content" className="workspace" tabIndex={-1}>
        <div className="workspace-col workspace-col--travail">
          <CrPanel
            // `wrap` neutralise le clic quand le garde bloque : `aria-disabled`
            // laisse le bouton focusable (donc son motif atteignable), il ne
            // l'empêche pas de se déclencher.
            onAnalyze={analyzeGuard.wrap(handleAnalyze)}
            analyzeGuard={analyzeGuard}
            omsOfflineNotice={
              omsSkipped ? t('errors.oms.offlineSkipped') : null
            }
          />
          <SuggestionsPanel />
        </div>
        <div className="workspace-col workspace-col--retenus">
          <ValidatedPanel />
        </div>
      </main>

      {/* ICI, ET PAS DANS LA COQUILLE : un bandeau global paraîtrait
          par-dessus une tâche en cours ; sur l'accueil, l'utilisateur est au
          repos. Ne rend rien tant qu'une installation n'est pas possible, ni
          une fois l'application installée — et sur iOS, où l'événement natif
          n'existe pas, donne la marche à suivre. Cadence du socle : au premier
          lancement, puis une fois par mois, trois fois. */}
      <PwaInstallPrompt />
      <AppFooter />
    </>
  );
}
