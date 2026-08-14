(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlotypusCityIntegration = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const provinceNames = Object.freeze({
    NL: "Newfoundland and Labrador",
    PE: "Prince Edward Island",
    NS: "Nova Scotia",
    NB: "New Brunswick",
    QC: "Quebec",
    ON: "Ontario",
    MB: "Manitoba",
    SK: "Saskatchewan",
    AB: "Alberta",
    BC: "British Columbia",
    YT: "Yukon",
    NT: "Northwest Territories",
    NU: "Nunavut"
  });

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getProvinceName(code) {
    return provinceNames[String(code || "").toUpperCase()] || "";
  }

  function getCityById(cities, id) {
    return (cities || []).find(city => city && String(city.id) === String(id || "")) || null;
  }

  function getCityLabel(city, language = "en") {
    if (!city) return "";
    const name = language === "fr" && city.name_fr ? city.name_fr : city.name;
    return `${String(name || "").trim()}, ${getProvinceName(city.prov) || city.prov || ""}`.replace(/,\s*$/, "");
  }

  function matchesProvince(city, provinceInput) {
    const expected = normalizeText(provinceInput);
    if (!expected) return true;
    return expected === normalizeText(city && city.prov)
      || expected === normalizeText(getProvinceName(city && city.prov));
  }

  function resolveCityInput(value, cities) {
    const raw = String(value || "").trim();
    if (!raw) return { status: "empty", city: null, matches: [] };
    const parts = raw.split(",").map(part => part.trim()).filter(Boolean);
    const cityInput = parts[0] || raw;
    const provinceInput = parts.slice(1).join(" ");
    const expected = normalizeText(cityInput);
    const exact = (cities || []).filter(city => {
      if (!city || !matchesProvince(city, provinceInput)) return false;
      return [city.name, city.name_fr].concat(city.aliases || [])
        .some(name => normalizeText(name) === expected);
    });
    if (exact.length === 1) return { status: "matched", city: exact[0], matches: exact };
    if (exact.length > 1) return { status: "ambiguous", city: null, matches: exact };
    return { status: "unmatched", city: null, matches: [] };
  }

  function resolveRegionId(city, regionRows, findContainingRegion) {
    if (!city) return "";
    if (typeof findContainingRegion === "function") {
      const contained = findContainingRegion(Number(city.lon), Number(city.lat));
      if (contained) return String(contained);
    }
    const expected = normalizeText(getProvinceName(city.prov));
    const match = (regionRows || []).find(region => {
      const id = normalizeText(region && region.id);
      const name = normalizeText(region && region.name);
      return expected && (id === expected || name === expected);
    });
    return match ? String(match.id) : "";
  }

  function createProjectCityRow(city, options = {}) {
    const region = resolveRegionId(city, options.regionRows, options.findContainingRegion);
    return {
      cityId: String(city && city.id || ""),
      cityName: String(city && city.name || ""),
      cityNameFr: String(city && (city.name_fr || city.name) || ""),
      cityProvince: String(city && city.prov || ""),
      name: String(options.name || ""),
      nameFr: String(options.nameFr || ""),
      footnote: "",
      type: String(options.type || "referred"),
      lon: Number(city && city.lon),
      lat: Number(city && city.lat),
      anchor: "city",
      region,
      labelStyle: "compact",
      content: [],
      labelBorder: false,
      hideLine: false,
      elbowLeader: false,
      leaderLineWidth: "",
      leaderLineColour: "",
      labelMaxChars: ""
    };
  }

  function isSameCityRow(row, city) {
    if (!row || !city) return false;
    return String(row.cityId || row.sourceCityId || "") === String(city.id || "");
  }

  function buildProjectCityImport(cities, options = {}) {
    const rows = [];
    const duplicateIds = [];
    const unresolvedRegionIds = [];
    const regionIds = [];

    (cities || []).forEach(city => {
      if (!city || rows.some(row => isSameCityRow(row, city))) {
        if (city && city.id) duplicateIds.push(String(city.id));
        return;
      }
      const row = createProjectCityRow(city, options);
      rows.push(row);
      if (row.region) {
        if (!regionIds.includes(row.region)) regionIds.push(row.region);
      } else if (city.id) {
        unresolvedRegionIds.push(String(city.id));
      }
    });

    return { rows, regionIds, duplicateIds, unresolvedRegionIds };
  }

  return Object.freeze({
    buildProjectCityImport,
    createProjectCityRow,
    getCityById,
    getCityLabel,
    getProvinceName,
    isSameCityRow,
    provinceNames,
    resolveCityInput,
    resolveRegionId
  });
});
