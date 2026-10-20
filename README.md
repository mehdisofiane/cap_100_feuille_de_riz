# Cap 110 · Feuille de riz

304 recettes à la feuille de riz, salées et sucrées, sans sucre ajouté (Pure Via Pâtisserie), avec calories et macros par portion, roue, frigo, planning de la semaine, liste de courses et bonnes adresses à Paris.

Site 100 % statique : un `index.html`, des fichiers CSS/JS et des polices. Aucun serveur, aucune base de données, aucun compte.

---

## Mettre le site en ligne gratuitement avec GitHub Pages (sans ligne de commande)

1. Connecte-toi sur **github.com** (ou crée un compte). Active la **double authentification** : *Settings → Password and authentication → Two-factor authentication*.
2. En haut à droite, **+ → New repository**.
   - Nom : `cap110-riz`
   - Visibilité : **Public** (obligatoire pour GitHub Pages gratuit)
   - Ne coche rien d'autre, puis **Create repository**.
3. Sur la page du dépôt vide, clique sur **uploading an existing file**.
4. Dézippe `cap110-riz.zip` sur ton PC, ouvre le dossier, sélectionne **tous les fichiers** et glisse-les dans la page GitHub. Attends la fin de l'envoi, puis **Commit changes**.
5. **Settings → Pages**. Dans *Build and deployment* :
   - Source : **Deploy from a branch**
   - Branch : **main**, dossier **/ (root)** → **Save**
6. Attends une à deux minutes et recharge la page *Pages* : l'adresse s'affiche, du type
   `https://TON-PSEUDO.github.io/cap110-riz/`
7. Dans la même page, coche **Enforce HTTPS** si la case est disponible.

### Mettre à jour plus tard
Retourne dans le dépôt → **Add file → Upload files**, glisse les nouveaux fichiers (ils remplacent les anciens) → **Commit changes**. Le site se met à jour en une minute ; le téléphone récupère la nouvelle version au chargement suivant.

---

## Alternative : Cloudflare Pages (ton pseudo n'apparaît pas dans l'adresse)

1. Crée un compte gratuit sur **dash.cloudflare.com**.
2. **Workers & Pages → Create → Pages → Upload assets**.
3. Nom du projet : `cap110-riz`, glisse le **dossier dézippé**, puis **Deploy site**.
4. Adresse : `https://cap110-riz.pages.dev`.

Cloudflare lit le fichier `_headers` et ajoute de vrais en-têtes de sécurité HTTP (anti-iframe, HSTS…). GitHub Pages ne sait pas le faire, d'où la politique de sécurité placée directement dans la page.

---

## Pourquoi c'est sûr à publier

- **Rien à pirater côté serveur** : pas de serveur à toi, pas de formulaire, pas de base de données, pas de mot de passe ni de clé dans le code. L'hébergeur sert des fichiers en lecture seule.
- **Un seul appel extérieur, choisi** : polices et icônes sont hébergées avec le site. Aucun Google Fonts, aucun traceur publicitaire, aucun cookie. Le seul envoi est le prénom + pays vers ta feuille Google, annoncé clairement aux visiteurs.
- **Politique de sécurité stricte (CSP)** : le navigateur n'exécute que les scripts du site lui-même ; tout script injecté ou venant d'ailleurs est bloqué. Le site ne peut contacter que lui-même et le script Google.
- **Données des visiteurs chez eux** : favoris, frigo, planning et liste de courses sont stockés dans le navigateur de chaque visiteur (localStorage), sous son profil. Ils ne sont envoyés nulle part.
- **Totalement séparé de ta maison** : aucun lien avec ton Proxmox ou ton Tailscale, aucun port à ouvrir chez toi.
- **Ton compte** : la seule chose à protéger, c'est ton compte GitHub ou Cloudflare. Double authentification activée, et ne mets jamais d'autres fichiers personnels dans ce dépôt public.

---

## Contenu du dossier

Tous les fichiers sont à la racine (l'envoi de fichiers par le site GitHub ne garde pas les sous-dossiers).

| Fichier | Rôle |
|---|---|
| `index.html` | La page, avec la politique de sécurité (CSP) |
| `style.css` | Le style (polices Unbounded, Instrument Sans, JetBrains Mono) |
| `data.js` | Les 304 recettes et la base nutritionnelle |
| `art.js` | Les illustrations dessinées pour chaque recette |
| `app.js` | L'application : profils, filtres, roue, frigo, semaine, courses, guide |
| `*.woff2` | Les polices, sous licence SIL Open Font License (fichiers `LICENSE-police-*.txt`) |
| `logo.svg`, `*.png` | Logo et icônes d'écran d'accueil |
| `sw.js` | Mode hors ligne (cache des fichiers du site uniquement) |
| `manifest.webmanifest` | Installation sur l'écran d'accueil |
| `_headers` | En-têtes de sécurité pour Cloudflare Pages / Netlify |
| `.nojekyll` | Dit à GitHub Pages de servir les fichiers tels quels |

## Profils et suivi des utilisateurs

À la première visite, chaque personne indique son prénom et son pays de résidence. Ses favoris, son frigo, sa semaine et sa liste de courses sont rangés sous son profil, dans son propre navigateur : les données de deux personnes ne se croisent jamais, même sur un téléphone partagé.

Le prénom, le pays et la date des visites (une par jour au plus) sont envoyés à un script Google Apps Script lié à la feuille « CAP 110 - Recette de riz », qui les ajoute dans l'onglet « Utilisateurs ». Ce script :
- n'a accès qu'à cette feuille (`@OnlyCurrentDoc`) ;
- ne fait qu'ajouter des lignes et ne renvoie aucune donnée au site ;
- refuse les envois mal formés, neutralise les formules et limite le débit (anti-spam).

Le code du script est dans `apps-script/Code.gs` du dossier source. L'adresse du script est publique dans `app.js` : c'est normal, elle ne permet que d'ajouter une ligne valide.

Calories estimées à ± 10 % à partir de valeurs nutritionnelles moyennes. Ce site ne remplace pas l'avis d'un médecin ou d'un diététicien.
