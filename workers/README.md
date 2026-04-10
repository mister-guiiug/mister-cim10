# Proxy CORS pour l’API OMS (ICD-11)

Les navigateurs bloquent en général les appels directs depuis un site (GitHub Pages, `localhost`) vers `icdaccessmanagement.who.int` et `id.who.int` (**CORS**). Ce **Cloudflare Worker** relaie les requêtes côté serveur.

Référence OMS : [ICD API](https://icd.who.int/icdapi).

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

### 5. Brancher l’application

Dans la PWA, panneau **API OMS** :

- Collez l’URL dans **URL du proxy CORS**.
- Renseignez **Client ID** et **Client secret** obtenus sur [icd.who.int/icdapi](https://icd.who.int/icdapi).
- Cochez **Activer les requêtes OMS**, puis **Analyser**.

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

Éditez **`wrangler.toml`** à la racine du dossier `workers/` :

- Vérifiez **`name`** (nom du worker).
- Décommentez / ajoutez dans **`[vars]`** :

```toml
[vars]
ALLOWED_ORIGINS = "https://VOTRE_COMPTE.github.io,http://localhost:5173"
```

Remplacez par **votre** origine GitHub Pages et gardez `localhost` si vous développez en local.

### 4. Déployer

Toujours dans le dossier **`workers/`** :

```bash
wrangler deploy
```

La sortie affiche l’URL du worker (`*.workers.dev`).

### 5. Mettre à jour le code plus tard

Après modification de `who-icd-proxy.js` :

```bash
wrangler deploy
```

---

## Vérification rapide

- Depuis le navigateur, l’appel part de **votre** origine (GitHub Pages ou localhost) vers **`https://…workers.dev/token`** : c’est le worker qui ajoute les en-têtes CORS.
- Si vous voyez **403** avec « Origin non autorisée », la valeur de **`ALLOWED_ORIGINS`** ne correspond pas exactement à l’en-tête **`Origin`** de la page (protocole `https` vs `http`, faute de frappe, etc.).

### Test du jeton (exemple avec curl)

Remplacez l’URL, le client et le secret :

```bash
curl -s -X POST "https://VOTRE_WORKER.workers.dev/token" ^
  -H "Content-Type: application/json" ^
  -d "{\"clientId\":\"VOTRE_ID\",\"clientSecret\":\"VOTRE_SECRET\"}"
```

Sous PowerShell, adaptez les guillemets ou utilisez `Invoke-RestMethod`.

Une réponse JSON contenant `access_token` indique que le proxy et les identifiants OMS fonctionnent.

---

## Dépannage

| Problème | Piste |
|----------|--------|
| **403 Origin non autorisée** | Corriger `ALLOWED_ORIGINS` : elle doit **égaler** l’en-tête `Origin` du navigateur (souvent `https://VOTRE_COMPTE.github.io`, y compris pour un site **projet** sous `/nom-du-repo/` — le chemin ne fait pas partie de l’origine). |
| **404 sur /token** | URL du proxy mal saisie (trailing slash en trop sur le worker custom, ou mauvais chemin). L’app appelle `BASE/token` et `BASE/autocode`. |
| **401 OMS** | Client ID / secret invalides sur le portail ICD API. |
| **502** | Problème réseau entre Cloudflare et les serveurs OMS (rare). |

---

## Fichiers de ce dossier

| Fichier | Rôle |
|---------|------|
| `who-icd-proxy.js` | Code du Worker (à déployer). |
| `wrangler.toml` | Config Wrangler (`name`, `main`, `compatibility_date`, `vars`). |
| `wrangler.toml.example` | Exemple commenté (copie de référence). |
