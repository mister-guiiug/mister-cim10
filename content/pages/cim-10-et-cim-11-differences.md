---
title: CIM-10 et CIM-11 : les différences qui comptent pour le codage
description: CIM-10 ou CIM-11 ? Forme des codes, codes d'extension, entrée en vigueur et usage en France pour le PMSI : ce qui change vraiment pour coder un diagnostic.
date: 2026-09-29
answer: La CIM-11, adoptée par l'OMS en 2019 et en vigueur depuis le 1er janvier 2022, succède à la CIM-10, mais en France le PMSI code toujours en CIM-10 FR. Ses codes changent de forme, BA00 au lieu de I10 pour l'hypertension essentielle, et se précisent par des codes d'extension. L'ATIH expérimente la transition depuis 2025.
---

# CIM-10 et CIM-11 : ce qui change pour le codage

La CIM-11 n'est pas une simple mise à jour de la CIM-10 : la forme des codes, la façon de les combiner et les outils changent. Pour un codeur, la question est aussi pratique : quelle classification utiliser aujourd'hui, et dans quel système ? Voici les différences qui comptent, puis la façon dont Mister CIM10 distingue les deux.

Cette page s'adresse aux professionnels du codage. Elle ne remplace ni les règles de votre contexte, comme le guide méthodologique du PMSI, ni votre jugement professionnel.

## Deux révisions d'une même classification

La Classification internationale des maladies est publiée par l'Organisation mondiale de la santé (OMS). Sa onzième révision a été adoptée par l'Assemblée mondiale de la santé en mai 2019 et est entrée en vigueur le 1er janvier 2022. L'OMS la décrit comme entièrement numérique et multilingue.

Elle compte environ 17 000 codes uniques pour les lésions, les maladies et les causes de décès, adossés à plus de 120 000 termes codables. En combinant les codes, plus de 1,6 million de situations cliniques peuvent être codées, toujours selon l'OMS. De nouveaux chapitres apparaissent, notamment sur la médecine traditionnelle et la santé sexuelle, et le trouble du jeu vidéo rejoint les troubles addictifs.

## Des codes qui changent de forme

En CIM-10, un code commence par une lettre et deux chiffres, puis un point et un chiffre pour la sous-catégorie : `I10`, `E11.9`. Le détail de cette lecture est dans [Trouver un code CIM-10](trouver-un-code-cim-10.html).

En CIM-11, les codes vont de `1A00.00` à `ZZ9Z.ZZ`. Le guide de référence de l'OMS en fixe les règles :

- le premier caractère désigne le chapitre : `1` pour le premier, `2` pour le deuxième, puis `A` pour le dixième, et ainsi de suite ;
- le deuxième caractère est toujours une lettre, ce qui distingue un code CIM-11 d'un code CIM-10 ;
- les lettres O et I ne sont pas utilisées, pour éviter toute confusion avec 0 et 1 ;
- un code qui se termine par `Y` désigne une catégorie « autre précisée », par `Z` une catégorie « sans précision ».

Exemple : l'hypertension essentielle, `I10` en CIM-10, devient `BA00` en CIM-11, un code du chapitre 11. Sa forme suffit à le reconnaître.

## Les codes d'extension et la post-coordination

La CIM-10 FR de l'ATIH précise certains codes par des extensions nationales, parfois écrites avec un signe « + », comme `R53.+0`. La CIM-11 prévoit, pour toute la classification, deux mécanismes pour préciser un code :

- **les codes d'extension**, qui commencent par `X`, ajoutent un détail à un code principal : l'anatomie, l'agent en cause, l'histopathologie, par exemple. Ils ne s'emploient jamais seuls pour la statistique et ne vont pas avec n'importe quel code ;
- **la post-coordination** relie plusieurs codes principaux, ou un code principal et ses extensions, pour décrire une situation en un seul groupe de codes.

Pour le codeur, cela change la méthode : un même diagnostic peut demander un code principal et un ou plusieurs codes qui le précisent.

## En France, la CIM-10 FR reste la référence du PMSI

L'Agence technique de l'information sur l'hospitalisation (ATIH) publie la CIM-10 FR à usage PMSI. La version 2026 s'applique au recueil des séjours en médecine, chirurgie et obstétrique, en hospitalisation à domicile, en psychiatrie et en soins médicaux et de réadaptation.

La transition se prépare. Depuis le 15 septembre 2025, douze établissements pilotes (quatre CHU, six centres hospitaliers, un établissement de santé privé d'intérêt collectif et un établissement à but lucratif, dans huit régions) codent chacun entre 500 et 1 000 séjours à la fois en CIM-10 et en CIM-11. Les résultats de cette expérimentation doivent servir à planifier le déploiement national.

En pratique, un séjour se code aujourd'hui en CIM-10 FR : un code CIM-11 n'y a pas sa place.

## Passer d'une classification à l'autre

L'OMS publie des tables de correspondance numériques entre la CIM-10 et la CIM-11, enrichies de plusieurs options de correspondance. Elles aident à retrouver un code, mais chaque correspondance se vérifie dans la classification visée : un détail qui tenait dans un code CIM-10 peut passer, en CIM-11, par un code d'extension.

## Comment Mister CIM10 distingue les deux

[Mister CIM10](https://mister-guiiug.github.io/mister-cim10/) est une application web gratuite qui propose des codes à partir d'un compte rendu, sans compte.

- **Un badge par suggestion.** Chaque code porte sa classification, CIM-10 ou CIM-11 : on ne mélange pas les deux par inadvertance.
- **Deux sources.** Les codes CIM-10 viennent d'un dictionnaire embarqué de 147 codes, un échantillon qui répond même hors connexion ; ce n'est pas la CIM-10 FR. Les suggestions CIM-11 viennent de l'OMS, en ligne, par une passerelle du site : pour chaque phrase du compte rendu, quinze au plus, l'OMS renvoie le code le plus proche, en français.
- **Des exports à relire.** Seul l'export JSON garde la classification de chaque code ; la copie et les exports texte et CSV ne l'indiquent pas. Vérifiez la liste avant de la reporter dans un logiciel qui attend la CIM-10 FR.
- **Une précaution.** Les phrases analysées partent vers les serveurs de l'OMS : n'y laissez aucune donnée qui identifie un patient.

## Questions fréquentes

### La CIM-11 est-elle déjà utilisée en France ?

Pas pour le PMSI : c'est la CIM-10 FR à usage PMSI, en version 2026, qui s'applique. L'ATIH fait coder des séjours dans les deux classifications par douze établissements pilotes depuis septembre 2025, pour préparer le déploiement.

### Peut-on convertir un code CIM-10 en CIM-11 ?

L'OMS publie des tables de correspondance. Elles guident la recherche, mais chaque résultat se vérifie : un code CIM-11 peut avoir besoin d'un code d'extension pour dire la même chose qu'un code CIM-10.

### Pourquoi un code CIM-11 commence-t-il par un chiffre ou par une lettre ?

Le premier caractère indique le chapitre : de `1` à `9` pour les neuf premiers, puis des lettres à partir du dixième. Le deuxième caractère est toujours une lettre, ce qui évite de confondre un code CIM-11 avec un code CIM-10.

### Mister CIM10 propose-t-il des codes CIM-11 ?

Oui, en ligne : ses suggestions venues de l'OMS portent le badge CIM-11. Elles ne remplacent pas un code CIM-10 FR dans un recueil PMSI.

## Sources

- [WHO's new International Classification of Diseases (ICD-11) comes into effect](https://www.who.int/news/item/11-02-2022-who-s-new-international-classification-of-diseases-%28icd-11%29-comes-into-effect), Organisation mondiale de la santé, 11 février 2022, en anglais.
- [International Classification of Diseases (ICD)](https://www.who.int/standards/classifications/classification-of-diseases), Organisation mondiale de la santé, en anglais.
- [ICD-11 Reference Guide, General features of ICD-11](https://icdcdn.who.int/icd11referenceguide/en/html/01.02.04_general-features-of-icd11.html), Organisation mondiale de la santé, en anglais.
- [CIM-10 FR à usage PMSI 2026](https://www.atih.sante.fr/recueillir-les-donnees/guides-et-documentations/cim-10-fr-usage-pmsi-2026), ATIH.
- [Expérimentation CIM-11 2025](https://www.atih.sante.fr/recueillir-les-donnees/guides-et-documentations/experimentation-cim-11-2025), ATIH.
