/**
 * Catalogue de messages FR + EN de l'interface (chrome applicatif uniquement).
 *
 * Ce qui vit ici : navigation, écrans, boutons, libellés de formulaire,
 * placeholders, aria-labels, états vides, messages et erreurs.
 *
 * Ce qui N'y vit PAS : les libellés de codes CIM-10 / CIM-11 et les termes
 * diagnostiques officiels — ce sont des DONNÉES issues du jeu de codes.
 *
 * `fr` fait foi (locale de repli). `en` doit garder EXACTEMENT la même forme.
 * Les valeurs dynamiques passent par des placeholders `{nom}`.
 */
export const messages = {
  fr: {
    common: {
      appName: 'Mister CIM-10',
      cancel: 'Annuler',
      confirmTitle: 'Confirmation',
      alertTitle: 'Information',
      add: 'Ajouter',
      close: 'Fermer',
      validate: 'Valider',
      validated: 'Validé',
      reject: 'Rejeter',
      remove: 'Retirer',
      analyze: 'Analyser',
      share: 'Partager',
      email: 'E-mail',
    },
    language: {
      fr: 'Français',
      en: 'English',
    },
    nav: {
      home: 'Accueil',
      settings: 'Paramètres',
      help: 'Aide',
      primary: 'Navigation principale',
      brandHome: 'Accueil — Mister CIM-10',
    },
    doc: {
      home: 'Mister CIM-10',
      settings: 'Paramètres — Mister CIM-10',
      help: 'Aide — Mister CIM-10',
    },
    home: {
      taglineReady: 'Saisir · analyser · valider · exporter',
      taglineSetup: 'Du texte clinique aux codes — à valider et exporter',
      disclaimerReady:
        'Suggestions indicatives — vous restez responsable des codes retenus et des règles en vigueur.',
      disclaimerSetup:
        'Outil d’aide : les suggestions sont indicatives. Vous restez responsable du choix final des codes et du respect des règles de cotation en vigueur.',
      disclaimerHide: 'Masquer cet avertissement',
      setupLead:
        'Pour la première configuration, ouvrez Paramètres depuis la barre de navigation en bas de l’écran.',
      setupStepsLabel: 'Utilisation en trois étapes',
      setupStep1:
        '— source des suggestions (intégré, OMS ou les deux) et connexion OMS si besoin.',
      setupStep2: '— saisie ou dictée, puis Analyser.',
      setupStep3: '— retenir ou écarter les propositions, puis exporter.',
      validationLabel: 'Validation',
      dailyLabel: 'En pratique',
      dailyText: 'Texte',
      dailyValidateExport: 'Valider & exporter',
    },
    report: {
      title: 'Compte-rendu',
      placeholder: 'Ex. : Patient diabétique type 2, HTA, suivi pour BPCO…',
      ariaLabel: 'Texte du compte-rendu',
      analyzing: 'Analyse…',
      clear: 'Effacer le texte',
      newSession: 'Nouvelle session',
      dictationHint:
        'Vous pouvez dicter : micro du clavier sur mobile ou bouton Dictée si proposé.',
      resetConfirm:
        'Réinitialiser la session ? Le compte-rendu et les diagnostics validés seront effacés.',
    },
    results: {
      title: 'Suggestions',
      filterPlaceholder: 'Filtrer (code, libellé, terme repéré)',
      filterAria: 'Filtrer les suggestions',
      clearFilter: 'Effacer filtre',
      validateFiltered: 'Valider filtrées',
      rejectFiltered: 'Rejeter filtrées',
      shownOne: '{count} affichée',
      shownMany: '{count} affichées',
      analyzing: 'Analyse en cours…',
      emptyPristine:
        'Saisissez un compte-rendu, puis lancez l’analyse : les suggestions de codes s’afficheront ici.',
      emptyFiltered: 'Aucune suggestion ne correspond aux filtres actuels.',
      confidence: {
        high: 'Élevée',
        medium: 'Moyenne',
        low: 'Faible',
      },
      confidenceAria: 'Confiance {level}, {pct} %',
      matchedTerm: 'Terme repéré :',
      matchedTermTitle: 'Voir dans le compte-rendu',
      compare: 'Comparer',
      compareTitle: 'Voir le code parent et les codes apparentés',
      compareEmpty: 'Aucun code apparenté dans le référentiel embarqué.',
      parent: 'Parent',
      related: 'Apparenté',
      alreadyValidatedTitle: 'Déjà dans les diagnostics retenus',
      validateCodeTitle: 'Valider ce code',
      badgeIcd10: 'CIM-10',
      badgeIcd11: 'CIM-11',
      sourceApiTitle: 'Classification CIM-11 (OMS)',
      sourceLocalTitle: 'Dictionnaire CIM-10 embarqué',
    },
    validated: {
      title: 'Diagnostics retenus',
      empty: 'Les codes que vous retenez s’afficheront ici, prêts à exporter.',
      note: 'Note',
      notePlaceholder: 'Note libre…',
      addManual: '+ Ajouter un code manuellement',
      codePlaceholder: 'Code (ex. I10)',
      codeAria: 'Code CIM-10',
      labelPlaceholder: 'Libellé libre',
      labelAria: 'Libellé du diagnostic',
      duplicate: 'Ce code est déjà dans les diagnostics retenus.',
    },
    export: {
      clipboard: 'Presse-papiers',
      download: 'Télécharger',
      sendShare: 'Envoyer / partager',
      copyList: 'Copier la liste',
      copied: '✓ Copié',
      txt: 'Texte (.txt)',
      csv: 'Tableur (.csv)',
      json: 'JSON',
      printPdf: 'Imprimer / PDF',
      emailTitle: 'Ouvre votre messagerie avec un résumé texte',
      shareTitle: 'Menu Partager : envoi d’un fichier texte ou du contenu',
      hint: 'Texte (.txt) : fichier lisible (date, diagnostics, compte-rendu). JSON : données structurées avec annotations. E-mail / Partager : même contenu sous forme de texte simple.',
      reportTitle: 'Compte-rendu — Mister CIM-10 — {date}',
      reportValidatedHeading: 'Diagnostics retenus :',
      reportSourceHeading: 'Texte source :',
      reportEmpty: '(vide)',
      csvHeader: 'code,libellé,note,validé_le',
      emailSubject: 'Mister CIM-10 — diagnostics',
      shareDocTitle: 'Mister CIM-10 — diagnostics',
    },
    settings: {
      subTagline: 'Source des suggestions et connexion OMS',
      kicker: 'Configuration',
      title: 'Paramètres',
      leadBefore:
        'Choisissez comment les codes sont proposés, puis renseignez la connexion à l’OMS si vous l’activez. Pour obtenir un compte et des identifiants API, suivez le guide sur la page ',
      leadAfter: ' (section compte OMS).',
      modeSavedLabel: 'Mode enregistré',
      modeSummary: {
        local: 'CIM-10',
        api: 'OMS CIM-11',
        both: 'CIM-10 + CIM-11',
      },
      sourceTitle: 'Source des suggestions',
      modeLabel: 'Mode d’analyse',
      modeLocal: 'Dictionnaire local (CIM-10)',
      modeApi: 'OMS en ligne (CIM-11)',
      modeBoth: 'Les deux (CIM-10 + CIM-11)',
      modeHint:
        'Par défaut, tout se fait dans la page. Si vous choisissez une option avec OMS, les champs de connexion s’affichent : compte OMS et adresse de passerelle requis.',
      thresholdTitle: 'Seuil de confiance minimal',
      thresholdHint:
        'Les suggestions avec une confiance inférieure à ce seuil restent ignorées par défaut dans la liste.',
      thresholdFrom: 'Afficher à partir de',
      omsTitle: 'Connexion OMS (CIM-11)',
      omsResources: 'Ressources OMS',
      omsPortal: 'Portail ICD API',
      omsApiDoc: 'Documentation API',
      clientId: 'Identifiant',
      clientSecret: 'Mot secret',
      proxyUrl: 'Adresse de la passerelle',
      versionLangSummary: 'Version de la classification et langue',
      version: 'Version',
      labelLang: 'Langue des libellés',
      omsRisk:
        'Identifiants enregistrés dans ce navigateur (éviter sur poste partagé). La passerelle doit autoriser ce site.',
      forgetSecret: 'Oublier mot secret et session OMS',
      appearanceTitle: 'Apparence',
      themeLabel: 'Thème',
      languageLabel: 'Langue de l’application',
      disclaimerHiddenTitle: 'Avertissement masqué',
      disclaimerHiddenHint:
        'Réaffichez sur l’accueil l’avertissement que vous auriez masqué.',
      disclaimerShown: 'Avertissement réaffiché ✓',
      disclaimerReshow: 'Réafficher l’avertissement',
      dataTitle: 'Données',
      dataSummaryHint: 'Partage du paramétrage, sauvegarde et restauration',
      shareTitle: 'Partager le paramétrage',
      shareHint:
        'Génère un lien reprenant le mode d’analyse et la connexion OMS (identifiant, passerelle) — sans le mot secret, qui n’est jamais placé dans l’URL. Le destinataire saisit le sien.',
      shareButton: 'Partager ou copier le lien',
      backupTitle: 'Sauvegarde et Restauration',
      backupHint:
        'Téléchargez toutes vos données (favoris, historique, sessions, paramètres) dans un fichier pour les sauvegarder ou les transférer.',
      backupExport: 'Sauvegarder tout (.json)',
      backupImport: 'Restaurer tout…',
      appTitle: 'Application',
      appHint:
        'Une nouvelle version vous est annoncée par un bandeau. Si l’application vous semble figée sur une ancienne version, rechargez-la : le cache est vidé, vos données restent sur cet appareil.',
      appReload: 'Recharger l’application',
      appVersion: 'Mister CIM-10 v{version} · build {build}',
      familyTitle: 'Nos autres applications',
      familyHint: 'D’autres applications gratuites de la même famille.',
      shareDocTitle: 'Mister CIM-10 — paramétrage',
      importedFromLink:
        'Paramétrage importé depuis le lien — saisissez votre mot secret OMS.',
      restoreConfirm:
        'Restaurer les données ? Les paramètres et données actuels seront écrasés. L’application va redémarrer.',
      importError: 'Erreur lors de l’import. Fichier invalide.',
      linkShared: 'Lien partagé.',
      linkCopied: 'Lien copié dans le presse-papiers.',
      shareCancelled: 'Partage annulé.',
    },
    help: {
      subTagline: 'Guide d’utilisation et compte API OMS',
      title: 'Aide à l’utilisation',
      leadBefore:
        'Comment utiliser l’application au quotidien, et comment obtenir un ',
      leadStrong: 'compte développeur OMS',
      leadAfter:
        ' pour activer les suggestions issues du service de classification de l’OMS (ICD-11).',
      tocLabel: 'Sommaire',
      tocUse: 'Utiliser l’application',
      tocAccount: 'Créer un compte et une application API OMS',
      tocGateway: 'Passerelle et confidentialité',
      tocLinks: 'Liens utiles',
      use1Strong: 'Configurer la source des suggestions',
      use1Mid: 'dans la page ',
      use1After:
        ' : dictionnaire local CIM-10 (hors ligne), OMS en ligne (classification CIM-11), ou les deux combinés.',
      use2Strong: 'Saisir le compte-rendu',
      use2Mid: 'sur l’',
      use2Link: 'accueil',
      use2After:
        ', éventuellement à la voix (dictée du navigateur ou du clavier sur mobile).',
      use3: 'Cliquer sur Analyser pour obtenir des propositions de codes. Chaque carte peut être validée, modifiée ou rejetée.',
      use4: 'Les diagnostics retenus sont listés en bas de page ; vous pouvez les exporter en fichier texte simple (.txt) ou tableur (.csv), et les envoyer par e-mail ou via le partage du système.',
      useNote:
        'Les suggestions sont indicatives : vous restez responsable du choix final des codes et du respect des règles de cotation en vigueur.',
      accountTitle: 'Créer un compte pour utiliser l’API de l’OMS',
      accountIntro:
        'Pour que l’application interroge le service officiel de classification ICD-11 (MMS), l’OMS exige une authentification OAuth2 avec un identifiant client et un mot secret. Voici le déroulement habituel.',
      accountDetailsSummary:
        'Voir les étapes détaillées (compte, application client, identifiants)',
      accountStep1Title: '1. Créer un compte sur le portail ICD API',
      openPortal: 'Ouvrez le portail : ',
      accountStep1b:
        'Créez un compte (inscription) ou connectez-vous si vous en avez déjà un.',
      accountStep1c:
        'Acceptez les conditions d’usage du service API si demandé.',
      accountStep2Title: '2. Enregistrer une « application » client',
      accountStep2Intro:
        'L’OMS ne vous donne pas un simple mot de passe pour l’API : vous devez déclarer une application (souvent appelée « client ») qui représente votre usage automatisé (ici, cette page web).',
      accountStep2a:
        'Dans l’espace développeur du portail, créez une nouvelle application ou équivalent (libellé selon l’interface actuelle du site).',
      accountStep2b:
        'Choisissez le type d’authentification adapté à un serveur ou script : en général client credentials (identifiant + secret, sans interaction utilisateur à chaque requête).',
      accountStep2c:
        'À l’issue de la création, notez le Client ID et générez ou copiez le Client secret (mot secret). Le secret n’est souvent affiché qu’une fois : conservez-le dans un endroit sûr.',
      accountStep3Title: '3. Renseigner l’application Mister CIM-10',
      goTo: 'Allez dans ',
      accountStep3aAfter:
        ', activez un mode incluant l’OMS, puis collez l’identifiant et le mot secret fournis par le portail.',
      accountStep3b:
        'Renseignez aussi l’adresse de la passerelle (voir section suivante) : le navigateur ne peut pas appeler directement l’API OMS sans cette étape technique.',
      accountNoteBefore:
        'Les écrans exacts du portail OMS peuvent évoluer ; en cas de doute, consultez la ',
      accountNoteLink: 'documentation officielle de l’API ICD',
      accountNoteAfter: ' et les FAQ du portail.',
      gatewayTitle: 'Pourquoi une passerelle ?',
      gatewayP1:
        'Depuis une page web hébergée sur Internet, les navigateurs appliquent des règles de sécurité (CORS) qui empêchent en pratique d’appeler directement certains services distants, dont l’API de l’OMS. Une passerelle est un petit service intermédiaire (par ex. un Cloudflare Worker) que vous déployez vous-même : il reçoit les requêtes de cette application et les transmet à l’OMS de façon autorisée.',
      gatewayP2a:
        'Le dépôt du projet contient un exemple de passerelle et un guide dans le dossier ',
      gatewayP2b: ' (fichier proxy et ',
      gatewayP2c:
        '). Vous devez y configurer l’origine exacte de ce site (URL de la page) pour que le navigateur puisse l’utiliser.',
      gatewayNote:
        'Tant que vous n’utilisez que le mode intégré, aucune donnée clinique n’est envoyée vers l’OMS ; l’activation de l’OMS envoie des extraits de texte au service de classification selon votre analyse.',
      linkPortal: 'Portail ICD API (inscription / applications)',
      linkApiDoc: 'Documentation API ICD (version 2)',
      backHome: 'Retour à l’accueil',
    },
    errors: {
      configure:
        'Configurez d’abord la source des suggestions dans les Paramètres.',
      emptyReport: 'Saisissez un compte-rendu avant de lancer l’analyse.',
      oms: {
        proxyUnreachable: 'Passerelle injoignable — vérifiez l’URL du proxy.',
        credentialsRejected:
          'Identifiants OMS refusés (Client ID / mot secret).',
        corsForbidden: 'Origine non autorisée par la passerelle (CORS).',
        authFailed: 'Authentification OMS impossible (HTTP {status}).',
        authInvalid: 'Réponse d’authentification OMS invalide.',
        proxyUnreachableAnalyze:
          'Passerelle injoignable pendant l’analyse OMS.',
        sessionExpired: 'Session OMS expirée — relancez l’analyse.',
        analyzeFailed: 'Erreur OMS pendant l’analyse (HTTP {status}).',
        unknown: 'Erreur inattendue pendant l’analyse.',
      },
    },
    pwa: {
      updateAvailable: '🎨 Nouveau logo ! Une mise à jour est disponible.',
      updateAction: 'Mettre à jour',
    },
    footer: {
      privacy:
        'Aucune donnée clinique n’est stockée sur nos serveurs : compte-rendu et analyse restent dans votre navigateur. Rien n’est envoyé à nos serveurs tant que vous n’activez pas la connexion OMS ; seuls vos réglages peuvent être mémorisés localement sur cet appareil.',
      source: 'Code source sur GitHub',
      // L'émoji ☕ est retiré : le composant du socle rend déjà une icône tasse
      // devant le libellé, on affichait deux cafés côte à côte.
      coffee: 'Buy me a coffee',
    },
  },
  en: {
    common: {
      appName: 'Mister CIM-10',
      cancel: 'Cancel',
      confirmTitle: 'Confirmation',
      alertTitle: 'Information',
      add: 'Add',
      close: 'Close',
      validate: 'Validate',
      validated: 'Validated',
      reject: 'Reject',
      remove: 'Remove',
      analyze: 'Analyze',
      share: 'Share',
      email: 'Email',
    },
    language: {
      fr: 'Français',
      en: 'English',
    },
    nav: {
      home: 'Home',
      settings: 'Settings',
      help: 'Help',
      primary: 'Main navigation',
      brandHome: 'Home — Mister CIM-10',
    },
    doc: {
      home: 'Mister CIM-10',
      settings: 'Settings — Mister CIM-10',
      help: 'Help — Mister CIM-10',
    },
    home: {
      taglineReady: 'Enter · analyze · validate · export',
      taglineSetup:
        'From clinical text to codes — ready to validate and export',
      disclaimerReady:
        'Suggestions are indicative — you remain responsible for the codes you keep and the applicable rules.',
      disclaimerSetup:
        'Assistive tool: suggestions are indicative. You remain responsible for the final choice of codes and for complying with the applicable coding rules.',
      disclaimerHide: 'Hide this notice',
      setupLead:
        'For first-time setup, open Settings from the navigation bar at the bottom of the screen.',
      setupStepsLabel: 'Three-step usage',
      setupStep1:
        '— suggestion source (built-in, WHO, or both) and WHO connection if needed.',
      setupStep2: '— type or dictate, then Analyze.',
      setupStep3: '— keep or discard the suggestions, then export.',
      validationLabel: 'Validation',
      dailyLabel: 'In practice',
      dailyText: 'Text',
      dailyValidateExport: 'Validate & export',
    },
    report: {
      title: 'Report',
      placeholder:
        'e.g. Type 2 diabetic patient, hypertension, followed for COPD…',
      ariaLabel: 'Report text',
      analyzing: 'Analyzing…',
      clear: 'Clear text',
      newSession: 'New session',
      dictationHint:
        'You can dictate: use your keyboard microphone on mobile, or a Dictation button if available.',
      resetConfirm:
        'Reset the session? The report and validated diagnoses will be cleared.',
    },
    results: {
      title: 'Suggestions',
      filterPlaceholder: 'Filter (code, label, matched term)',
      filterAria: 'Filter suggestions',
      clearFilter: 'Clear filter',
      validateFiltered: 'Validate filtered',
      rejectFiltered: 'Reject filtered',
      shownOne: '{count} shown',
      shownMany: '{count} shown',
      analyzing: 'Analyzing…',
      emptyPristine:
        'Enter a report, then run the analysis: code suggestions will appear here.',
      emptyFiltered: 'No suggestion matches the current filters.',
      confidence: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      confidenceAria: 'Confidence {level}, {pct}%',
      matchedTerm: 'Matched term:',
      matchedTermTitle: 'View in the report',
      compare: 'Compare',
      compareTitle: 'View the parent code and related codes',
      compareEmpty: 'No related code in the built-in reference.',
      parent: 'Parent',
      related: 'Related',
      alreadyValidatedTitle: 'Already in the kept diagnoses',
      validateCodeTitle: 'Validate this code',
      badgeIcd10: 'ICD-10',
      badgeIcd11: 'ICD-11',
      sourceApiTitle: 'ICD-11 classification (WHO)',
      sourceLocalTitle: 'Built-in ICD-10 dictionary',
    },
    validated: {
      title: 'Kept diagnoses',
      empty: 'The codes you keep will appear here, ready to export.',
      note: 'Note',
      notePlaceholder: 'Free note…',
      addManual: '+ Add a code manually',
      codePlaceholder: 'Code (e.g. I10)',
      codeAria: 'ICD-10 code',
      labelPlaceholder: 'Free label',
      labelAria: 'Diagnosis label',
      duplicate: 'This code is already in the kept diagnoses.',
    },
    export: {
      clipboard: 'Clipboard',
      download: 'Download',
      sendShare: 'Send / share',
      copyList: 'Copy list',
      copied: '✓ Copied',
      txt: 'Text (.txt)',
      csv: 'Spreadsheet (.csv)',
      json: 'JSON',
      printPdf: 'Print / PDF',
      emailTitle: 'Opens your email app with a text summary',
      shareTitle: 'Share menu: send a text file or the content',
      hint: 'Text (.txt): readable file (date, diagnoses, report). JSON: structured data with annotations. Email / Share: the same content as plain text.',
      reportTitle: 'Report — Mister CIM-10 — {date}',
      reportValidatedHeading: 'Kept diagnoses:',
      reportSourceHeading: 'Source text:',
      reportEmpty: '(empty)',
      csvHeader: 'code,label,note,validated_at',
      emailSubject: 'Mister CIM-10 — diagnoses',
      shareDocTitle: 'Mister CIM-10 — diagnoses',
    },
    settings: {
      subTagline: 'Suggestion source and WHO connection',
      kicker: 'Configuration',
      title: 'Settings',
      leadBefore:
        'Choose how codes are suggested, then fill in the WHO connection if you enable it. To get an account and API credentials, follow the guide on the ',
      leadAfter: ' page (WHO account section).',
      modeSavedLabel: 'Saved mode',
      modeSummary: {
        local: 'ICD-10',
        api: 'WHO ICD-11',
        both: 'ICD-10 + ICD-11',
      },
      sourceTitle: 'Suggestion source',
      modeLabel: 'Analysis mode',
      modeLocal: 'Local dictionary (ICD-10)',
      modeApi: 'WHO online (ICD-11)',
      modeBoth: 'Both (ICD-10 + ICD-11)',
      modeHint:
        'By default, everything happens in the page. If you choose an option with WHO, the connection fields appear: WHO account and gateway address required.',
      thresholdTitle: 'Minimum confidence threshold',
      thresholdHint:
        'Suggestions with a confidence below this threshold stay hidden from the list by default.',
      thresholdFrom: 'Show from',
      omsTitle: 'WHO connection (ICD-11)',
      omsResources: 'WHO resources',
      omsPortal: 'ICD API portal',
      omsApiDoc: 'API documentation',
      clientId: 'Client ID',
      clientSecret: 'Client secret',
      proxyUrl: 'Gateway address',
      versionLangSummary: 'Classification version and language',
      version: 'Version',
      labelLang: 'Label language',
      omsRisk:
        'Credentials saved in this browser (avoid on shared computers). The gateway must allow this site.',
      forgetSecret: 'Forget client secret and WHO session',
      appearanceTitle: 'Appearance',
      themeLabel: 'Theme',
      languageLabel: 'App language',
      disclaimerHiddenTitle: 'Hidden notice',
      disclaimerHiddenHint:
        'Show again on the home screen the notice you may have hidden.',
      disclaimerShown: 'Notice shown again ✓',
      disclaimerReshow: 'Show the notice again',
      dataTitle: 'Data',
      dataSummaryHint: 'Settings sharing, backup and restore',
      shareTitle: 'Share settings',
      shareHint:
        'Generates a link with the analysis mode and WHO connection (client ID, gateway) — without the client secret, which is never placed in the URL. The recipient enters their own.',
      shareButton: 'Share or copy the link',
      backupTitle: 'Backup and restore',
      backupHint:
        'Download all your data (favorites, history, sessions, settings) to a file to back it up or transfer it.',
      backupExport: 'Back up everything (.json)',
      backupImport: 'Restore everything…',
      appTitle: 'Application',
      appHint:
        'A banner announces each new version. If the app seems stuck on an old version, reload it: the cache is cleared, your data stays on this device.',
      appReload: 'Reload the app',
      appVersion: 'Mister CIM-10 v{version} · build {build}',
      familyTitle: 'Our other apps',
      familyHint: 'More free apps from the same family.',
      shareDocTitle: 'Mister CIM-10 — settings',
      importedFromLink:
        'Settings imported from the link — enter your WHO client secret.',
      restoreConfirm:
        'Restore data? Current settings and data will be overwritten. The app will restart.',
      importError: 'Import failed. Invalid file.',
      linkShared: 'Link shared.',
      linkCopied: 'Link copied to the clipboard.',
      shareCancelled: 'Sharing cancelled.',
    },
    help: {
      subTagline: 'User guide and WHO API account',
      title: 'Usage help',
      leadBefore: 'How to use the app day to day, and how to get a ',
      leadStrong: 'WHO developer account',
      leadAfter:
        ' to enable suggestions from the WHO classification service (ICD-11).',
      tocLabel: 'Contents',
      tocUse: 'Using the app',
      tocAccount: 'Create a WHO API account and application',
      tocGateway: 'Gateway and privacy',
      tocLinks: 'Useful links',
      use1Strong: 'Set the suggestion source',
      use1Mid: 'in the ',
      use1After:
        ' page: local ICD-10 dictionary (offline), WHO online (ICD-11 classification), or both combined.',
      use2Strong: 'Enter the report',
      use2Mid: 'on the ',
      use2Link: 'home page',
      use2After:
        ', optionally by voice (browser or mobile keyboard dictation).',
      use3: 'Click Analyze to get code suggestions. Each card can be validated, edited, or rejected.',
      use4: 'The kept diagnoses are listed at the bottom of the page; you can export them as a plain text file (.txt) or spreadsheet (.csv), and send them by email or via the system share.',
      useNote:
        'Suggestions are indicative: you remain responsible for the final choice of codes and for complying with the applicable coding rules.',
      accountTitle: 'Create an account to use the WHO API',
      accountIntro:
        'For the app to query the official ICD-11 (MMS) classification service, the WHO requires OAuth2 authentication with a client ID and a client secret. Here is the usual process.',
      accountDetailsSummary:
        'See the detailed steps (account, client application, credentials)',
      accountStep1Title: '1. Create an account on the ICD API portal',
      openPortal: 'Open the portal: ',
      accountStep1b:
        'Create an account (sign up) or log in if you already have one.',
      accountStep1c: 'Accept the API service terms of use if prompted.',
      accountStep2Title: '2. Register a client “application”',
      accountStep2Intro:
        'The WHO does not give you a simple password for the API: you must declare an application (often called a “client”) that represents your automated usage (here, this web page).',
      accountStep2a:
        'In the portal developer area, create a new application or equivalent (wording depends on the current interface of the site).',
      accountStep2b:
        'Choose the authentication type suited to a server or script: usually client credentials (ID + secret, with no user interaction on each request).',
      accountStep2c:
        'Once created, note the Client ID and generate or copy the Client secret. The secret is often shown only once: keep it somewhere safe.',
      accountStep3Title: '3. Fill in the Mister CIM-10 app',
      goTo: 'Go to ',
      accountStep3aAfter:
        ', enable a mode that includes WHO, then paste the client ID and client secret provided by the portal.',
      accountStep3b:
        'Also fill in the gateway address (see the next section): the browser cannot call the WHO API directly without this technical step.',
      accountNoteBefore:
        'The exact WHO portal screens may change; when in doubt, see the ',
      accountNoteLink: 'official ICD API documentation',
      accountNoteAfter: ' and the portal FAQs.',
      gatewayTitle: 'Why a gateway?',
      gatewayP1:
        'From a web page hosted on the Internet, browsers apply security rules (CORS) that in practice prevent calling certain remote services directly, including the WHO API. A gateway is a small intermediary service (e.g. a Cloudflare Worker) that you deploy yourself: it receives this app requests and forwards them to the WHO in an authorized way.',
      gatewayP2a:
        'The project repository contains an example gateway and a guide in the ',
      gatewayP2b: ' folder (proxy file and ',
      gatewayP2c:
        '). You must configure the exact origin of this site there (the page URL) so the browser can use it.',
      gatewayNote:
        'As long as you use only the built-in mode, no clinical data is sent to the WHO; enabling WHO sends text excerpts to the classification service based on your analysis.',
      linkPortal: 'ICD API portal (sign-up / applications)',
      linkApiDoc: 'ICD API documentation (version 2)',
      backHome: 'Back to home',
    },
    errors: {
      configure: 'First set the suggestion source in Settings.',
      emptyReport: 'Enter a report before running the analysis.',
      oms: {
        proxyUnreachable: 'Gateway unreachable — check the proxy URL.',
        credentialsRejected: 'WHO credentials rejected (Client ID / secret).',
        corsForbidden: 'Origin not allowed by the gateway (CORS).',
        authFailed: 'WHO authentication failed (HTTP {status}).',
        authInvalid: 'Invalid WHO authentication response.',
        proxyUnreachableAnalyze: 'Gateway unreachable during WHO analysis.',
        sessionExpired: 'WHO session expired — run the analysis again.',
        analyzeFailed: 'WHO error during analysis (HTTP {status}).',
        unknown: 'Unexpected error during analysis.',
      },
    },
    pwa: {
      updateAvailable: '🎨 New logo! An update is available.',
      updateAction: 'Update',
    },
    footer: {
      privacy:
        'No clinical data is stored on our servers: the report and analysis stay in your browser. Nothing is sent to our servers until you enable the WHO connection; only your settings may be saved locally on this device.',
      source: 'Source code on GitHub',
      coffee: 'Buy me a coffee',
    },
  },
} as const;

export type Locale = keyof typeof messages;
export type Messages = (typeof messages)['fr'];
