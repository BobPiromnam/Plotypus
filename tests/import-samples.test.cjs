"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const Papa = require("../assets/vendor/papaparse-5.4.1.min.js");
const cityIntegration = require("../city-integration.js");
const regionMatching = require("../region-matching.js");
const cities = require("../data/cities.json");

const repoRoot = path.join(__dirname, "..");
const provinceNames = Object.values(cityIntegration.provinceNames);
const regionRows = provinceNames.map(name => ({ id: name, name }));
const regionLookup = regionMatching.buildRegionLookup(regionRows);

function parseFixture(fileName) {
  const csv = fs.readFileSync(path.join(repoRoot, fileName), "utf8");
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  assert.deepEqual(parsed.errors, [], `${fileName} should parse without CSV errors`);
  assert.ok(parsed.data.length > 0, `${fileName} should contain data rows`);
  return parsed;
}

test("coordinate sample has valid coordinate pairs and callouts", () => {
  const parsed = parseFixture("sample-projects.csv");
  assert.deepEqual(parsed.meta.fields, ["name", "name_fr", "type", "type_fr", "lon", "lat"]);

  let callouts = 0;
  parsed.data.forEach((row, index) => {
    assert.ok(row.name, `coordinate row ${index + 2} should have a name`);
    assert.equal(Boolean(row.lon), Boolean(row.lat), `coordinate row ${index + 2} should provide both coordinates or neither`);
    if (!row.lon) {
      callouts += 1;
      return;
    }
    const lon = Number(row.lon);
    const lat = Number(row.lat);
    assert.ok(Number.isFinite(lon) && lon >= -180 && lon <= 180, `coordinate row ${index + 2} has a valid longitude`);
    assert.ok(Number.isFinite(lat) && lat >= -90 && lat <= 90, `coordinate row ${index + 2} has a valid latitude`);
  });
  assert.ok(callouts > 0, "coordinate sample should exercise no-coordinate callouts");
});

test("province sample resolves every province and territory", () => {
  const parsed = parseFixture("sample-projects-provinces.csv");
  assert.deepEqual(parsed.meta.fields, ["name", "name_fr", "type", "type_fr", "region", "hideLine"]);
  assert.equal(parsed.data.length, provinceNames.length);

  const resolvedIds = parsed.data.map((row, index) => {
    const result = regionMatching.resolveRegionInput(row.region, regionLookup);
    assert.equal(result.status, "matched", `province row ${index + 2} should resolve ${row.region}`);
    return result.id;
  });
  assert.deepEqual(new Set(resolvedIds), new Set(provinceNames));
});

test("city sample resolves unique catalogue cities and their containing provinces", () => {
  const parsed = parseFixture("sample-projects-cities.csv");
  assert.deepEqual(parsed.meta.fields, ["name", "name_fr", "type", "type_fr", "city", "hideLine"]);
  assert.equal(parsed.data.length, provinceNames.length);

  const resolvedIds = parsed.data.map((row, index) => {
    const result = cityIntegration.resolveCityInput(row.city, cities);
    assert.equal(result.status, "matched", `city row ${index + 2} should resolve ${row.city}`);
    const regionId = cityIntegration.resolveRegionId(result.city, regionRows);
    assert.equal(regionId, cityIntegration.getProvinceName(result.city.prov), `city row ${index + 2} should derive its province`);
    return result.city.id;
  });
  assert.equal(new Set(resolvedIds).size, parsed.data.length, "city sample should use unique catalogue cities");
});
