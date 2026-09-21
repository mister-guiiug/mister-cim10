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
      disclaimerReady:
        'Suggestions indicatives — vous restez responsable des codes retenus et des règles en vigueur.',
      disclaimerHide: 'Masquer cet avertissement',
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
    sessions: {
      title: 'Dossiers enregistrés',
      countOne: '{count} dossier',
      countMany: '{count} dossiers',
      namePlaceholder: 'Nom du dossier (ex. séjour du 12/05)',
      nameAria: 'Nom du dossier à enregistrer',
      save: 'Enregistrer',
      saved: 'Dossier enregistré ✓',
      replaced: 'Dossier du même nom remplacé ✓',
      opened: '« {name} » rouvert.',
      deleted: '« {name} » supprimé.',
      open: 'Rouvrir',
      empty:
        'Aucun dossier enregistré. Donnez un nom au travail en cours pour le retrouver plus tard.',
      nothingToSave:
        'Rien à enregistrer pour l’instant : saisissez un compte-rendu ou retenez un diagnostic.',
      full: '{max} dossiers au maximum : enregistrer en fait sortir le plus ancien.',
      meta: '{date} · {count} diagnostic(s)',
      openConfirm:
        'Rouvrir « {name} » ? Le compte-rendu et les diagnostics en cours seront remplacés.',
      deleteConfirm: 'Supprimer définitivement le dossier « {name} » ?',
    },
    search: {
      title: 'Ajouter un code absent du compte-rendu',
      placeholder: 'Chercher par libellé ou par code (ex. diabète, E11)',
      aria: 'Chercher un code à ajouter',
      hint: 'Ce champ interroge le référentiel embarqué — il ne filtre pas les suggestions. Le référentiel est un échantillon.',
      clear: 'Effacer',
      exact: 'Trouvé',
      approx: 'Approchant',
      resultsOne: '{count} code trouvé',
      resultsMany: '{count} codes trouvés',
      resultsAria: 'Résultats de la recherche de codes',
      empty: 'Aucun code du référentiel embarqué ne correspond à « {query} ».',
    },
    results: {
      title: 'Suggestions',
      filterPlaceholder: 'Filtrer les suggestions ci-dessous',
      filterAria: 'Filtrer les suggestions déjà proposées',
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
      announceValidated: '{code} retenu.',
      announceRejected: '{code} rejeté.',
      retainedOne: '{count} diagnostic retenu',
      retainedMany: '{count} diagnostics retenus',
      retainedSee: 'Voir',
      precisionsTitle: 'Autres précisions pour « {terme} »',
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
      subTagline: 'Finesse des suggestions et connexion OMS',
      kicker: 'Configuration',
      title: 'Paramètres',
      leadBefore:
        'Réglez la finesse des suggestions, et la connexion à l’OMS si vous utilisez votre propre compte. Pour en obtenir un, suivez le guide sur la page ',
      leadAfter: ' (section compte OMS).',
      sourceTitle: 'Suggestions',
      sourceHint:
        'L’analyse interroge les deux référentiels : le dictionnaire CIM-10 embarqué, qui répond dans la page, et l’OMS (CIM-11) par la passerelle. Hors connexion, le dictionnaire répond seul et l’application vous le dit. Les suggestions de l’OMS supposent que des segments du compte-rendu partent vers ses serveurs.',
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
      omsPreconfigured:
        'L’application est déjà reliée à un compte OMS, côté passerelle : laissez ces champs vides et tout fonctionne. Les remplir SUBSTITUE le vôtre — vos identifiants portent alors chaque requête, sous vos propres quotas OMS. Les deux vont ensemble : un identifiant sans mot secret est refusé. Videz-les pour revenir au compte fourni.',
      versionLangSummary: 'Version de la classification et langue',
      version: 'Version',
      labelLang: 'Langue des libellés',
      omsRisk:
        'Un compte saisi ici est enregistré dans ce navigateur : à éviter sur un poste partagé. Le mot secret ne quitte jamais l’appareil — ni dans un lien partagé, ni dans une sauvegarde.',
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
        'Génère un lien reprenant votre identifiant OMS, la version de la classification et la langue des libellés. Ni le mot secret ni l’adresse de la passerelle n’y figurent : le premier ne doit jamais voyager, la seconde vient déjà de l’installation du destinataire.',
      shareButton: 'Partager ou copier le lien',
      backupTitle: 'Sauvegarde et Restauration',
      backupHint:
        'Téléchargez vos données (compte-rendu en cours, diagnostics retenus, paramètres) dans un fichier pour les sauvegarder ou les transférer. Le mot secret OMS n’y figure pas : saisissez-le à nouveau sur l’appareil restauré.',
      backupExport: 'Sauvegarder tout (.json)',
      backupImport: 'Restaurer tout…',
      appTitle: 'Application',
      appHint:
        'Une nouvelle version vous est annoncée par un bandeau. Si l’application vous semble figée sur une ancienne version, rechargez-la : le cache est vidé, vos données restent sur cet appareil.',
      appReload: 'Recharger l’application',
      familyTitle: 'Nos autres applications',
      familySummaryHint: 'Dix-neuf applications gratuites de la même famille',
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
      useLead:
        'Rien à configurer pour commencer : le dictionnaire CIM-10 est embarqué et répond hors connexion.',
      use1Strong: 'Configurer la source des suggestions',
      use1Mid: 'dans la page ',
      use1After:
        ' : dictionnaire local CIM-10 (hors ligne), OMS en ligne (classification CIM-11), ou les deux combinés.',
      use2Strong: 'Saisir le compte-rendu',
      use2Mid: 'sur l’',
      use2Link: 'accueil',
      use2After:
        ', éventuellement à la voix (dictée du navigateur ou du clavier sur mobile).',
      use3: 'Cliquer sur Analyser pour obtenir des propositions de codes.',
      use4: 'Retenir ou écarter chaque proposition. Le focus suit la liste : on peut enchaîner au clavier sans quitter les boutons.',
      use5: 'Les diagnostics retenus s’affichent à côté des suggestions sur grand écran, et sous elles sinon ; vous pouvez les exporter en texte (.txt) ou tableur (.csv), et les envoyer par e-mail ou via le partage du système.',
      useSourceNoteBefore:
        'Pour ajouter la classification CIM-11 de l’OMS aux suggestions, voir « Aller plus loin » ci-dessous, puis la page ',
      useSourceNoteAfter: '. Ce n’est pas nécessaire pour coter.',
      useNote:
        'Les suggestions sont indicatives : vous restez responsable du choix final des codes et du respect des règles de cotation en vigueur.',
      advancedTitle: 'Aller plus loin : utiliser votre propre compte OMS',
      advancedHint: 'Facultatif — l’application est déjà reliée à un compte',
      accountTitle: 'Créer un compte pour utiliser l’API de l’OMS',
      accountIntro:
        'L’application interroge déjà le service officiel de classification ICD-11 (MMS) avec un compte fourni : vous n’avez rien à créer pour vous en servir. Créez le vôtre seulement si vous préférez que vos requêtes partent sous vos identifiants et vos quotas. L’OMS demande alors une authentification OAuth2 — identifiant client et mot secret. Voici le déroulement habituel.',
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
        ', section « Connexion OMS », puis collez l’identifiant et le mot secret fournis par le portail. Ils remplacent le compte fourni ; videz les deux champs pour y revenir.',
      accountNoteBefore:
        'Les écrans exacts du portail OMS peuvent évoluer ; en cas de doute, consultez la ',
      accountNoteLink: 'documentation officielle de l’API ICD',
      accountNoteAfter: ' et les FAQ du portail.',
      gatewayTitle: 'Pourquoi une passerelle ?',
      gatewayP1:
        'Depuis une page web, les navigateurs appliquent des règles de sécurité (CORS) qui empêchent d’appeler directement l’API de l’OMS. Une passerelle est un petit service intermédiaire qui reçoit les requêtes de cette application et les transmet à l’OMS. Celle-ci est déployée AVEC le projet : vous n’avez rien à installer, et c’est elle qui porte le compte OMS par défaut.',
      gatewayP2a: 'Sa source et son guide sont dans le dossier ',
      gatewayP2b: ' du dépôt (fichier proxy et ',
      gatewayP2c:
        ') — utiles seulement si vous déployez votre propre copie de l’application. Son adresse doit alors être posée au build : la politique de sécurité du site ne laisse joindre que celle-là.',
      gatewayNote:
        'Le dictionnaire CIM-10 embarqué répond dans la page, sans réseau. Les suggestions de l’OMS supposent en revanche que des segments du compte-rendu partent vers ses serveurs — c’est le prix de la CIM-11.',
      linkPortal: 'Portail ICD API (inscription / applications)',
      linkApiDoc: 'Documentation API ICD (version 2)',
      backHome: 'Retour à l’accueil',
    },
    errors: {
      emptyReport: 'Saisissez un compte-rendu avant de lancer l’analyse.',
      oms: {
        proxyUnreachable:
          'Passerelle injoignable — vérifiez votre connexion, puis réessayez.',
        credentialsRejected:
          'Identifiants OMS refusés (Client ID / mot secret).',
        gatewayAccountMissing:
          'La passerelle n’a pas de compte OMS utilisable : la CIM-11 est indisponible. Vous pouvez saisir le vôtre dans les Paramètres.',
        corsForbidden: 'Origine non autorisée par la passerelle (CORS).',
        authFailed: 'Authentification OMS impossible (HTTP {status}).',
        authInvalid: 'Réponse d’authentification OMS invalide.',
        proxyUnreachableAnalyze:
          'Passerelle injoignable pendant l’analyse OMS.',
        sessionExpired: 'Session OMS expirée — relancez l’analyse.',
        analyzeFailed: 'Erreur OMS pendant l’analyse (HTTP {status}).',
        unknown: 'Erreur inattendue pendant l’analyse.',
        offlineSkipped:
          'Hors connexion : seul le dictionnaire CIM-10 local a répondu, la recherche OMS a été ignorée.',
        // Pas une erreur : l'app fonctionne, avec un référentiel sur deux. Elle
        // le dit parce que sur un outil de cotation, savoir QUELLE
        // classification a répondu fait partie du résultat.
        notConfigured:
          'Cette installation n’est pas reliée à l’OMS : seul le dictionnaire CIM-10 local a répondu. La passerelle se pose au déploiement, elle ne se règle pas depuis l’application.',
        // La passerelle a échoué, le dictionnaire local avait déjà répondu :
        // le message porte la raison exacte de l'échec ET dit que les codes
        // locaux sont toujours là, sinon l'alerte donne à croire que l'analyse
        // entière est perdue.
        localKept:
          '{raison} Les codes du dictionnaire CIM-10 local restent affichés.',
      },
    },
    footer: {
      privacy:
        'Aucune donnée clinique n’est stockée sur nos serveurs : compte-rendu et analyse restent dans votre navigateur. Quand la passerelle OMS répond, des segments du compte-rendu lui sont transmis pour obtenir la CIM-11 ; hors connexion, rien ne sort. Seuls vos réglages peuvent être mémorisés localement sur cet appareil.',
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
      disclaimerReady:
        'Suggestions are indicative — you remain responsible for the codes you keep and the applicable rules.',
      disclaimerHide: 'Hide this notice',
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
    sessions: {
      title: 'Saved cases',
      countOne: '{count} case',
      countMany: '{count} cases',
      namePlaceholder: 'Case name (e.g. stay of 12/05)',
      nameAria: 'Name of the case to save',
      save: 'Save',
      saved: 'Case saved ✓',
      replaced: 'Case with the same name replaced ✓',
      opened: '“{name}” reopened.',
      deleted: '“{name}” deleted.',
      open: 'Reopen',
      empty:
        'No saved case yet. Name the work in progress to find it again later.',
      nothingToSave:
        'Nothing to save yet: enter a report or keep a diagnosis first.',
      full: '{max} cases at most: saving pushes out the oldest one.',
      meta: '{date} · {count} diagnosis(es)',
      openConfirm:
        'Reopen “{name}”? The current report and diagnoses will be replaced.',
      deleteConfirm: 'Permanently delete the case “{name}”?',
    },
    search: {
      title: 'Add a code missing from the report',
      placeholder: 'Search by label or code (e.g. diabetes, E11)',
      aria: 'Search an ICD-10 code to add',
      hint: 'This field searches the built-in reference — it does not filter the suggestions. The reference is a sample.',
      clear: 'Clear',
      exact: 'Found',
      approx: 'Close match',
      resultsOne: '{count} code found',
      resultsMany: '{count} codes found',
      resultsAria: 'Code search results',
      empty: 'No code in the built-in reference matches “{query}”.',
    },
    results: {
      title: 'Suggestions',
      filterPlaceholder: 'Filter the suggestions below',
      filterAria: 'Filter the suggestions already proposed',
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
      announceValidated: '{code} retained.',
      announceRejected: '{code} rejected.',
      retainedOne: '{count} diagnosis retained',
      retainedMany: '{count} diagnoses retained',
      retainedSee: 'View',
      precisionsTitle: 'Other refinements for “{terme}”',
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
      subTagline: 'Suggestion tuning and WHO connection',
      kicker: 'Configuration',
      title: 'Settings',
      leadBefore:
        'Tune how fine the suggestions are, and the WHO connection if you use your own account. To get one, follow the guide on the ',
      leadAfter: ' page (WHO account section).',
      sourceTitle: 'Suggestions',
      sourceHint:
        'The analysis queries both references: the built-in ICD-10 dictionary, which answers in the page, and the WHO (ICD-11) through the gateway. Offline, the dictionary answers alone and the application says so. WHO suggestions mean segments of the report are sent to its servers.',
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
      omsPreconfigured:
        'The application is already linked to a WHO account, on the gateway side: leave these fields empty and everything works. Filling them SUBSTITUTES yours — your credentials then carry every request, under your own WHO quotas. Both go together: a client ID without a secret is rejected. Clear them to return to the provided account.',
      versionLangSummary: 'Classification version and language',
      version: 'Version',
      labelLang: 'Label language',
      omsRisk:
        'An account entered here is saved in this browser: avoid on shared computers. The client secret never leaves the device — not in a shared link, not in a backup.',
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
        'Generates a link carrying your WHO client ID, the classification version and the label language. Neither the client secret nor the gateway address is included: the first must never travel, the second already comes from the recipient’s own installation.',
      shareButton: 'Share or copy the link',
      backupTitle: 'Backup and restore',
      backupHint:
        'Download your data (current report, kept diagnoses, settings) to a file to back it up or transfer it. The WHO client secret is not included: enter it again on the restored device.',
      backupExport: 'Back up everything (.json)',
      backupImport: 'Restore everything…',
      appTitle: 'Application',
      appHint:
        'A banner announces each new version. If the app seems stuck on an old version, reload it: the cache is cleared, your data stays on this device.',
      appReload: 'Reload the app',
      familyTitle: 'Our other apps',
      familySummaryHint: 'Nineteen free apps from the same family',
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
      useLead:
        'Nothing to set up to get started: the ICD-10 dictionary is bundled and works offline.',
      use1Strong: 'Set the suggestion source',
      use1Mid: 'in the ',
      use1After:
        ' page: local ICD-10 dictionary (offline), WHO online (ICD-11 classification), or both combined.',
      use2Strong: 'Enter the report',
      use2Mid: 'on the ',
      use2Link: 'home page',
      use2After:
        ', optionally by voice (browser or mobile keyboard dictation).',
      use3: 'Click Analyze to get code suggestions.',
      use4: 'Keep or dismiss each suggestion. Focus follows the list: you can work through it from the keyboard without leaving the buttons.',
      use5: 'Kept diagnoses appear next to the suggestions on a wide screen, and below them otherwise; you can export them as text (.txt) or spreadsheet (.csv), and send them by email or via the system share.',
      useSourceNoteBefore:
        'To add the WHO ICD-11 classification to the suggestions, see “Going further” below, then the ',
      useSourceNoteAfter: ' page. It is not required for coding.',
      useNote:
        'Suggestions are indicative: you remain responsible for the final choice of codes and for complying with the applicable coding rules.',
      advancedTitle: 'Going further: using your own WHO account',
      advancedHint: 'Optional — the app is already linked to an account',
      accountTitle: 'Create an account to use the WHO API',
      accountIntro:
        'The app already queries the official ICD-11 (MMS) classification service with a provided account: you need not create anything to use it. Create your own only if you would rather your requests went under your credentials and quotas. The WHO then requires OAuth2 authentication — a client ID and a client secret. Here is the usual process.',
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
        ', “WHO connection” section, then paste the client ID and client secret provided by the portal. They replace the provided account; clear both fields to return to it.',
      accountNoteBefore:
        'The exact WHO portal screens may change; when in doubt, see the ',
      accountNoteLink: 'official ICD API documentation',
      accountNoteAfter: ' and the portal FAQs.',
      gatewayTitle: 'Why a gateway?',
      gatewayP1:
        'From a web page, browsers apply security rules (CORS) that prevent calling the WHO API directly. A gateway is a small intermediary service that receives this app’s requests and forwards them to the WHO. This one is deployed WITH the project: nothing for you to install, and it is what carries the WHO account by default.',
      gatewayP2a: 'Its source and guide live in the ',
      gatewayP2b: ' folder of the repository (proxy file and ',
      gatewayP2c:
        ') — useful only if you deploy your own copy of the app. Its address must then be set at build time: the site’s security policy only lets that one through.',
      gatewayNote:
        'The built-in ICD-10 dictionary answers in the page, with no network. WHO suggestions, on the other hand, mean segments of the report are sent to its servers — that is the price of ICD-11.',
      linkPortal: 'ICD API portal (sign-up / applications)',
      linkApiDoc: 'ICD API documentation (version 2)',
      backHome: 'Back to home',
    },
    errors: {
      emptyReport: 'Enter a report before running the analysis.',
      oms: {
        proxyUnreachable:
          'Gateway unreachable — check your connection, then try again.',
        credentialsRejected: 'WHO credentials rejected (Client ID / secret).',
        gatewayAccountMissing:
          'The gateway has no usable WHO account: ICD-11 is unavailable. You can enter your own in Settings.',
        corsForbidden: 'Origin not allowed by the gateway (CORS).',
        authFailed: 'WHO authentication failed (HTTP {status}).',
        authInvalid: 'Invalid WHO authentication response.',
        proxyUnreachableAnalyze: 'Gateway unreachable during WHO analysis.',
        sessionExpired: 'WHO session expired — run the analysis again.',
        analyzeFailed: 'WHO error during analysis (HTTP {status}).',
        unknown: 'Unexpected error during analysis.',
        offlineSkipped:
          'Offline: only the local ICD-10 dictionary answered, the WHO lookup was skipped.',
        notConfigured:
          'This installation is not connected to the WHO: only the local ICD-10 dictionary answered. The gateway is set at deployment time, not from the application.',
        localKept:
          '{raison} The local ICD-10 dictionary codes are still shown.',
      },
    },
    footer: {
      privacy:
        'No clinical data is stored on our servers: the report and analysis stay in your browser. When the WHO gateway answers, segments of the report are sent to it to obtain ICD-11 codes; offline, nothing leaves. Only your settings may be saved locally on this device.',
      source: 'Source code on GitHub',
      coffee: 'Buy me a coffee',
    },
  },
} as const;

export type Locale = keyof typeof messages;
export type Messages = (typeof messages)['fr'];
