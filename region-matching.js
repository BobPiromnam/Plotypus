(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PLOTYPUS_REGION_MATCHING = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const canadaAliases = Object.freeze({
    "Alberta": ["ab", "alta", "alberta", "calgary", "edmonton", "red deer", "lethbridge", "fort mcmurray"],
    "British Columbia": ["bc", "b c", "british columbia", "vancouver", "victoria", "kelowna", "surrey", "burnaby", "richmond"],
    "Manitoba": ["mb", "man", "manitoba", "winnipeg", "brandon"],
    "New Brunswick": ["nb", "n b", "new brunswick", "fredericton", "moncton", "saint john", "st john"],
    "Newfoundland and Labrador": ["nl", "n l", "nfld", "newfoundland", "labrador", "newfoundland and labrador", "st johns", "st john's"],
    "Northwest Territories": ["nt", "nwt", "n w t", "northwest territories", "north west territories", "yellowknife"],
    "Nova Scotia": ["ns", "n s", "nova scotia", "halifax", "dartmouth", "sydney"],
    "Nunavut": ["nu", "nunavut", "iqaluit"],
    "Ontario": ["on", "ont", "ontario", "toronto", "ottawa", "hamilton", "london", "waterloo", "kingston", "mississauga"],
    "Prince Edward Island": ["pe", "pei", "p e i", "prince edward island", "charlottetown"],
    "Quebec": ["qc", "pq", "que", "quebec", "quebec city", "ville de quebec", "montreal", "montréal", "laval", "gatineau"],
    "Saskatchewan": ["sk", "sask", "saskatchewan", "regina", "saskatoon"],
    "Yukon": ["yt", "yk", "yukon", "yukon territory", "whitehorse"]
  });

  function normalizeRegionLookupText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(province|prov|territory|territories|city|ville|region|regional|of|du|de|la|le|les)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function compactKey(value) {
    return normalizeRegionLookupText(value).replace(/\s+/g, "");
  }

  function addCandidate(lookup, alias, row, source) {
    const key = normalizeRegionLookupText(alias);
    if (!key) return;
    const candidate = { id: row.id, label: row.name || row.label || row.id, source, matchedText: String(alias || "") };
    if (!lookup.exact.has(key)) lookup.exact.set(key, []);
    lookup.exact.get(key).push(candidate);
    const compact = compactKey(alias);
    if (compact && compact !== key) {
      if (!lookup.exact.has(compact)) lookup.exact.set(compact, []);
      lookup.exact.get(compact).push(candidate);
    }
  }

  function dedupeCandidates(candidates) {
    const seen = new Set();
    return (candidates || []).filter(candidate => {
      const key = candidate && candidate.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function buildRegionLookup(regionRows) {
    const rows = Array.isArray(regionRows) ? regionRows.filter(row => row && row.id) : [];
    const lookup = { rows, exact: new Map(), normalizedRows: [] };
    rows.forEach(row => {
      const names = [row.id, row.name, row.label].filter(Boolean);
      names.forEach(name => addCandidate(lookup, name, row, "boundary"));
      const canonicalName = names.find(Boolean);
      const canonicalAliases = canadaAliases[canonicalName] || canadaAliases[row.id] || canadaAliases[row.name] || [];
      canonicalAliases.forEach(alias => addCandidate(lookup, alias, row, "alias"));
      lookup.normalizedRows.push({
        row,
        key: normalizeRegionLookupText(canonicalName),
        compact: compactKey(canonicalName)
      });
    });
    return lookup;
  }

  function levenshteinDistance(a, b) {
    const left = String(a || "");
    const right = String(b || "");
    if (left === right) return 0;
    if (!left) return right.length;
    if (!right) return left.length;
    const distances = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));
    for (let i = 0; i <= left.length; i += 1) distances[i][0] = i;
    for (let j = 0; j <= right.length; j += 1) distances[0][j] = j;
    for (let i = 1; i <= left.length; i += 1) {
      for (let j = 1; j <= right.length; j += 1) {
        const cost = left[i - 1] === right[j - 1] ? 0 : 1;
        distances[i][j] = Math.min(
          distances[i][j - 1] + 1,
          distances[i - 1][j] + 1,
          distances[i - 1][j - 1] + cost
        );
        if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
          distances[i][j] = Math.min(distances[i][j], distances[i - 2][j - 2] + 1);
        }
      }
    }
    return distances[left.length][right.length];
  }

  function maxTypoDistance(value) {
    const length = String(value || "").length;
    if (length < 5) return 0;
    if (length < 9) return 1;
    return 2;
  }

  function chooseExactMatch(lookup, key, original) {
    const candidates = dedupeCandidates(lookup.exact.get(key));
    if (candidates.length === 1) {
      return { id: candidates[0].id, label: candidates[0].label, status: "matched", confidence: candidates[0].source === "alias" ? "alias" : "exact", input: original, matchedText: candidates[0].matchedText };
    }
    if (candidates.length > 1) {
      return { id: "", label: "", status: "ambiguous", confidence: "ambiguous", input: original, matches: candidates.map(candidate => candidate.label) };
    }
    return null;
  }

  function resolveRegionInput(value, lookup) {
    const original = String(value || "").trim();
    if (!original) return { id: "", label: "", status: "empty", confidence: "empty", input: original };
    const activeLookup = lookup && lookup.exact ? lookup : buildRegionLookup([]);
    const key = normalizeRegionLookupText(original);
    const compact = compactKey(original);
    const exact = chooseExactMatch(activeLookup, key, original) || (compact && compact !== key ? chooseExactMatch(activeLookup, compact, original) : null);
    if (exact) return exact;

    const contained = key.length >= 5 ? activeLookup.normalizedRows.filter(item => item.key && (item.key.includes(key) || item.compact.includes(compact))) : [];
    const containedUnique = dedupeCandidates(contained.map(item => ({ id: item.row.id, label: item.row.name || item.row.id, matchedText: item.row.name || item.row.id, source: "contained" })));
    if (containedUnique.length === 1 && key.length >= 5) {
      return { id: containedUnique[0].id, label: containedUnique[0].label, status: "matched", confidence: "contained", input: original, matchedText: containedUnique[0].matchedText };
    }
    if (containedUnique.length > 1) {
      return { id: "", label: "", status: "ambiguous", confidence: "ambiguous", input: original, matches: containedUnique.map(candidate => candidate.label) };
    }

    const typoLimit = maxTypoDistance(compact);
    if (!typoLimit) return { id: "", label: "", status: "unmatched", confidence: "none", input: original };
    const scored = activeLookup.normalizedRows
      .map(item => ({ item, distance: levenshteinDistance(compact, item.compact) }))
      .filter(result => result.distance <= typoLimit)
      .sort((a, b) => a.distance - b.distance || a.item.compact.length - b.item.compact.length);
    if (!scored.length) return { id: "", label: "", status: "unmatched", confidence: "none", input: original };
    const bestDistance = scored[0].distance;
    const best = scored.filter(result => result.distance === bestDistance);
    const unique = dedupeCandidates(best.map(result => ({ id: result.item.row.id, label: result.item.row.name || result.item.row.id, matchedText: result.item.row.name || result.item.row.id, source: "typo" })));
    if (unique.length === 1) {
      return { id: unique[0].id, label: unique[0].label, status: "matched", confidence: "typo", input: original, matchedText: unique[0].matchedText };
    }
    return { id: "", label: "", status: "ambiguous", confidence: "ambiguous", input: original, matches: unique.map(candidate => candidate.label) };
  }

  return {
    buildRegionLookup,
    normalizeRegionLookupText,
    resolveRegionInput,
    levenshteinDistance
  };
});
