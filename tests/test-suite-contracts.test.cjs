"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repoRoot = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(repoRoot, file), "utf8");
const shellRunner = read("tests/run-shell-smoke.ps1");
const shellHarness = read("tests/shell-interactions.html");
const accessibilityRunner = read("tests/run-accessibility-smoke.ps1");
const translationRunner = read("tests/run-translation-hardening.ps1");
const responsiveRunner = read("tests/run-responsive-matrix.ps1");

function quotedValues(source) {
  return Array.from(source.matchAll(/"([^"]*)"/g), match => match[1]);
}

function validateSetValues(parameterName) {
  const parameterMarker = `[string]$${parameterName}`;
  const parameterIndex = shellRunner.indexOf(parameterMarker);
  assert.notEqual(parameterIndex, -1, `Missing ${parameterName} parameter`);
  const validateSetStart = shellRunner.lastIndexOf("[ValidateSet(", parameterIndex);
  const validateSetEnd = shellRunner.indexOf(")]", validateSetStart);
  assert.ok(validateSetStart >= 0 && validateSetEnd > validateSetStart, `Missing ValidateSet for ${parameterName}`);
  return quotedValues(shellRunner.slice(validateSetStart, validateSetEnd)).filter(Boolean);
}

function scenarioValues(source, parameterName) {
  const expression = new RegExp(`${parameterName}\\s*=\\s*"([^"]+)"`, "g");
  return Array.from(source.matchAll(expression), match => match[1]);
}

function sortedUnique(values) {
  return Array.from(new Set(values)).sort();
}

test("shell runner scenarios match the browser harness without retired parameters", () => {
  const advertisedDialogs = validateSetValues("Dialog");
  const implementedDialogs = sortedUnique(Array.from(
    shellHarness.matchAll(/requestedDialog === "([^"]+)"/g),
    match => match[1]
  ));

  assert.deepEqual(sortedUnique(advertisedDialogs), implementedDialogs);
  assert.doesNotMatch(shellRunner, /CatalogOrigin|VirtualTimeBudgetMs|ScreenshotDelayMs/);
  assert.doesNotMatch(translationRunner, /CatalogOrigin|origin=regions/);
  assert.doesNotMatch(accessibilityRunner, /CatalogOrigin|origin=regions/);
  assert.match(shellRunner, /if \(\$AccessibilityAudit -or \$EnforceAccessibility\) \{ \$query \+= "accessibility=1" \}/);
  assert.match(shellHarness, /const accessibilityAudit = params\.get\("accessibility"\) === "1";/);
});

test("bilingual and accessibility matrices exercise every advertised UI surface", () => {
  const surfaceDialogs = validateSetValues("Dialog").filter(value => value !== "point-selection");
  const bilingualDialogs = scenarioValues(translationRunner, "Dialog");
  const accessibilityDialogs = scenarioValues(accessibilityRunner, "Dialog");

  assert.deepEqual(sortedUnique(bilingualDialogs), sortedUnique(surfaceDialogs));
  assert.deepEqual(sortedUnique(accessibilityDialogs), sortedUnique(surfaceDialogs));
  assert.equal(bilingualDialogs.length, new Set(bilingualDialogs).size, "Duplicate bilingual dialog scenario");
  assert.equal(accessibilityDialogs.length, new Set(accessibilityDialogs).size, "Duplicate accessibility dialog scenario");

  const advertisedWorkspaces = validateSetValues("Workspace");
  assert.deepEqual(sortedUnique(scenarioValues(translationRunner, "Workspace")), sortedUnique(advertisedWorkspaces));
  assert.deepEqual(sortedUnique(scenarioValues(accessibilityRunner, "Workspace")), sortedUnique(advertisedWorkspaces));
});

test("responsive matrix covers the required viewports and CSS boundaries", () => {
  const widths = responsiveRunner.match(/\[int\[\]\]\$Widths\s*=\s*@\(([^)]+)\)/)?.[1]
    .split(",")
    .map(value => Number(value.trim()));
  assert.deepEqual(widths, [1440, 1280, 1080, 1024, 840, 620]);
  assert.match(responsiveRunner, /-Workspace preview -LoadSample[^\n]+-StrictDiagnostics -SkipScreenshot/);
  assert.match(responsiveRunner, /-Workspace \$workspace -LoadSample -TableLayoutOnly[^\n]+-StrictDiagnostics -SkipScreenshot/);
  assert.doesNotMatch(responsiveRunner, /PropertiesSides|-PropertiesSide/);
});

test("reviewed visual baselines match the default regression matrix", () => {
  const expected = [
    "preview-1024x900.png",
    "preview-1280x900.png",
    "preview-1440x1000.png",
    "projects-1024x900.png",
    "projects-1280x900.png",
    "projects-1440x1000.png",
    "quality-1440x1000.png",
    "regions-1440x1000.png",
    "translate-1440x1000.png"
  ];
  const actual = fs.readdirSync(path.join(repoRoot, "tests", "visual-baselines"))
    .filter(file => file.endsWith(".png"))
    .sort();
  assert.deepEqual(actual, expected);
});

test("unit suite has no disabled tests and keeps manual HTML fixtures intentional", () => {
  const disabledTestPattern = /\b(?:test|it|describe)\.(?:only|skip|todo)\s*\(/;
  const unitFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith(".test.cjs") && file !== path.basename(__filename));
  unitFiles.forEach(file => {
    assert.doesNotMatch(read(`tests/${file}`), disabledTestPattern, file);
  });

  const htmlFixtures = fs.readdirSync(__dirname)
    .filter(file => file.endsWith(".html"))
    .sort();
  assert.deepEqual(htmlFixtures, ["shell-interactions.html", "smoke-labels.html"]);
});

test("AGENTS verification commands reference files that exist", () => {
  const requiredPaths = [
    "app.js",
    "properties.js",
    "tests/run-unit-tests.cjs",
    "tools/css-selector-audit.cjs",
    "tests/validate-config.cjs",
    "tests/validate-runtime-assets.cjs",
    "tests/validate-workflows.cjs",
    "tools/build-reference-city-runtime.cjs",
    "src/lib/city-search.js",
    "tests/css-contracts.test.cjs",
    "tests/typography.test.cjs",
    "tests/test-suite-contracts.test.cjs",
    "tests/reference-cities.test.cjs",
    "tests/config-parity.test.cjs",
    "tests/label-geometry.test.cjs",
    "tests/render-scheduling.test.cjs",
    "tests/run-shell-smoke.ps1",
    "tests/run-accessibility-smoke.ps1",
    "tests/run-responsive-matrix.ps1",
    "tests/run-translation-hardening.ps1",
    "tests/run-visual-regression.ps1",
    "tests/run-smoke.ps1"
  ];
  requiredPaths.forEach(file => assert.ok(fs.existsSync(path.join(repoRoot, file)), file));
});
