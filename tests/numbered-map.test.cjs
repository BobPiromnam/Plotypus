const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const numbers = require("../src/numbered-map.js");
const projectFile = require("../src/project-file.js");
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/project-io.js"), "utf8"), { window });
const io = window.PLOTYPUS_PROJECT_IO;

test("numbers are positive safe integers, canonicalized independently of row identity", () => {
  assert.equal(numbers.normalizeNumber(" 0023 "), "23");
  for (const value of ["", "-1", "0", "1.5", "1e3", "project", "9007199254740992"]) assert.equal(numbers.normalizeNumber(value), "");
});

test("assigning missing numbers reserves imported numbers and never renumbers existing projects", () => {
  const source = [{ rowId: "a", mapNumber: "" }, { rowId: "b", mapNumber: "2" }, { rowId: "c", mapNumber: "2" }, { rowId: "d" }];
  const assigned = numbers.assignMissingNumbers(source);
  assert.deepEqual(assigned.map(row => row.mapNumber), ["1", "2", "2", "3"]);
  assert.equal(source[0].mapNumber, "");
  assert.deepEqual(numbers.assignMissingNumbers(assigned.slice().reverse()).map(row => row.mapNumber), ["3", "2", "2", "1"]);
  assert.equal(numbers.assignMissingNumbers([{ mapNumber: "invalid" }])[0].mapNumber, "invalid");
});

test("one project may repeat a number; conflicting English, French or category details are reported", () => {
  const row = { mapNumber: "23", name: "Rail", nameFr: "Train", type: "strategy" };
  assert.equal(numbers.findNumberIssues([row, { ...row, lon: -82 }]).conflicts.length, 0);
  for (const change of [{ name: "Road" }, { nameFr: "Route" }, { type: "referred" }]) {
    const issues = numbers.findNumberIssues([row, { ...row, ...change }]);
    assert.equal(issues.conflicts[0].number, "23");
    assert.equal(issues.conflicts[0].rows.length, 2);
  }
  assert.equal(numbers.findNumberIssues([{ mapNumber: "" }, { mapNumber: "0" }]).invalid.length, 2);
});

test("companion rows sort numerically, consolidate repeated locations and retain conflicts for review", () => {
  const row = { mapNumber: "23", name: "Rail", nameFr: "Train", type: "strategy" };
  const entries = numbers.companionRows([row, row, { ...row, mapNumber: "2" }, { ...row, name: "Road" }], "en", type => type);
  assert.deepEqual(entries.map(entry => entry.number), ["2", "23", "23"]);
  assert.equal(numbers.companionRows([{ ...row, nameFr: "" }], "fr", () => "Stratégie")[0].title, "");
});

test("printable HTML escapes imported content and exposes semantic table headers", () => {
  const html = numbers.companionHtml([{ number: "1", title: '<script>alert("x")</script>', category: "R&D" }], { language: "fr", title: "Projets <1>", headers: ["Numéro", "Titre", "Catégorie"] });
  assert.match(html, /lang="fr"/);
  assert.match(html, /<th scope="col">Numéro<\/th>/);
  assert.match(html, /<th scope="row">1<\/th>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /R&amp;D/);
  assert.doesNotMatch(html, /<script|https?:\/\//);
});

test("near-anchor layout avoids other badges and keeps saved badges separate for repeated numbers", () => {
  const points = [{ rowId: "a", mapNumber: "23", x: 100, y: 100, lon: -90, lat: 60 }, { rowId: "b", mapNumber: "23", x: 100, y: 100, lon: -90, lat: 60 }];
  const options = { width: 300, height: 250, sizeForRow: () => 11 };
  const placed = numbers.layoutBadges(points, options);
  assert.equal(placed[0].labelX, 100);
  assert.ok(Math.hypot(placed[1].labelX - 100, placed[1].labelY - 100) < 30);
  assert.notEqual(placed[0].labelKey, placed[1].labelKey);
  const manual = { "badge:row:a": { x: 175, y: 80 } };
  const saved = numbers.layoutBadges(points, { ...options, manual });
  assert.equal(saved[0].labelX, 175);
  assert.equal(saved[0].labelY, 80);
  assert.equal(saved[0].lon, -90);
  assert.equal(points[0].x, 100);
  assert.equal(numbers.layoutBadges(points, { ...options, manual, autoPlace: true })[0].labelX, 100);
});

test("badges respect furniture obstacles, canvas edges and bounded invalid-number geometry", () => {
  const options = { width: 300, height: 250, sizeForRow: () => 11, obstacles: [{ rect: { x0: 90, y0: 90, x1: 110, y1: 110 } }] };
  const [badge] = numbers.layoutBadges([{ rowId: "a", mapNumber: "1", x: 100, y: 100 }], options);
  const rect = numbers.badgeRect(badge);
  assert.ok(rect.x1 <= 90 || rect.x0 >= 110 || rect.y1 <= 90 || rect.y0 >= 110);
  const [edge] = numbers.layoutBadges([{ rowId: "b", mapNumber: "x".repeat(10000), x: -50, y: -50 }], options);
  assert.equal(edge.badgeText, "?");
  assert.equal(edge.badgeRadius, 11);
  assert.ok(numbers.badgeRect(edge).x0 >= 0);
});

test("project and CSV exchange retain numbers and mode-specific layouts; legacy files remain valid", () => {
  const rows = [{ rowId: "a", mapNumber: "23", name: "Rail", type: "strategy", lon: -90, lat: 60 }];
  const layouts = { en: { manualLabelPositions: { "badge:row:a": { x: 80, y: 90 }, "row:a": { x: 200, y: 60 } } } };
  const snapshot = io.createProjectSnapshot({ format: "plotypus-project", version: 11, rows, cleanType: type => type, settings: { labelDisplay: "numbers", regionColourMode: "decorative" }, languageLayouts: layouts });
  const roundTrip = projectFile.validateAndNormalizeProject(JSON.parse(JSON.stringify(snapshot)), { currentVersion: 11 });
  assert.equal(roundTrip.rows[0].mapNumber, "23");
  assert.equal(roundTrip.settings.labelDisplay, "numbers");
  assert.equal(roundTrip.languageLayouts.en.manualLabelPositions["badge:row:a"].x, 80);
  assert.equal(roundTrip.languageLayouts.en.manualLabelPositions["row:a"].x, 200);
  const csv = io.createCsvExport({ rows, getCategoryLabel: type => type, getCategoryText: category => category.id, getCategoryForType: id => ({ id }) });
  assert.ok(csv.columns.includes("map_number"));
  assert.equal(csv.rows[0].map_number, "23");
  assert.equal(projectFile.validateAndNormalizeProject({ version: 1, rows: [{ name: "Older map", lon: -90, lat: 60 }] }, { currentVersion: 11 }).rows[0].name, "Older map");
  assert.throws(() => projectFile.validateAndNormalizeProject({ version: 11, format: "plotypus-project", rows: [{ mapNumber: "-1" }] }, { currentVersion: 11 }), error => error.i18nKey === "project.error.mapNumber");
});
