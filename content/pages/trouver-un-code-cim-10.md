---
title: Trouver un code CIM-10 : méthode, exemples et pièges à éviter
description: Comment trouver le bon code CIM-10 à partir d'un compte rendu : lire la structure d'un code, chercher par libellé, vérifier dans le référentiel officiel.
---

# Trouver un code CIM-10 : la méthode pas à pas

La CIM-10, Classification internationale des maladies dans sa dixième révision, est publiée par l'Organisation mondiale de la santé (OMS). Elle attribue un code à chaque maladie, symptôme ou motif de recours aux soins. En France, une version adaptée par l'ATIH, la CIM-10 FR à usage PMSI, sert notamment au codage des séjours hospitaliers.

Cette page s'adresse aux professionnels de santé et aux codeurs. Elle explique comment chercher un code, puis comment Mister CIM-10 peut vous faire gagner du temps. Elle ne donne aucun avis médical : le choix d'un code relève des règles de codage en vigueur et de votre jugement professionnel.

## Lire un code CIM-10

Un code CIM-10 se lit de gauche à droite, du plus général au plus précis :

- **une lettre et deux chiffres** forment la catégorie, par exemple `I10` ;
- **un point puis un chiffre** donnent la sous-catégorie, qui précise la catégorie, par exemple `E11.9` ;
- la lettre situe le code dans un chapitre : les codes en `I` relèvent des maladies de l'appareil circulatoire, ceux en `J` de l'appareil respiratoire, ceux en `E` des maladies endocriniennes, nutritionnelles et métaboliques.

La CIM-10 FR de l'ATIH ajoute des extensions propres à la France, certaines écrites avec un signe « + », comme `R53.+0`. Vérifiez toujours la version exigée dans votre contexte.

## Trouver le bon code en cinq étapes

1. **Partez du terme exact du compte rendu.** Repérez le diagnostic retenu, pas seulement les symptômes qui y ont conduit.
2. **Cherchez ce terme dans l'index alphabétique**, en pensant aux synonymes et aux abréviations : « HTA » pour hypertension artérielle, « BPCO » pour bronchopneumopathie chronique obstructive.
3. **Vérifiez le code dans la table analytique.** Lisez son libellé complet et ses notes d'inclusion et d'exclusion : un code qui semble convenir peut exclure explicitement votre situation.
4. **Descendez au niveau le plus précis** que permet le dossier. Les codes « sans précision », souvent en `.9`, se réservent aux cas où l'information manque vraiment.
5. **Appliquez les règles de votre contexte.** Pour le PMSI, le guide méthodologique de l'ATIH fixe, par exemple, comment choisir le diagnostic principal.

## Un exemple

Soit la phrase : « Patient diabétique de type 2, HTA, suivi pour BPCO. »

- « HTA » mène à l'hypertension essentielle, `I10`.
- « Diabète de type 2 » mène à la catégorie `E11`. Sans complication mentionnée, la sous-catégorie est `E11.9` ; une complication décrite dans le dossier orienterait vers une autre sous-catégorie.
- « BPCO » mène à la catégorie `J44`. Sans autre précision, `J44.9`.

Trois codes en une phrase, mais chacun demande de vérifier le libellé officiel et les règles de hiérarchisation avant d'être retenu.

## Les pièges fréquents

- **Coder un terme nié.** « Pas de diabète » ne se code pas comme un diabète, et un diagnostic seulement évoqué obéit aux règles de votre contexte de codage. Un outil qui repère des mots ne fait pas ces différences : relisez chaque suggestion dans son contexte.
- **Confondre CIM-10 et CIM-11.** La CIM-11, adoptée par l'OMS, est entrée en vigueur en 2022. Ses codes ont une autre forme (par exemple `BA00`) et ne remplacent pas un code CIM-10 dans un système qui attend la CIM-10.
- **Se contenter d'un code approchant.** Un libellé proche n'est pas un libellé exact : la table analytique tranche.
- **Oublier la mise à jour.** Les référentiels évoluent : un code valide une année peut changer de libellé ou d'usage.

## Comment Mister CIM-10 vous aide

Mister CIM-10 est une application web gratuite, utilisable sans compte, qui aide à proposer et à organiser des codes.

- **Suggestions à partir du texte.** Collez ou dictez un compte rendu, lancez l'analyse (Ctrl + Entrée) : chaque suggestion affiche sa pertinence (élevée, moyenne ou faible) et le terme repéré, qu'un clic retrouve dans le texte.
- **Deux sources, clairement distinguées.** Un dictionnaire CIM-10 embarqué répond dans la page ; en ligne, l'application interroge aussi l'OMS par une passerelle, et ces suggestions portent le badge CIM-11. Le dictionnaire embarqué est un échantillon, pas la classification entière.
- **Recherche par libellé, synonyme ou code**, tolérante aux accents oubliés et aux fautes de frappe, pour ajouter un code absent du compte rendu.
- **Saisie contrôlée.** Un code tapé est remis en forme (`E11,9` devient `E11.9`) ; ce qui n'a pas la forme d'un code est refusé, et un code absent du dictionnaire embarqué est signalé.
- **Une liste de diagnostics retenus** à annoter, réordonner et corriger, avec annulation. Elle s'exporte en texte, en tableur (CSV) ou en JSON, se copie ou s'imprime en PDF.
- **Vos dossiers restent dans le navigateur** : compte rendu, codes retenus, favoris et jusqu'à cinq dossiers nommés. Quand l'OMS est interrogée, des segments du texte partent vers ses serveurs : n'y saisissez aucune donnée qui identifie un patient.

## Questions fréquentes

### Les codes proposés par Mister CIM-10 sont-ils fiables ?

Ce sont des suggestions indicatives. Le dictionnaire embarqué est un échantillon, et vous restez responsable des codes retenus. Vérifiez chaque code dans le référentiel officiel qui s'applique à votre activité.

### Quelle différence entre la CIM-10 et la CIM-11 ?

Ce sont deux classifications distinctes de l'OMS. La CIM-11 est plus récente et ses codes ont une autre structure. Dans Mister CIM-10, chaque suggestion indique sa source par un badge CIM-10 ou CIM-11.

### Faut-il créer un compte ?

Non. L'application s'ouvre dans le navigateur, sans inscription. Vos données de travail sont mémorisées dans ce navigateur, et une sauvegarde peut être exportée dans un fichier.

### L'application fonctionne-t-elle hors connexion ?

Oui, une fois chargée ou installée : le dictionnaire embarqué répond sans réseau. Les suggestions de l'OMS demandent une connexion, tout comme la dictée quand le navigateur ne reconnaît pas la parole sur l'appareil.
