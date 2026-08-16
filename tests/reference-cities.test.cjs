"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const vm = require("node:vm");

const repoRoot = path.join(__dirname, "..");
const referenceCities = require(path.join(repoRoot, "reference-cities.js"));
const cityIntegration = require(path.join(repoRoot, "city-integration.js"));
const projectFile = require(path.join(repoRoot, "project-file.js"));
const projectIoWindow = {};
vm.runInNewContext(
  fs.readFileSync(path.join(repoRoot, "project-io.js"), "utf8"),
  { window: projectIoWindow },
  { filename: "project-io.js" }
);
const projectIo = projectIoWindow.PLOTYPUS_PROJECT_IO;
const cities = JSON.parse(fs.readFileSync(path.join(repoRoot, "data", "cities.json"), "utf8"));
const searchModuleUrl = pathToFileURL(path.join(repoRoot, "src", "lib", "city-search.js")).href;

test("offline catalogue covers Canadian census subdivisions without invalid coordinates", () => {
  assert.ok(cities.length >= 2000, `expected at least 2,000 offline cities, received ${cities.length}`);
  assert.equal(new Set(cities.map(city => city.id)).size, cities.length);
  assert.equal(cities.some(city => /�/.test(`${city.name}${city.name_fr}`)), false);
  assert.equal(cities.some(city => !Number.isFinite(city.lat) || city.lat < 40 || city.lat > 84), false);
  assert.equal(cities.some(city => !Number.isFinite(city.lon) || city.lon < -142 || city.lon > -50), false);

  ["ca-on-mississauga", "ca-on-brampton", "ca-bc-surrey", "ca-nu-iqaluit"].forEach(id => {
    assert.ok(cities.some(city => city.id === id), `offline catalogue is missing ${id}`);
  });
});

test("reference-city search keeps the reviewed accent and Saint behaviour", async () => {
  const search = await import(searchModuleUrl);
  const indexed = search.indexDataset(cities);
  const ids = query => search.matches(indexed, query).map(city => city.id);

  assert.deepEqual(ids("st john").slice(0, 2), ["ca-nl-st-johns", "ca-nb-saint-john"]);
  assert.deepEqual(ids("saint john").slice(0, 2), ["ca-nl-st-johns", "ca-nb-saint-john"]);
  assert.equal(ids("montreal")[0], "ca-qc-montreal");
  assert.equal(ids("ville de quebec")[0], "ca-qc-quebec");
  assert.equal(ids("three rivers")[0], "ca-qc-trois-riv");
  assert.equal(ids("trois rivieres")[0], "ca-qc-trois-riv");
  assert.equal(search.matches(indexed, "mont", ["ca-qc-montreal"]).some(city => city.id === "ca-qc-montreal"), false);

  const bulk = search.resolveList(indexed, "moncton, victoria, atlantis");
  assert.deepEqual(bulk.found.map(city => city.id), ["ca-nb-moncton", "ca-bc-victoria"]);
  assert.deepEqual(bulk.miss, ["atlantis"]);
});

test("reference-city model preserves unresolved IDs and bilingual overrides", () => {
  const model = referenceCities.normalizeModel({
    ids: ["ca-on-toronto", "missing-city", "ca-on-toronto", ""],
    overrides: {
      "ca-on-toronto": { name: { en: "Toronto centre", fr: "Centre de Toronto" } },
      "missing-city": { name: { en: "Stored name" } }
    }
  });

  assert.deepEqual(model.ids, ["ca-on-toronto", "missing-city"]);
  assert.deepEqual(model.overrides["ca-on-toronto"].name, {
    en: "Toronto centre",
    fr: "Centre de Toronto"
  });
  assert.equal(model.overrides["missing-city"].name.en, "Stored name");
  assert.equal(model.overrides["missing-city"].name.fr, "");
  assert.equal(model.rule, null);
  assert.equal(model.style, "default");
});

test("older projects migrate to an empty additive baselayer model", () => {
  const migrated = projectFile.validateAndNormalizeProject({
    version: 8,
    format: "plotypus-project",
    boundary: "canada",
    rows: []
  }, {
    currentVersion: 9,
    projectFormat: "plotypus-project",
    boundarySources: { canada: { projection: "canada" }, world: { projection: "world" } },
    mapStylePresets: { default: {} },
    defaultMapStyle: "default"
  });

  assert.deepEqual(migrated.baselayer, {
    id: "canada",
    geometrySource: "canada",
    projection: "canada",
    referenceCities: { ids: [], overrides: {}, rule: null, style: "default" }
  });
});

test("project round-trip stores reference-city IDs rather than resolved records", () => {
  const baselayer = {
    id: "canada",
    geometrySource: "canada",
    projection: "canada",
    referenceCities: {
      ids: ["ca-on-toronto", "missing-city"],
      overrides: { "ca-on-toronto": { name: { en: "Toronto", fr: "Toronto" } } },
      rule: null,
      style: "default"
    }
  };
  const snapshot = projectIo.createProjectSnapshot({
    version: 9,
    boundary: "canada",
    baselayer,
    rows: [],
    categories: [],
    cleanType: value => value
  });

  assert.deepEqual(JSON.parse(JSON.stringify(snapshot.baselayer.referenceCities.ids)), ["ca-on-toronto", "missing-city"]);
  assert.equal(snapshot.baselayer.referenceCities.ids.some(value => typeof value === "object"), false);

  const restored = projectFile.validateAndNormalizeProject(snapshot, {
    currentVersion: 9,
    projectFormat: "plotypus-project",
    boundarySources: { canada: { projection: "canada" } },
    mapStylePresets: { default: {} },
    defaultMapStyle: "default"
  });
  assert.deepEqual(JSON.parse(JSON.stringify(restored.baselayer.referenceCities)), baselayer.referenceCities);
});

test("the field is mounted only in the two reviewed locations", () => {
  const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const propertiesSource = fs.readFileSync(path.join(repoRoot, "properties.js"), "utf8");
  const setupMounts = indexSource.match(/id="referenceCitiesField"/g) || [];
  const baselayerMounts = indexSource.match(/id="referenceCitiesBaselayerField"/g) || [];

  assert.equal(setupMounts.length, 1);
  assert.equal(baselayerMounts.length, 1);
  assert.doesNotMatch(propertiesSource, /referenceCities(?:Properties|Baselayer)Field/);
  assert.match(indexSource, /startup-baselayer-grid[\s\S]*id="referenceCitiesField"[\s\S]*startup-canvas-section/);
  assert.match(indexSource, /id="regionTablePane"[\s\S]*id="referenceCitiesBaselayerField"[\s\S]*id="regionTable"/);
});

test("reference-city runtime remains compatible with direct file use", () => {
  const portableWindow = {};
  const citiesRuntimeSource = fs.readFileSync(path.join(repoRoot, "data", "cities.js"), "utf8");
  const searchRuntimeSource = fs.readFileSync(path.join(repoRoot, "src", "lib", "city-search-runtime.js"), "utf8");
  vm.runInNewContext(citiesRuntimeSource, { window: portableWindow }, { filename: "data/cities.js" });
  vm.runInNewContext(searchRuntimeSource, { window: portableWindow }, { filename: "src/lib/city-search-runtime.js" });

  const indexed = portableWindow.PLOTYPUS_CITY_SEARCH.indexDataset(portableWindow.PLOTYPUS_CITIES);
  assert.deepEqual(
    JSON.parse(JSON.stringify(portableWindow.PLOTYPUS_CITY_SEARCH.matches(indexed, "st john").map(city => city.id).slice(0, 2))),
    ["ca-nl-st-johns", "ca-nb-saint-john"]
  );

  const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const appSource = fs.readFileSync(path.join(repoRoot, "app.js"), "utf8");
  assert.ok(indexSource.indexOf("data/cities.js") < indexSource.indexOf("app.js"));
  assert.ok(indexSource.indexOf("src/lib/city-search-runtime.js") < indexSource.indexOf("app.js"));
  assert.doesNotMatch(appSource, /import\(["']\.\/src\/lib\/city-search\.js/);
  assert.doesNotMatch(appSource, /fetchJson\(["']data\/cities\.json/);
});

test("project-city import preserves coordinates and derives its containing province", () => {
  const toronto = cities.find(city => city.id === "ca-on-toronto");
  const result = cityIntegration.buildProjectCityImport([toronto], {
    type: "referred",
    regionRows: [{ id: "Ontario", name: "Ontario" }]
  });

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].name, "");
  assert.equal(result.rows[0].nameFr, "");
  assert.equal(result.rows[0].cityId, "ca-on-toronto");
  assert.equal(result.rows[0].cityName, "Toronto");
  assert.equal(result.rows[0].cityProvince, "ON");
  assert.equal(result.rows[0].anchor, "city");
  assert.equal(result.rows[0].region, "Ontario");
  assert.equal(result.rows[0].lon, toronto.lon);
  assert.equal(result.rows[0].lat, toronto.lat);
  assert.deepEqual(result.regionIds, ["Ontario"]);
});

test("multiple project points can use the same city location", () => {
  const toronto = cities.find(city => city.id === "ca-on-toronto");
  const result = cityIntegration.buildProjectCityImport([toronto], {
    existingRows: [{ cityId: toronto.id, name: "Existing project", lon: toronto.lon, lat: toronto.lat }],
    regionRows: [{ id: "Ontario", name: "Ontario" }]
  });

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].cityId, toronto.id);
  assert.deepEqual(result.duplicateIds, []);
});

test("city text resolves exactly and uses the province to disambiguate", () => {
  const londonOn = { id: "london-on", name: "London", name_fr: "London", prov: "ON", aliases: [] };
  const londonBc = { id: "london-bc", name: "London", name_fr: "London", prov: "BC", aliases: [] };

  assert.equal(cityIntegration.resolveCityInput("Toronto", cities).city.id, "ca-on-toronto");
  assert.equal(cityIntegration.resolveCityInput("Montréal, QC", cities).city.id, "ca-qc-montreal");
  assert.equal(cityIntegration.resolveCityInput("London", [londonOn, londonBc]).status, "ambiguous");
  assert.equal(cityIntegration.resolveCityInput("London, Ontario", [londonOn, londonBc]).city.id, "london-on");
});

test("city-located project points survive project and CSV export", () => {
  const toronto = cities.find(city => city.id === "ca-on-toronto");
  const row = {
    rowId: "project-1",
    name: "Housing project",
    nameFr: "Projet de logement",
    footnote: "",
    type: "referred",
    lon: toronto.lon,
    lat: toronto.lat,
    anchor: "city",
    region: "Ontario",
    cityId: toronto.id,
    cityName: toronto.name,
    cityNameFr: toronto.name_fr,
    cityProvince: toronto.prov
  };
  const snapshot = projectIo.createProjectSnapshot({
    version: 9,
    boundary: "canada",
    projectLocationMode: "cities",
    rows: [row],
    categories: [],
    cleanType: value => value
  });
  assert.equal(snapshot.projectLocationMode, "cities");
  assert.equal(snapshot.rows[0].cityId, toronto.id);
  assert.equal(snapshot.rows[0].name, "Housing project");

  const csv = projectIo.createCsvExport({
    projectLocationMode: "cities",
    rows: [row],
    getCategoryLabel: value => value,
    getCategoryText: value => value,
    getCategoryForType: value => value
  });
  assert.deepEqual(JSON.parse(JSON.stringify(csv.columns)), ["name", "name_fr", "footnote", "type", "type_fr", "city", "hideLine"]);
  assert.equal(csv.rows[0].city, "Toronto, ON");
  assert.equal(csv.rows[0].name, "Housing project");
});

test("Project points uses city autosuggest instead of disconnected preset cards", () => {
  const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const appSource = fs.readFileSync(path.join(repoRoot, "app.js"), "utf8");
  const styleSource = fs.readFileSync(path.join(repoRoot, "style.css"), "utf8");

  assert.match(indexSource, /id="projectCitiesField"/);
  assert.match(indexSource, /data-project-location-mode="cities"/);
  assert.match(indexSource, /data-i18n="table\.cityColumn"/);
  assert.doesNotMatch(indexSource, /data-catalog-preset="major-cities"/);
  assert.match(appSource, /buildProjectCityImport/);
  assert.match(appSource, /regionVisibility\[regionId\] = true/);
  assert.match(appSource, /drawReferenceCities/);
  assert.match(styleSource, /#projectTable \.city-location-field\.is-compact input\.cityLocationInput\[type="text"\][\s\S]*?padding:\s*0 42px;/);
});
