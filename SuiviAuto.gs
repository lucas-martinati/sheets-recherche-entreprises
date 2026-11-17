/**
 * Suivi automatique des contacts entreprises — Google Sheets.
 *
 * - Feuille source : « Contacts Entreprises » (statut, établissement d'accueil,
 *   nom/prénom du tuteur, adresse…)
 * - Feuille cible : « Suivi Contacts » (entreprise contactée, n° de l'offre,
 *   personne contactée, date du contact, réponse, commentaires, clé technique)
 *
 * Bloc « À ADAPTER » en haut : noms exacts des en-têtes, accents et majuscules
 * ignorés (mais les noms d'onglets doivent correspondre au Sheet réel).
 */

// ====== À ADAPTER (noms exacts des en-têtes, accents et majuscules ignorés) ======
const CONTACTS_SHEET = "Contacts Entreprises";
const SUIVI_SHEET    = "Suivi Contacts";
const HEADER_ROWS    = 1;

// En-têtes dans "Contacts Entreprises"
const H_CONTACTS = {
  status:   "Statut",
  entrep:   "Nom Etablissement d'accueil",
  nom:      "Nom Tuteur",
  prenom:   "Prénom Tuteur",
  adresse:  "Adresse",
  id:       "ID"                             // créée automatiquement si absente
};

// En-têtes dans "Suivi Contacts"
const H_SUIVI = {
  entrep:   "Entreprise contactée",
  offre:    "N° de l'offre",
  personne: "Personne contactée",
  date:     "Date du contact",
  reponse:  "Réponse",
  comm:     "Commentaires",
  cle:      "Clé (technique)"
};

// Valeurs de ta liste déroulante
const S_ATTENTE  = "En attente";
const S_POSITIVE = "Réponse positive";
const S_NEGATIVE = "Réponse négative";

// Valeurs écrites dans "Suivi Contacts"
const R_DEFAUT   = "Sans réponse";
const R_POSITIVE = "Réponse positive";
const R_NEGATIVE = "Refusé";
// =================================================================================

function norm_(s) {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

// Retourne { clé: numéro de colonne (1 = A) } d'après les en-têtes.
// creerManquantes : liste de clés à créer en fin d'en-tête si absentes.
function colonnes_(sh, noms, creerManquantes) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const entetes = sh.getRange(HEADER_ROWS, 1, 1, lastCol).getValues()[0].map(norm_);
  const res = {};
  let prochaine = lastCol + 1;
  for (const k in noms) {
    const i = entetes.indexOf(norm_(noms[k]));
    if (i !== -1) { res[k] = i + 1; continue; }
    if (creerManquantes && creerManquantes.includes(k)) {
      sh.getRange(HEADER_ROWS, prochaine).setValue(noms[k]);
      res[k] = prochaine++;
    } else {
      throw new Error('En-tête introuvable dans "' + sh.getName() + '" : "' + noms[k] + '"');
    }
  }
  return res;
}

function setupSuivi() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SUIVI_SHEET) || ss.insertSheet(SUIVI_SHEET);
  const noms = Object.values(H_SUIVI);
  sh.getRange(1, 1, 1, noms.length).setValues([noms]).setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.hideColumns(noms.length);
}

// Déclencheur installable (voir installerDeclencheur)
function traiterEdition(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    traiter_(e);
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function traiter_(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== CONTACTS_SHEET) return;

  const suivi = e.source.getSheetByName(SUIVI_SHEET);
  if (!suivi) return;

  const C = colonnes_(sh, H_CONTACTS, ["id"]);
  const S = colonnes_(suivi, H_SUIVI);

  // On ne réagit que si la colonne Statut est concernée par l'édition
  if (e.range.getColumn() > C.status || e.range.getLastColumn() < C.status) return;

  const nbColsSuivi = suivi.getLastColumn();
  const first = Math.max(e.range.getRow(), HEADER_ROWS + 1);

  for (let r = first; r <= e.range.getLastRow(); r++) {
    const row = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0];

    const status = String(row[C.status - 1]).trim();
    if (![S_ATTENTE, S_POSITIVE, S_NEGATIVE].includes(status)) continue;

    const entreprise = row[C.entrep - 1];
    if (!entreprise) continue;

    const personne = (row[C.prenom - 1] + " " + row[C.nom - 1]).trim();

    // ID unique : créé une seule fois, puis conservé
    let cle = String(row[C.id - 1] || "");
    if (!cle) {
      cle = Utilities.getUuid();
      sh.getRange(r, C.id).setValue(cle);
    }

    const last = suivi.getLastRow();
    const cles = last > 1 ? suivi.getRange(2, S.cle, last - 1, 1).getValues().flat() : [];
    const idx = cles.indexOf(cle);

    const reponse = status === S_POSITIVE ? R_POSITIVE
                  : status === S_NEGATIVE ? R_NEGATIVE : R_DEFAUT;

    if (idx === -1) {
      const ligne = new Array(nbColsSuivi).fill("");
      ligne[S.entrep - 1]   = entreprise;
      ligne[S.personne - 1] = personne;
      ligne[S.date - 1]     = new Date();
      ligne[S.reponse - 1]  = reponse;
      ligne[S.cle - 1]      = cle;
      suivi.appendRow(ligne);
    } else {
      suivi.getRange(idx + 2, S.reponse).setValue(reponse);
    }
  }
}

// À exécuter UNE SEULE FOIS : crée le déclencheur installable
function installerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("traiterEdition")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}

// À exécuter UNE SEULE FOIS : installation complète du suivi auto
// (création de l'onglet « Suivi Contacts » + déclencheur onEdit).
function installerSuivi() {
  setupSuivi();
  installerDeclencheur();
}

// À exécuter UNE SEULE FOIS : crée la colonne ID si besoin, donne un ID
// à chaque contact et remplace l'ancienne clé dans Suivi pour garder le lien
function migrerVersUuid() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(CONTACTS_SHEET);
  const suivi = ss.getSheetByName(SUIVI_SHEET);

  const C = colonnes_(sh, H_CONTACTS, ["id"]);
  const S = colonnes_(suivi, H_SUIVI);

  const nbRows = sh.getLastRow() - HEADER_ROWS;
  if (nbRows < 1) return;
  const data = sh.getRange(HEADER_ROWS + 1, 1, nbRows, sh.getLastColumn()).getValues();

  const lastS = suivi.getLastRow();
  const cles = lastS > 1 ? suivi.getRange(2, S.cle, lastS - 1, 1).getValues().flat() : [];

  const ids = data.map(row => {
    let id = row[C.id - 1];
    if (id) return [id];
    const entreprise = row[C.entrep - 1];
    if (!entreprise) return [""];

    id = Utilities.getUuid();
    const ancienne = [entreprise, row[C.nom - 1], row[C.prenom - 1], row[C.adresse - 1]].join("|");
    const idx = cles.indexOf(ancienne);
    if (idx !== -1) cles[idx] = id;
    return [id];
  });

  sh.getRange(HEADER_ROWS + 1, C.id, nbRows, 1).setValues(ids);
  if (cles.length) suivi.getRange(2, S.cle, cles.length, 1).setValues(cles.map(c => [c]));
}

// À exécuter UNE SEULE FOIS si besoin : supprime les doublons existants
function nettoyerDoublons() {
  const suivi = SpreadsheetApp.getActive().getSheetByName(SUIVI_SHEET);
  const S = colonnes_(suivi, H_SUIVI);
  const last = suivi.getLastRow();
  if (last < 3) return;
  const cles = suivi.getRange(2, S.cle, last - 1, 1).getValues().flat();
  const vus = {};
  for (let i = cles.length - 1; i >= 0; i--) {
    const c = cles[i];
    if (vus[c]) suivi.deleteRow(i + 2);
    else vus[c] = true;
  }
}
