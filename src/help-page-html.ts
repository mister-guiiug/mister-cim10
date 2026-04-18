/**
 * Corps principal de la page Aide (à placer dans &lt;main&gt;). Texte statique ; toute donnée dynamique doit être échappée.
 * @param {import('./html-utils.js').escapeHtml} escapeHtml
 */
export function buildHelpPageMainHtml(escapeHtml) {
  const portal = 'https://icd.who.int/icdapi';
  const docApi = 'https://icd.who.int/docs/icd-api/APIDoc-Version2/';

  return `
    <main id="main-content" class="page-main help-page" tabindex="-1">
      <header class="page-hero">
        <h1 class="page-title">Aide à l’utilisation</h1>
        <p class="page-lead">
          Comment utiliser l’application au quotidien, et comment obtenir un <strong>compte développeur OMS</strong> pour activer les suggestions issues du service de classification de l’OMS (ICD-11).
        </p>
      </header>

      <nav class="help-toc" aria-label="Sommaire">
        <span class="help-toc-label">Sommaire</span>
        <ul class="help-toc-list">
          <li><a href="#aide-utilisation">Utiliser l’application</a></li>
          <li><a href="#aide-compte-oms">Créer un compte et une application API OMS</a></li>
          <li><a href="#aide-passerelle">Passerelle et confidentialité</a></li>
          <li><a href="#aide-liens">Liens utiles</a></li>
        </ul>
      </nav>

      <article class="help-article" id="aide-utilisation">
        <h2 class="help-h2">Utiliser l’application</h2>
        <ol class="help-steps">
          <li>
            <strong>Configurer la source des suggestions</strong> dans la page <a href="#/parametres">Paramètres</a> : intégré uniquement (sans connexion réseau vers l’OMS), OMS uniquement, ou les deux combinés.
          </li>
          <li>
            <strong>Saisir le compte-rendu</strong> sur l’<a href="#/">accueil</a>, éventuellement à la voix (dictée du navigateur ou du clavier sur mobile).
          </li>
          <li>
            Cliquer sur <strong>Analyser</strong> pour obtenir des propositions de codes. Chaque carte peut être <strong>validée</strong>, <strong>modifiée</strong> ou <strong>rejetée</strong>.
          </li>
          <li>
            Les diagnostics retenus sont listés en bas de page ; vous pouvez les <strong>exporter</strong> en fichier texte simple (.txt) ou tableur (.csv), et les envoyer par e-mail ou via le partage du système.
          </li>
        </ol>
        <p class="help-note">
          Les suggestions sont <strong>indicatives</strong> : vous restez responsable du choix final des codes et du respect des règles de cotation en vigueur dans votre contexte.
        </p>
      </article>

      <article class="help-article" id="aide-compte-oms">
        <h2 class="help-h2">Créer un compte pour utiliser l’API de l’OMS</h2>
        <p>
          Pour que l’application interroge le service officiel de classification ICD-11 (MMS), l’OMS exige une <strong>authentification OAuth2</strong> avec un identifiant client et un mot secret. Voici le déroulement habituel.
        </p>

        <h3 class="help-h3">1. Créer un compte sur le portail ICD API</h3>
        <ul class="help-list">
          <li>Ouvrez le portail : <a href="${portal}" target="_blank" rel="noopener noreferrer">${escapeHtml(portal)}</a>.</li>
          <li>Créez un compte (inscription) ou connectez-vous si vous en avez déjà un.</li>
          <li>Acceptez les conditions d’usage du service API si demandé.</li>
        </ul>

        <h3 class="help-h3">2. Enregistrer une « application » client</h3>
        <p>
          L’OMS ne vous donne pas un simple mot de passe pour l’API : vous devez déclarer une <strong>application</strong> (souvent appelée « client ») qui représente votre usage automatisé (ici, cette page web).
        </p>
        <ul class="help-list">
          <li>Dans l’espace développeur du portail, créez une <strong>nouvelle application</strong> ou équivalent (libellé selon l’interface actuelle du site).</li>
          <li>Choisissez le type d’authentification adapté à un serveur ou script : en général <strong>client credentials</strong> (identifiant + secret, sans interaction utilisateur à chaque requête).</li>
          <li>À l’issue de la création, notez le <strong>Client ID</strong> et générez ou copiez le <strong>Client secret</strong> (mot secret). Le secret n’est souvent affiché qu’une fois : conservez-le dans un endroit sûr.</li>
        </ul>

        <h3 class="help-h3">3. Renseigner l'application Mister CIM-10</h3>
        <ul class="help-list">
          <li>Allez dans <a href="#/parametres">Paramètres</a>, activez un mode incluant l’OMS, puis collez l’<strong>identifiant</strong> et le <strong>mot secret</strong> fournis par le portail.</li>
          <li>Renseignez aussi l’<strong>adresse de la passerelle</strong> (voir section suivante) : le navigateur ne peut pas appeler directement l’API OMS sans cette étape technique.</li>
        </ul>

        <p class="help-note">
          Les écrans exacts du portail OMS peuvent évoluer ; en cas de doute, consultez la <a href="${docApi}" target="_blank" rel="noopener noreferrer">documentation officielle de l’API ICD</a> et les FAQ du portail.
        </p>
      </article>

      <article class="help-article" id="aide-passerelle">
        <h2 class="help-h2">Pourquoi une passerelle ?</h2>
        <p>
          Depuis une page web hébergée sur Internet, les navigateurs appliquent des règles de sécurité (CORS) qui empêchent en pratique d’appeler directement certains services distants, dont l’API de l’OMS. Une <strong>passerelle</strong> est un petit service intermédiaire (par ex. un Cloudflare Worker) que vous déployez vous-même : il reçoit les requêtes de cette application et les transmet à l’OMS de façon autorisée.
        </p>
        <p>
          Le dépôt du projet contient un exemple de passerelle et un guide dans le dossier <code class="help-code">workers/</code> (fichier proxy et <code class="help-code">README</code>). Vous devez y configurer l’<strong>origine exacte</strong> de ce site (URL de la page) pour que le navigateur puisse l’utiliser.
        </p>
        <p class="help-note">
          Tant que vous n’utilisez que le mode <strong>intégré</strong>, aucune donnée clinique n’est envoyée vers l’OMS ; l’activation de l’OMS envoie des extraits de texte au service de classification selon votre analyse.
        </p>
      </article>

      <article class="help-article" id="aide-liens">
        <h2 class="help-h2">Liens utiles</h2>
        <ul class="help-list help-list--links">
          <li><a href="${portal}" target="_blank" rel="noopener noreferrer">Portail ICD API (inscription / applications)</a></li>
          <li><a href="${docApi}" target="_blank" rel="noopener noreferrer">Documentation API ICD (version 2)</a></li>
          <li><a href="#/">Retour à l’accueil</a> · <a href="#/parametres">Paramètres</a></li>
        </ul>
      </article>
    </main>
  `;
}
