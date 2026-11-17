# 🔍 Recherche d'entreprises IT — Google Sheets

Extension **Google Apps Script** pour Google Sheets qui t'aide à la fois à
**suivre tes prospects / contacts entreprises** et à **calculer les temps de
trajet** (domicile → lieu d'entretien, adresse de travail) dans le cadre de ta
**recherche d'entreprise dans le secteur de l'informatique**.

Idéal pour préparer une candidature : repérer les entreprises qui ne répondent
pas, et jauger rapidement l'acheminement avant de postuler.

## ✨ Fonctionnalités

### 🔍 Suivi auto des contacts entreprises — [`SuiviAuto.gs`](./SuiviAuto.gs)

- **« Contacts Entreprises »** : ton suivi humain — statut, établissement
  d'accueil, nom/prénom du tuteur, adresse, ID…
- **« Suivi Contacts »** : la trace automatique — entreprise contactée, n° de
  l'offre, personne contactée, date du contact, réponse, commentaires, clé
  technique.
- Déclencheur **installable** (`onEdit`) : dès qu'une ligne passe au statut
  « En attente » / « Réponse positive » / « Réponse négative », une ligne
  correspondante est **créée — ou mise à jour —** dans le suivi.
- **ID unique** (UUID) par entreprise, créé une seule fois puis conservé, avec
  migration automatique depuis les anciennes clés.
- Nettoyage des doublons.

### 🚗 Calculateur de temps de trajet — [`CalculTempsTrajet.gs`](./CalculTempsTrajet.gs)

- Menu personnalisé **🚗 Outils Candidatures**.
- Choix du point de départ, du mode de transport (voiture, à pied, vélo, train,
  bus, **Bus 603 + Vélo**), et des colonnes adresse / résultat.
- Calcul **en arrière-plan** : barre de progression, journal des dernières lignes
  traitées, bouton **Arrêter**.

## 📁 Structure du dépôt

| Fichier | Rôle |
|---|---|
| [`SuiviAuto.gs`](./SuiviAuto.gs) | Suivi automatique des contacts entreprises : en-têtes, déclencheur, migrations, doublons. |
| [`CalculTempsTrajet.gs`](./CalculTempsTrajet.gs) | Calculateur de temps de trajet : menu, dialogue, appel API Google Maps, fenêtre. |
| [`appsscript.json`](./appsscript.json) | Paramètres du projet Apps Script (fuseau, runtime V8). |

## 🔧 Installation

### 1. Ouvrir le Google Sheet
**Extensions → Apps Script**.

### 2. Installer le suivi des contacts (`SuiviAuto.gs`)

1. Coller le contenu de [`SuiviAuto.gs`](./SuiviAuto.gs) dans l'éditeur, puis
   **Enregistrer**.
2. Exécuter **`installerSuivi`** une fois : crée l'onglet **Suivi Contacts**
   (en-têtes + colonnes masquées) et installe le déclencheur `onEdit` sur
   **Contacts Entreprises**.
3. Si tu migres depuis une ancienne version : exécuter **`migrerVersUuid`** puis
   **`nettoyerDoublons`**.

### 3. Installer le calculateur de temps de trajet (`CalculTempsTrajet.gs`)

1. Coller le contenu de [`CalculTempsTrajet.gs`](./CalculTempsTrajet.gs) dans
   l'éditeur, puis **Enregistrer**.
2. Recharger le Sheet : le menu **🚗 Outils Candidatures** apparaît.
3. **🔑 Configurer la clé API Google Maps** (voir section dédiée).

### 4. Mettre à jour les onglets

- Le script `SuiviAuto.gs` travaille avec les onglets **« Contacts Entreprises »**
  et **« Suivi Contacts »**.
- Le script `CalculTempsTrajet.gs` crée automatiquement l'onglet **« Adresses de
  départ »** si besoin.

## 🧩 Configuration (bloc « À ADAPTER »)

Chaque script comporte un bloc commenté `// ====== À ADAPTER` en tête :
- noms exacts des en-têtes (accents / majuscules ignorés) ;
- valeurs des listes déroulantes ;
- valeurs écrites dans le suivi.

À adapter selon ton Sheet réel — les noms d'onglets doivent, eux, correspondre
exactement.

## 🔑 Configuration de la clé API Google Maps (obligatoire pour le calculateur)

Le script `CalculTempsTrajet.gs` utilise la **Directions API** avec **ta propre
clé** (quota personnel, et non le quota partagé quasi nul du service Maps
intégré à Apps Script).

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com) → créer/choisir un projet.
2. **APIs & Services → Bibliothèque** → activer **« Directions API »**.
3. **Facturation** : associer une carte.
   ⚠️ Obligatoire, mais Google offre **200 $ de crédit gratuit/mois** (~40 000
   trajets) — aucun débit en usage normal.
4. **APIs & Services → Identifiants → Créer des identifiants → Clé API**.
5. (Recommandé) Restreindre la clé à la **Directions API**.
6. Dans le Sheet : menu **🚗 Outils Candidatures → 🔑 Configurer la clé API**, coller la clé.

La clé est stockée dans les *Script Properties* du projet — **jamais** en dur dans
le code ni visible dans la feuille.

## 🔄 Développement avec clasp (optionnel)

[`clasp`](https://github.com/google/clasp) permet de synchroniser ce dépôt avec le
projet Apps Script en ligne, au lieu de copier-coller les fichiers à la main. Les
fichiers `.clasp.json` et `.clasprc.json` sont ignorés par git (voir
`.gitignore`) : si tu les perds ou clones le dépôt sur une nouvelle machine, voici
comment tout remettre en place.

1. **Installer clasp** (une fois par machine) :
   ```bash
   npm install -g @google/clasp
   ```
2. **Se connecter à ton compte Google** :
   ```bash
   clasp login
   ```
   Ouvre un navigateur pour l'authentification ; crée `~/.clasprc.json`.
3. **Rattacher le dépôt au projet Apps Script existant** :
   - Récupérer le *Script ID* du projet : dans l'éditeur Apps Script du Sheet →
     ⚙️ **Paramètres du projet** → copier l'ID.
   - Dans le dossier du dépôt :
     ```bash
     clasp clone <scriptId>
     ```
     Ça crée `.clasp.json` (référence vers le projet) et récupère `appsscript.json`.
4. **Synchroniser** :
   - `clasp push` : envoie `SuiviAuto.gs` + `CalculTempsTrajet.gs` locaux vers
     l'éditeur en ligne.
   - `clasp pull` : récupère les changements faits en ligne vers le local.

## 📋 Utilisation

### Suivi des entreprises

1. Renseigner les lignes dans **Contacts Entreprises** (statut, entreprise,
   tuteur, adresse…).
2. Passer le statut (via liste déroulante ou texte) → le script met à jour
   automatiquement **Suivi Contacts**.
3. Consulter les réponses dans le suivi ; lancer un nouveau contact si besoin.

### Calcul des temps de trajet

1. Menu **🚗 Outils Candidatures → Calculer les temps de trajet**.
2. Dans la fenêtre : choisir le point de départ, le mode de transport, la colonne
   de l'adresse et la colonne du résultat, puis **Lancer le calcul**.
3. La progression s'affiche. On peut fermer la fenêtre : le calcul continue.

## 🗂️ Fonctionnement technique

- **Suivi auto** :
  - `traiterEdition` est le handler du **déclencheur installable on edit**.
  - `traiter_` lit la ligne éditée, applique les transitions de statut et
    écrit dans le suivi (création via `appendRow` ou mise à jour via `setValue`).
  - `migrerVersUuid` / `nettoyerDoublons` pour les migrations et doublons.
- **Calculateur** :
  - `demarrerCalculFond` prépare un « job » (stocké dans les *Document Properties*)
    ; `executerLotFond`, lancé par déclencheur temporel et/ou depuis la fenêtre,
    traite les lignes par tranches de ~5 min et se re-planifie tant qu'il reste du
    travail. Un `LockService` garantit qu'un seul lot tourne à la fois.
  - **Progression** : la fenêtre interroge `getEtatProgression` toutes les 1,5 s.
