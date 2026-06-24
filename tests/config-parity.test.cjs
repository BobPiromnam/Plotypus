const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");

function loadBundledConfig() {
  const source = fs.readFileSync(path.join(repoRoot, "config.js"), "utf8");
  const window = {
    location: { protocol: "file:" },
    fetch: null
  };
  const document = {
    querySelector() {
      return null;
    },
    createElement() {
      return {};
    },
    head: {
      appendChild() {}
    }
  };
  vm.runInNewContext(source, { window, document, console, Promise });
  return JSON.parse(JSON.stringify(window.PLOTYPUS_CONFIG));
}

test("bundled file-mode defaults match the editable JSON configuration", () => {
  const bundled = loadBundledConfig();
  const external = JSON.parse(fs.readFileSync(path.join(repoRoot, "plotypus.config.json"), "utf8"));

  assert.equal(bundled.defaultFontFamily, external.defaultFontFamily);
  assert.equal(bundled.defaultMapStylePreset, external.defaultMapStylePreset);
  assert.deepEqual(bundled.performanceBudgets, external.performanceBudgets);
  assert.deepEqual(bundled.fontOptions, external.fonts);
  assert.deepEqual(bundled.imageSizePresets, external.bookSizes);
  assert.deepEqual(bundled.categoryColourPresets, external.categoryColourPresets);
  assert.deepEqual(bundled.mapStylePresets, external.mapStyles);
  assert.deepEqual(bundled.categorySettings, external.categories);
  assert.deepEqual(bundled.sampleRows, external.sampleRows);
  assert.deepEqual(bundled.layoutDefaults, {
    bookSizeInput: external.defaults.bookSize,
    imageSizeInput: external.defaults.imageSize,
    labelSizeInput: external.defaults.printLabelSize,
    mapScaleInput: external.defaults.mapScale,
    markerSizeInput: external.defaults.defaultMarkerSize,
    lineWidthInput: external.defaults.defaultLineWidth,
    labelCharsInput: external.defaults.labelMaxChars
  });
});
