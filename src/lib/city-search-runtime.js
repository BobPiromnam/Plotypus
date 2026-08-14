/* Generated from src/lib/city-search.js. Do not edit by hand. */
(function (global) {
  "use strict";

/**
 * city-search.js — reference implementation for Plotypus reference-city lookup.
 * Ported verbatim from the design prototype (Plotypus Start Screen.dc.html).
 * Framework-free, no dependencies. Do not re-invent these functions — the
 * accent and Saint folding rules are load-bearing and were bug-fixed once already.
 *
 * Run the self-test:  node city-search.js
 */

/** Extra search keys per record. Two-way by construction: both the canonical
 *  name and every alias are indexed, so either spelling finds the city. */
const ALIASES = {
  'Québec City': ['Ville de Québec', 'Quebec'],
  'Montréal': ['Montreal'],
  'St. John\u2019s': ['Saint Johns'],
  'Saint John': ['St John'],
  'Trois-Rivières': ['Three Rivers'],
  'Sault Ste. Marie': ['Sault Sainte Marie'],
};

/** NFD-fold accents, lowercase, strip punctuation, collapse whitespace.
 *  "Trois-Rivières" -> "trois rivieres" ; "St. John's" -> "st johns" */
function norm(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-‐‑‒–—]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fold saint/sainte/ste/st to one token so "st john" and "saint john"
 *  index alike. WITHOUT this, "st john" returns only St. John's NL and an
 *  author looking for Saint John NB silently gets the wrong province. */
function canon(s) {
  return norm(s)
    .split(' ')
    .map(t => (t === 'saint' || t === 'sainte' || t === 'ste') ? 'st' : t)
    .join(' ');
}

/** Precompute the key list for one dataset record. Call once at load. */
function indexCity(c) {
  const extra = (c.aliases || []).concat(ALIASES[c.name] || []);
  const keys = [canon(c.name)];
  if (c.name_fr && c.name_fr !== c.name) keys.push(canon(c.name_fr));
  extra.forEach(a => keys.push(canon(a)));
  return Object.assign({}, c, { keys: keys.filter((k, i) => k && keys.indexOf(k) === i) });
}

function indexDataset(cities) { return cities.map(indexCity); }

/**
 * @param {Array}  indexed  dataset run through indexDataset()
 * @param {string} query    raw user input
 * @param {Array}  excludeIds  ids already added — never offered again
 * @param {number} limit    max rows (UI shows 5)
 * Match = query is a prefix of a key, or a prefix of any word inside a key.
 * NO fuzzy/edit-distance matching: it produces confident wrong answers on place names.
 * Rank by population descending.
 */
function matches(indexed, query, excludeIds = [], limit = 5) {
  const n = canon(query);
  if (!n) return [];
  return indexed
    .filter(c => excludeIds.indexOf(c.id) < 0)
    .filter(c => c.keys.some(k => k.indexOf(n) === 0 || k.indexOf(' ' + n) > -1))
    .sort((a, b) => b.pop - a.pop)
    .slice(0, limit);
}

/** Comma-separated bulk add. Returns hits in input order + the misses verbatim,
 *  so the UI can name what it could not find. Never guesses for a miss. */
function resolveList(indexed, text, excludeIds = []) {
  const found = [], miss = [], seen = excludeIds.slice();
  String(text).split(',').map(t => t.trim()).filter(Boolean).forEach(tok => {
    const hit = matches(indexed, tok, seen, 1)[0];
    if (hit) { found.push(hit); seen.push(hit.id); } else miss.push(tok);
  });
  return { found, miss };
}

  global.PLOTYPUS_CITY_SEARCH = Object.freeze({
    ALIASES,
    norm,
    canon,
    indexCity,
    indexDataset,
    matches,
    resolveList
  });
})(window);
