(function initLocationHierarchy(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PLOTYPUS_LOCATION_HIERARCHY = api;
})(typeof window !== "undefined" ? window : globalThis, function createLocationHierarchy() {
  "use strict";

  function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) return "";
    const number = Number(String(value).trim().replace(",", "."));
    return Number.isFinite(number) ? number : "";
  }

  function resolveLocationHierarchy(value = {}) {
    const exactLon = optionalNumber(value.exactLon);
    const exactLat = optionalNumber(value.exactLat);
    const cityLon = optionalNumber(value.cityLon);
    const cityLat = optionalNumber(value.cityLat);
    const cityId = String(value.cityId || "").trim();
    const region = String(value.region || "").trim();
    const hasAnyExactCoordinate = exactLon !== "" || exactLat !== "";
    const hasExactCoordinates = exactLon !== "" && exactLat !== "";
    const hasPartialExactCoordinates = hasAnyExactCoordinate && !hasExactCoordinates;
    const hasCityCoordinates = Boolean(cityId && cityLon !== "" && cityLat !== "");
    const hasCityIssue = Boolean(cityId && !hasCityCoordinates);

    if (hasExactCoordinates) {
      return {
        source: "coordinates",
        anchor: "coord",
        lon: exactLon,
        lat: exactLat,
        hasLocation: true,
        hasExactCoordinates,
        hasPartialExactCoordinates,
        hasCityCoordinates,
        locationIssue: false
      };
    }
    if (hasCityCoordinates) {
      return {
        source: "city",
        anchor: "city",
        lon: cityLon,
        lat: cityLat,
        hasLocation: true,
        hasExactCoordinates,
        hasPartialExactCoordinates,
        hasCityCoordinates,
        locationIssue: hasPartialExactCoordinates
      };
    }
    if (region) {
      return {
        source: "region",
        anchor: "region",
        lon: "",
        lat: "",
        hasLocation: true,
        hasExactCoordinates,
        hasPartialExactCoordinates,
        hasCityCoordinates,
        locationIssue: hasPartialExactCoordinates || hasCityIssue
      };
    }
    if (hasAnyExactCoordinate) {
      return {
        source: "coordinates",
        anchor: "coord",
        lon: exactLon,
        lat: exactLat,
        hasLocation: false,
        hasExactCoordinates,
        hasPartialExactCoordinates,
        hasCityCoordinates,
        locationIssue: true
      };
    }
    if (cityId) {
      return {
        source: "city",
        anchor: "city",
        lon: cityLon,
        lat: cityLat,
        hasLocation: false,
        hasExactCoordinates,
        hasPartialExactCoordinates,
        hasCityCoordinates,
        locationIssue: true
      };
    }
    return {
      source: "unlocated",
      anchor: "coord",
      lon: "",
      lat: "",
      hasLocation: false,
      hasExactCoordinates,
      hasPartialExactCoordinates,
      hasCityCoordinates,
      locationIssue: false
    };
  }

  return { optionalNumber, resolveLocationHierarchy };
});
