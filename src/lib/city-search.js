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
export const ALIASES = {
  'Québec City': ['Ville de Québec', 'Quebec'],
  'Montréal': ['Montreal'],
  'St. John\u2019s': ['Saint Johns'],
  'Saint John': ['St John'],
  'Trois-Rivières': ['Three Rivers'],
  'Sault Ste. Marie': ['Sault Sainte Marie'],
};

/** NFD-fold accents, lowercase, strip punctuation, collapse whitespace.
 *  "Trois-Rivières" -> "trois rivieres" ; "St. John's" -> "st johns" */
export function norm(s) {
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
export function canon(s) {
  return norm(s)
    .split(' ')
    .map(t => (t === 'saint' || t === 'sainte' || t === 'ste') ? 'st' : t)
    .join(' ');
}

/** Precompute the key list for one dataset record. Call once at load. */
export function indexCity(c) {
  const extra = (c.aliases || []).concat(ALIASES[c.name] || []);
  const keys = [canon(c.name)];
  if (c.name_fr && c.name_fr !== c.name) keys.push(canon(c.name_fr));
  extra.forEach(a => keys.push(canon(a)));
  return Object.assign({}, c, { keys: keys.filter((k, i) => k && keys.indexOf(k) === i) });
}

export function indexDataset(cities) { return cities.map(indexCity); }

/**
 * @param {Array}  indexed  dataset run through indexDataset()
 * @param {string} query    raw user input
 * @param {Array}  excludeIds  ids already added — never offered again
 * @param {number} limit    max rows (UI shows 5)
 * Match = query is a prefix of a key, or a prefix of any word inside a key.
 * NO fuzzy/edit-distance matching: it produces confident wrong answers on place names.
 * Rank by population descending.
 */
export function matches(indexed, query, excludeIds = [], limit = 5) {
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
export function resolveList(indexed, text, excludeIds = []) {
  const found = [], miss = [], seen = excludeIds.slice();
  String(text).split(',').map(t => t.trim()).filter(Boolean).forEach(tok => {
    const hit = matches(indexed, tok, seen, 1)[0];
    if (hit) { found.push(hit); seen.push(hit.id); } else miss.push(tok);
  });
  return { found, miss };
}

/* ------------------------------------------------------------------ tests */
if (typeof process !== 'undefined' && process.argv && process.argv[1] &&
    process.argv[1].endsWith('city-search.js')) {
  const DATA = indexDataset([
    { id: 'ca-nl-st-johns',   name: 'St. John\u2019s',  name_fr: 'St. John\u2019s',   prov: 'NL', pop: 110525 },
    { id: 'ca-nb-saint-john', name: 'Saint John',       name_fr: 'Saint John',        prov: 'NB', pop: 69895 },
    { id: 'ca-qc-montreal',   name: 'Montréal',         name_fr: 'Montréal',          prov: 'QC', pop: 1762949 },
    { id: 'ca-qc-quebec',     name: 'Québec City',      name_fr: 'Ville de Québec',   prov: 'QC', pop: 549459 },
    { id: 'ca-qc-trois-riv',  name: 'Trois-Rivières',   name_fr: 'Trois-Rivières',    prov: 'QC', pop: 139163 },
    { id: 'ca-on-london',     name: 'London',           name_fr: 'London',            prov: 'ON', pop: 422324 },
    { id: 'ca-on-toronto',    name: 'Toronto',          name_fr: 'Toronto',           prov: 'ON', pop: 2794356 },
  ]);
  const ids = q => matches(DATA, q).map(c => c.id);
  const eq = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    console.log((ok ? 'PASS  ' : 'FAIL  ') + label, ok ? '' : '\n      got ' + JSON.stringify(got) + '\n      want ' + JSON.stringify(want));
    if (!ok) process.exitCode = 1;
  };

  eq('"st john" returns BOTH Saint Johns',   ids('st john'),    ['ca-nl-st-johns', 'ca-nb-saint-john']);
  eq('"saint john" returns BOTH',            ids('saint john'), ['ca-nl-st-johns', 'ca-nb-saint-john']);
  eq('accent-free "montreal"',               ids('montreal'),   ['ca-qc-montreal']);
  eq('"quebec" finds Québec City',           ids('quebec'),     ['ca-qc-quebec']);
  eq('FR name "ville de quebec"',            ids('ville de quebec'), ['ca-qc-quebec']);
  eq('alias "three rivers"',                 ids('three rivers'),    ['ca-qc-trois-riv']);
  eq('hyphen-free "trois rivieres"',         ids('trois rivieres'),  ['ca-qc-trois-riv']);
  eq('word-start match "john"',              ids('john'),       ['ca-nl-st-johns', 'ca-nb-saint-john']);
  eq('ranked by population',                 ids('to'),         ['ca-on-toronto']);
  eq('empty query returns nothing',          ids('  '),         []);
  eq('no fuzzy match on typo',               ids('montrael'),   []);
  eq('excludes already-added',               matches(DATA, 'mont', ['ca-qc-montreal']).map(c => c.id), []);

  const bulk = resolveList(DATA, 'toronto, london, atlantis');
  eq('bulk hits',   bulk.found.map(c => c.id), ['ca-on-toronto', 'ca-on-london']);
  eq('bulk misses', bulk.miss,                 ['atlantis']);
}
