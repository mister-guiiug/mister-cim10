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
  const setAnalyzeNotice = useWorkspaceStore(s => s.setAnalyzeNotice);
  const crText = useWorkspaceStore(s => s.crText);
  const who = useSettingsStore(s => s.who);
  const { t } = useI18n();

  /**
   * DEUX RÉFÉRENTIELS, PLUS AUCUN CHOIX À FAIRE.
   *
   * Il y avait un sélecteur à trois modes — local, OMS, les deux — et un garde
   * qui désactivait « Analyser » hors connexion en mode OMS seul. C'était
   * demander à un professionnel d'arbitrer entre deux classifications avant
   * d'obtenir le moindre code, et le mode par défaut (`local`) faisait que
   * l'OMS, pourtant livrée, ne servait à personne.
   *
   * L'analyse interroge donc les deux, toujours : le dictionnaire CIM-10
   * embarqué, immédiat, puis la passerelle OMS (CIM-11) quand elle est
   * joignable. Le dictionnaire porte seul le résultat quand le réseau manque —
   * et le dit. « Analyser » n'est plus jamais désactivé : il y a toujours
   * quelque chose à produire.
   */
  const isOnline = useOnline();

  /** La passerelle est-elle interrogeable ? Réseau ET adresse configurée. */
  const omsJoignable = isOnline && who.proxyUrl.trim() !== '';

  const handleAnalyze = async () => {
    if (!crText.trim()) {
      setAnalyzeError(t('errors.emptyReport'));
      return;
    }
    setAnalyzeError(null);
    setAnalyzeNotice(null);
    setIsAnalyzing(true);
    /*
     * L'ANALYSE, MESURÉE PAR SON ISSUE.
     *
     * La ventilation par `mode` a disparu avec le sélecteur. Reste `oms`, qui
     * dit si la passerelle a été interrogée : elle est le point faible connu de
     * l'app, et c'est la seule chose qu'on ait besoin de savoir.
     *
     * RIEN D'AUTRE NE PART. Ni le compte-rendu, ni sa longueur, ni le nombre
     * de codes trouvés, ni leur nature. Chacune de ces mesures serait un pas
     * vers le texte clinique, et c'est exactement ce que l'ADR 0012 refuse.
     */
    trackEvent(GESTES.OPERATION, {
      nom: 'analyse',
      etape: 'lancee',
      oms: omsJoignable,
    });
    /*
     * DÉCLARÉ HORS DU `try`. Le dictionnaire local remplit `results` AVANT que
     * la passerelle soit interrogée : tant que cette variable vivait dans le
     * `try`, l'échec réseau emportait avec lui des résultats déjà calculés.
     */
    const results: AnalysisResult[] = suggestFromText(crText);
    try {
      if (omsJoignable) {
        results.push(...(await suggestFromOms(crText, who)));
      } else {
        // Le repli est ANNONCÉ, jamais silencieux : sur un outil de cotation,
        // savoir quel référentiel a répondu fait partie du résultat.
        setAnalyzeNotice(
          isOnline
            ? t('errors.oms.notConfigured')
            : t('errors.oms.offlineSkipped')
        );
      }
      setSuggestions(classerParConfiance(results));
      trackEvent(GESTES.OPERATION, {
        nom: 'analyse',
        etape: 'reussie',
        oms: omsJoignable,
      });
    } catch (err) {
      /*
       * UN ÉCHEC DE L'OMS N'EST PAS UN ÉCHEC DE L'ANALYSE. Le dictionnaire a
       * déjà répondu quand la passerelle lève : ses codes sont publiés, et le
       * message ne dit que ce qui manque. Avant, ce `catch` n'appelait jamais
       * `setSuggestions` — l'utilisateur voyait une erreur nue là où la moitié
       * locale de son analyse était prête.
       */
      trackEvent(GESTES.OPERATION, {
        nom: 'analyse',
        etape: 'echouee',
        oms: omsJoignable,
      });
      setSuggestions(classerParConfiance(results));
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
          {/* PLUS DE GARDE `useActionGuard` : il désactivait « Analyser » hors
              connexion en mode OMS seul. Ce mode n'existe plus, le dictionnaire
              embarqué répond toujours, et un bouton d'analyse qu'on ne peut pas
              presser sur un outil de cotation était le pire des deux mondes. Le
              motif du repli passe par `analyzeNotice`, que `CrPanel` lit. */}
          <CrPanel onAnalyze={handleAnalyze} />
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
