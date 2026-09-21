# Proxy CORS pour l’API OMS (ICD-11)

Les navigateurs bloquent en général les appels directs depuis un site (GitHub Pages, `localhost`) vers `icdaccessmanagement.who.int` et `id.who.int` (**CORS**). Ce **Cloudflare Worker** relaie les requêtes côté serveur.

Référence OMS : [ICD API](https://icd.who.int/icdapi).

---

## Où vit le compte OMS — et pourquoi pas ailleurs

La passerelle peut porter **son propre compte OMS**, en secrets. Posés, l’application n’a plus rien à demander : elle appelle `/token` sans identifiants, et la passerelle ajoute les siens côté serveur.

C’est **le seul endroit possible**. Une PWA est un bundle public : tout ce qu’on lui donne au build — variable `VITE_*` comprise — est recopié en clair dans le JavaScript servi, lisible par quiconque ouvre l’onglet Réseau. Un mot secret publié n’en est plus un.

| Valeur                                         | Où                                            | Pourquoi                                          |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| `VITE_WHO_PROXY_URL`, `…_RELEASE_ID`, `…_LANG` | Variables de dépôt GitHub (`vars`)            | Publiques : déjà visibles dans le trafic réseau   |
| `WHO_CLIENT_ID`, `WHO_CLIENT_SECRET`           | Secrets **du worker** (`wrangler secret put`) | Ne franchissent jamais la frontière du navigateur |
| `CLOUDFLARE_API_TOKEN`, `…_ACCOUNT_ID`         | Secrets de dépôt GitHub                       | Ne servent qu’au déploiement, en CI               |

Le compte de l’utilisateur, s’il en saisit un dans les Réglages, **l’emporte** sur celui de la passerelle : ce sont alors ses identifiants qui portent les requêtes.

Sans secrets sur la passerelle, rien ne casse — elle répond 400 et chacun doit apporter son compte, comme avant.

---

## Méthode automatique — le workflow du dépôt

`.github/workflows/deploy-worker.yml` déploie la passerelle et y pose le compte OMS, à chaque poussée sur `main` qui touche `workers/`, ou à la main (**Actions → Deploy WHO Worker → Run workflow**).

Quatre secrets de dépôt (Settings → Secrets and variables → Actions) :

| Secret                  | Obtenir                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare → My Profile → API Tokens, permission **Workers Scripts: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages (colonne de droite)                           |
| `WHO_CLIENT_ID`         | [icd.who.int/icdapi](https://icd.who.int/icdapi)                           |
| `WHO_CLIENT_SECRET`     | idem                                                                       |

Sans les deux secrets Cloudflare, le job se termine **en succès** avec un avertissement : le déploiement est simplement ignoré.

---

## Étape 0 — Prérequis

- Un compte **Cloudflare** (gratuit) : [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
- Le fichier **`who-icd-proxy.js`** de ce dossier (c’est le code du worker).
- L’**origine** exacte de votre site PWA :
  - GitHub Pages (site projet) : `https://VOTRE_COMPTE.github.io` — **sans** le chemin `/nom-du-repo`.
  - En local avec Vite : `http://localhost:5173`.

---

## Méthode A — Interface Cloudflare (sans ligne de commande)

### 1. Créer un worker

1. Connectez-vous au [tableau de bord Cloudflare](https://dash.cloudflare.com).
2. Menu **Workers & Pages** (ou **Compute (Workers)**).
3. **Create** → **Create Worker** (ou **Create application** puis worker).
4. Donnez un nom, par ex. `who-icd-proxy`, puis **Deploy** (un code d’exemple peut être créé).

### 2. Coller le code

1. Ouvrez le worker créé → **Edit code** (éditeur en ligne).
2. **Remplacez tout** le contenu par celui du fichier **`who-icd-proxy.js`** de ce dépôt.
3. **Save and deploy**.

### 3. Configurer les origines autorisées (CORS)

1. Dans la fiche du worker : **Settings** → **Variables** (ou **Environment variables**).
2. **Add variable** :
   - **Name** : `ALLOWED_ORIGINS`
   - **Value** : vos origines, **séparées par une virgule**, sans espace inutile, par exemple :  
     `https://guigui43.github.io,http://localhost:5173`
3. Enregistrez. **Redéployez** le worker si l’interface le demande.

> Si vous laissez `ALLOWED_ORIGINS` vide, le worker répond avec `Access-Control-Allow-Origin: *` : pratique pour un test rapide, **déconseillé** si le worker est public.

### 4. Récupérer l’URL publique

- Elle est du type : **`https://who-icd-proxy.VOTRE_SOUSDOMAINE.workers.dev`**  
  (le sous-domaine dépend du nom que Cloudflare a attribué au worker).
- Copiez cette URL **sans slash à la fin**.

### 5. Configurer le compte OMS de la passerelle (facultatif)

**Settings** → **Variables and Secrets** → onglet **Secrets** → **Add** :

- `WHO_CLIENT_ID` et `WHO_CLIENT_SECRET`, obtenus sur [icd.who.int/icdapi](https://icd.who.int/icdapi).

Posés, l’application n’a plus rien à demander à ses utilisateurs. Omis, chacun devra apporter son propre compte dans les Réglages.

### 6. Brancher l’application

Deux voies, selon qu’on déploie ou qu’on essaie :

- **Déploiement** — posez l’URL du worker dans la variable de dépôt **`VITE_WHO_PROXY_URL`** (Settings → Secrets and variables → Actions → Variables). L’application arrive alors connectée, et il n’y a rien à régler : l’analyse interroge l’OMS dès que la passerelle répond.
- **Essai ponctuel** — il n’y a **plus de champ** où coller une adresse, et ce n’est pas un oubli : la CSP du site est figée au build et n’autorise que l’origine de `VITE_WHO_PROXY_URL`, toute autre adresse étant coupée par le navigateur avant l’envoi. Pour essayer un worker, posez cette variable **dans l’environnement du processus** — `VITE_WHO_PROXY_URL=https://… npm run dev` — puis rechargez. ⚠️ Un `.env.local` **ne suffit pas** : Vite le donne à l’application (`import.meta.env`) mais [`vite.config.ts`](../vite.config.ts) lit `process.env` pour bâtir la CSP. L’application viserait la passerelle pendant que le navigateur coupe l’appel — sans un message, le symptôme même que ce champ supprimé produisait.

---

## Méthode B — Ligne de commande (Wrangler)

Utile si vous versionnez le worker avec le dépôt Git.

### 1. Installer Wrangler

```bash
npm install -g wrangler
```

(Alternative : `npx wrangler` devant chaque commande, sans installation globale.)

### 2. Se connecter à Cloudflare

```bash
cd workers
wrangler login
```

Le navigateur s’ouvre pour autoriser Wrangler.

### 3. Configurer `ALLOWED_ORIGINS`

**`wrangler.toml` existe déjà** dans `workers/` : il vise le worker `mister-cim10` et autorise `https://mister-guiiug.github.io` + `http://localhost:5173`. Pour votre propre déploiement, partez de `wrangler.toml.example` et adaptez :

- **`name`** (nom du worker) ;
- **`[vars] ALLOWED_ORIGINS`** — vos origines, séparées par des virgules :

```toml
[vars]
ALLOWED_ORIGINS = "https://VOTRE_COMPTE.github.io,http://localhost:5173"
```

> ⚠️ **`wrangler deploy` REMPLACE les variables du worker.** Une liste incomplète coupe l’application au premier déploiement. Pour relever celles d’un worker en service sans accès au tableau de bord, interrogez-le origine par origine : `204` = autorisée, `403` = refusée.
>
> ```bash
> curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS "https://VOTRE_WORKER.workers.dev/token" \
>   -H "Origin: https://VOTRE_COMPTE.github.io" -H "Access-Control-Request-Method: POST"
> ```

### 4. Poser le compte OMS (facultatif, mais c’est là tout l’intérêt)

```bash
wrangler secret put WHO_CLIENT_ID
wrangler secret put WHO_CLIENT_SECRET
```

La commande **lit l’entrée standard** : la valeur ne paraît ni dans la ligne de commande, ni dans l’historique du shell, ni dans un fichier. Ne la passez jamais en argument.

### 5. Déployer

Toujours dans le dossier **`workers/`** :

```bash
wrangler deploy
```

La sortie affiche l’URL du worker (`*.workers.dev`). C’est elle qui va dans la variable de dépôt **`VITE_WHO_PROXY_URL`** — sans slash final.

### 6. Mettre à jour le code plus tard

Après modification de `who-icd-proxy.js` :

```bash
wrangler deploy
```

---

## Vérification rapide

- Depuis le navigateur, l’appel part de **votre** origine (GitHub Pages ou localhost) vers **`https://…workers.dev/token`** : c’est le worker qui ajoute les en-têtes CORS.
- Si vous voyez **403** avec « Origin non autorisée », la valeur de **`ALLOWED_ORIGINS`** ne correspond pas exactement à l’en-tête **`Origin`** de la page (protocole `https` vs `http`, faute de frappe, etc.).

### Test du jeton (exemple avec curl)

Si la passerelle porte ses propres secrets, un corps vide suffit — c’est aussi la façon de vérifier qu’ils sont bien posés :

```bash
curl -s -X POST "https://VOTRE_WORKER.workers.dev/token" \
  -H "Origin: https://VOTRE_COMPTE.github.io" \
  -H "Content-Type: application/json" -d "{}"
```

L’en-tête **`Origin` est obligatoire** dès que `ALLOWED_ORIGINS` est renseignée : sans lui, la réponse est un `403` qui ne dit rien sur les identifiants.

Avec un compte à soi :

```bash
curl -s -X POST "https://VOTRE_WORKER.workers.dev/token" \
  -H "Origin: https://VOTRE_COMPTE.github.io" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"VOTRE_ID\",\"clientSecret\":\"VOTRE_SECRET\"}"
```

Sous PowerShell, adaptez les guillemets ou utilisez `Invoke-RestMethod`.

Une réponse JSON contenant `access_token` indique que le proxy et les identifiants OMS fonctionnent.

---

## Dépannage

| Problème                                    | Piste                                                                                                                                                                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **403 Origin non autorisée**                | Corriger `ALLOWED_ORIGINS` : elle doit **égaler** l’en-tête `Origin` du navigateur (souvent `https://VOTRE_COMPTE.github.io`, y compris pour un site **projet** sous `/nom-du-repo/` — le chemin ne fait pas partie de l’origine).                    |
| **404 sur /token**                          | URL du proxy mal saisie (trailing slash en trop sur le worker custom, ou mauvais chemin). L’app appelle `BASE/token` et `BASE/autocode`.                                                                                                              |
| **400 « clientId et clientSecret requis »** | Ni compte apporté par l’appelant, ni secrets `WHO_CLIENT_ID` / `WHO_CLIENT_SECRET` sur la passerelle. Posez-les (`wrangler secret put`) ou saisissez un compte dans les Réglages.                                                                     |
| **401 OMS**                                 | Client ID / secret invalides sur le portail ICD API.                                                                                                                                                                                                  |
| **Appel bloqué par la CSP**                 | L’adresse de la passerelle doit figurer dans `VITE_WHO_PROXY_URL` **au build** : la politique est figée à ce moment-là. Il n’existe plus de champ pour en saisir une autre dans les Réglages — précisément parce qu’aucune autre ne serait joignable. |
| **502**                                     | Problème réseau entre Cloudflare et les serveurs OMS (rare).                                                                                                                                                                                          |

---

## Fichiers de ce dossier

| Fichier                 | Rôle                                                            |
| ----------------------- | --------------------------------------------------------------- |
| `who-icd-proxy.js`      | Code du Worker (à déployer).                                    |
| `wrangler.toml`         | Config Wrangler (`name`, `main`, `compatibility_date`, `vars`). |
| `wrangler.toml.example` | Exemple commenté (copie de référence).                          |
