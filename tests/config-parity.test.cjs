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

function loadBundledI18n() {
  const source = fs.readFileSync(path.join(repoRoot, "i18n.js"), "utf8");
  const window = {};
  vm.runInNewContext(source, { window });
  return window.PLOTYPUS_I18N;
}

function loadProjectFileApi() {
  const source = fs.readFileSync(path.join(repoRoot, "project-file.js"), "utf8");
  const context = { window: {}, globalThis: {} };
  vm.runInNewContext(source, context);
  return context.globalThis.PlotypusProjectFile || context.window.PlotypusProjectFile;
}

function getStaticI18nKeys() {
  const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const keys = new Set();
  ["data-i18n", "data-i18n-title", "data-i18n-aria-label"].forEach(attribute => {
    const pattern = new RegExp(`${attribute}="([^"]+)"`, "g");
    let match;
    while ((match = pattern.exec(html))) {
      keys.add(match[1]);
    }
  });
  return [...keys].sort();
}

function getLiteralJsI18nKeys() {
  const files = ["app.js", "properties.js", "workspace.js", "project-io.js", "project-file.js"];
  const keys = new Set();
  const pattern = /\b(?:t|tOr|startupT)\("([^"`$]+)"/g;
  files.forEach(file => {
    const source = fs.readFileSync(path.join(repoRoot, file), "utf8");
    let match;
    while ((match = pattern.exec(source))) {
      keys.add(match[1]);
    }
  });
  return [...keys].sort();
}

function getAllReferencedJsI18nKeys(i18n) {
  const files = ["app.js", "properties.js", "workspace.js", "project-io.js", "project-file.js", "xlsx-lite.js"];
  const namespaces = [...new Set(Object.keys(i18n.dictionaries.en).map(key => key.split(".")[0]))];
  const pattern = new RegExp(`["'\`]((?:${namespaces.join("|")})\\.[A-Za-z0-9_.-]+)["'\`]`, "g");
  const keys = new Set();
  files.forEach(file => {
    const source = fs.readFileSync(path.join(repoRoot, file), "utf8");
    let match;
    while ((match = pattern.exec(source))) {
      if (!match[1].endsWith(".js")) keys.add(match[1]);
    }
  });
  return [...keys].sort();
}

function getSourceDictionaryKeys(locale) {
  const source = fs.readFileSync(path.join(repoRoot, "i18n.js"), "utf8");
  const marker = `${locale}: Object.freeze({`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `Could not find ${locale} source dictionary`);
  const nextLocale = locale === "en" ? source.indexOf("fr: Object.freeze({", start + marker.length) : -1;
  const end = nextLocale >= 0 ? nextLocale : source.indexOf("\n    })\n  });", start + marker.length);
  assert.notEqual(end, -1, `Could not find the end of the ${locale} source dictionary`);
  const keys = [];
  const pattern = /^\s*"([^"]+)":/gm;
  let match;
  while ((match = pattern.exec(source.slice(start, end)))) keys.push(match[1]);
  return keys;
}

function getInterpolationNames(value) {
  return [...String(value).matchAll(/\{([A-Za-z0-9_]+)\}/g)].map(match => match[1]).sort();
}

function getUndoHistoryI18nKeys() {
  const source = fs.readFileSync(path.join(repoRoot, "app.js"), "utf8");
  const labels = new Set([
    "clear longitude",
    "clear latitude"
  ]);
  const pattern = /\bpush(?:App|Manual)UndoHistory\("([^"`$]+)"/g;
  let match;
  while ((match = pattern.exec(source))) {
    labels.add(match[1]);
  }
  return [...labels].map(label => `status.undo.${label}`).sort();
}

function getConfigBackedI18nKeys(config) {
  const keys = new Set();
  const colourKeyByValue = {
    "#26374a": "gocBlue",
    "#284162": "deepBlue",
    "#1c578a": "accessibleBlue",
    "#217346": "excelGreen",
    "#0b6b57": "mapGreen",
    "#7834bc": "purple",
    "#a05a00": "ochre",
    "#d3080c": "alertRed",
    "#444444": "charcoal",
    "#ffffff": "white"
  };

  Object.entries(config.imageSizePresets || {}).forEach(([presetId, preset]) => {
    keys.add(`properties.size.book.${presetId}`);
    (preset.sizes || []).forEach(size => keys.add(`properties.size.image.${size.value}`));
  });
  Object.keys(config.mapStylePresets || {}).forEach(id => keys.add(`properties.mapStyle.${id}`));
  (config.regionPresetOptions && config.regionPresetOptions.canada || []).forEach(option => {
    keys.add(option.value ? `region.preset.${option.value}` : "region.preset.choose");
  });
  (config.regionPresetOptions && config.regionPresetOptions.world || []).forEach(option => {
    if (!option.value) keys.add("region.preset.chooseContinent");
    else if (option.value === "all") keys.add("region.preset.allCountries");
    else keys.add(`region.preset.${option.value}`);
  });
  (config.markerShapes || []).forEach(shape => keys.add(`properties.category.shape.${shape.value}`));
  (config.categoryColourPresets || []).forEach(preset => {
    if (!preset.value) {
      keys.add("properties.category.colour.custom");
      return;
    }
    const key = colourKeyByValue[String(preset.value).toLowerCase()];
    if (key) keys.add(`properties.category.colour.${key}`);
  });
  Object.keys(config.boundarySources || {}).forEach(id => keys.add(`region.boundary.${id}`));

  return [...keys].sort();
}

function getPropertiesRenderCallsMissingTranslator() {
  const source = fs.readFileSync(path.join(repoRoot, "app.js"), "utf8");
  const pattern = /properties\.render[A-Za-z]+PropertyControls\(\{/g;
  const missing = [];
  let match;
  while ((match = pattern.exec(source))) {
    const callStart = match.index;
    const objectStart = pattern.lastIndex - 1;
    let depth = 0;
    let index = objectStart;
    for (; index < source.length; index += 1) {
      const char = source[index];
      if (char === "{") depth += 1;
      if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          break;
        }
      }
    }
    const callSource = source.slice(callStart, index);
    if (!/(\bt\b|t:)/.test(callSource)) {
      const line = source.slice(0, callStart).split(/\r?\n/).length;
      missing.push(`${match[0].slice(0, -2)} at app.js:${line}`);
    }
  }
  return missing;
}

test("bundled file-mode defaults match the editable JSON configuration", () => {
  const bundled = loadBundledConfig();
  const external = JSON.parse(fs.readFileSync(path.join(repoRoot, "plotypus.config.json"), "utf8"));

  assert.equal(bundled.appVersion, external.appVersion);
  assert.equal(bundled.defaultFontFamily, external.defaultFontFamily);
  assert.equal(bundled.defaultMapStylePreset, external.defaultMapStylePreset);
  assert.deepEqual(bundled.performanceBudgets, external.performanceBudgets);
  assert.deepEqual(bundled.fontOptions, external.fonts);
  assert.deepEqual(bundled.boundarySources, external.boundarySources);
  assert.deepEqual(bundled.imageSizePresets, external.bookSizes);
  assert.deepEqual(bundled.regionPresetOptions, external.regionPresetOptions);
  assert.deepEqual(bundled.markerShapes, external.markerShapes);
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

test("config-backed user-facing labels include French fallbacks", () => {
  const config = loadBundledConfig();
  const labelledItems = [
    ...Object.values(config.boundarySources || {}),
    ...Object.values(config.mapStylePresets || {}),
    ...Object.values(config.imageSizePresets || {}),
    ...Object.values(config.imageSizePresets || {}).flatMap(preset => preset.sizes || []),
    ...Object.values(config.regionPresetOptions || {}).flat(),
    ...(config.markerShapes || []),
    ...(config.categoryColourPresets || [])
  ];

  assert.ok(labelledItems.length > 0);
  labelledItems.forEach(item => {
    assert.ok(String(item.label || "").trim(), `Missing English config label for ${item.value || "configured item"}`);
    assert.ok(String(item.labelFr || "").trim(), `Missing French config label for ${item.value || item.label}`);
  });
});

test("static HTML i18n keys exist in English and French dictionaries", () => {
  const i18n = loadBundledI18n();
  const keys = getStaticI18nKeys();

  assert.ok(keys.length > 0);
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.en, key)),
    [],
    "English dictionary is missing static HTML keys"
  );
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.fr, key)),
    [],
    "French dictionary is missing static HTML keys"
  );
});

test("workspace headline keys exist in English and French dictionaries", () => {
  const i18n = loadBundledI18n();
  const workspaceNames = ["preview", "projects", "categories", "regions", "translate", "quality"];
  const keys = workspaceNames.map(name => `summary.headline.${name}`);

  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.en, key)),
    [],
    "English dictionary is missing workspace headline keys"
  );
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.fr, key)),
    [],
    "French dictionary is missing workspace headline keys"
  );
});

test("English and French i18n dictionaries expose the same keys", () => {
  const i18n = loadBundledI18n();
  const englishKeys = Object.keys(i18n.dictionaries.en).sort();
  const frenchKeys = Object.keys(i18n.dictionaries.fr).sort();

  assert.deepEqual(
    englishKeys.filter(key => !Object.hasOwn(i18n.dictionaries.fr, key)),
    [],
    "French dictionary is missing English keys"
  );
  assert.deepEqual(
    frenchKeys.filter(key => !Object.hasOwn(i18n.dictionaries.en, key)),
    [],
    "English dictionary is missing French keys"
  );
});

test("i18n source dictionaries do not contain duplicate keys", () => {
  ["en", "fr"].forEach(locale => {
    const keys = getSourceDictionaryKeys(locale);
    const duplicates = [...new Set(keys.filter((key, index) => keys.indexOf(key) !== index))];
    assert.deepEqual(duplicates, [], `${locale} dictionary contains duplicate source keys`);
  });
});

test("English and French translations are non-empty and use matching interpolation fields", () => {
  const i18n = loadBundledI18n();
  Object.entries(i18n.dictionaries.en).forEach(([key, english]) => {
    const french = i18n.dictionaries.fr[key];
    assert.ok(String(english).trim(), `English translation is empty: ${key}`);
    assert.ok(String(french).trim(), `French translation is empty: ${key}`);
    assert.deepEqual(
      getInterpolationNames(french),
      getInterpolationNames(english),
      `Interpolation fields differ for ${key}`
    );
  });
});

test("literal JavaScript i18n keys exist in English and French dictionaries", () => {
  const i18n = loadBundledI18n();
  const keys = getLiteralJsI18nKeys();

  assert.ok(keys.length > 0);
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.en, key)),
    [],
    "English dictionary is missing literal JavaScript keys"
  );
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.fr, key)),
    [],
    "French dictionary is missing literal JavaScript keys"
  );
});

test("all namespaced i18n keys referenced by JavaScript exist in both dictionaries", () => {
  const i18n = loadBundledI18n();
  const keys = getAllReferencedJsI18nKeys(i18n);

  assert.ok(keys.length > 0);
  assert.deepEqual(keys.filter(key => !Object.hasOwn(i18n.dictionaries.en, key)), [], "English dictionary is missing referenced keys");
  assert.deepEqual(keys.filter(key => !Object.hasOwn(i18n.dictionaries.fr, key)), [], "French dictionary is missing referenced keys");
});

test("undo history labels have English and French dictionary keys", () => {
  const i18n = loadBundledI18n();
  const keys = getUndoHistoryI18nKeys();

  assert.ok(keys.length > 0);
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.en, key)),
    [],
    "English dictionary is missing undo history label keys"
  );
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.fr, key)),
    [],
    "French dictionary is missing undo history label keys"
  );
});

test("config-backed UI labels have English and French dictionary keys", () => {
  const i18n = loadBundledI18n();
  const config = loadBundledConfig();
  const keys = getConfigBackedI18nKeys(config);

  assert.ok(keys.length > 0);
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.en, key)),
    [],
    "English dictionary is missing config-backed label keys"
  );
  assert.deepEqual(
    keys.filter(key => !Object.hasOwn(i18n.dictionaries.fr, key)),
    [],
    "French dictionary is missing config-backed label keys"
  );
});

test("project validation errors expose structured i18n field labels", () => {
  const projectFile = loadProjectFileApi();
  assert.throws(
    () => projectFile.validateAndNormalizeProject({
      version: 5,
      rows: [],
      categories: [{ id: "test", colour: "not-a-colour" }]
    }, { currentVersion: 5 }),
    error => {
      assert.equal(error.i18nKey, "project.error.hexColour");
      assert.equal(error.i18nParams.labelKey, "project.error.label.category.colour");
      assert.deepEqual(JSON.parse(JSON.stringify(error.i18nParams.labelParams)), { index: 1 });
      return true;
    }
  );
  assert.throws(
    () => projectFile.validateAndNormalizeProject({
      version: 5,
      rows: [],
      regionFills: { qc: "not-a-colour" }
    }, { currentVersion: 5 }),
    error => {
      assert.equal(error.i18nKey, "project.error.hexColour");
      assert.equal(error.i18nParams.labelKey, "project.error.label.regionFill");
      assert.deepEqual(JSON.parse(JSON.stringify(error.i18nParams.labelParams)), { id: "qc" });
      return true;
    }
  );
});

test("Properties renderers receive the active translator", () => {
  assert.deepEqual(
    getPropertiesRenderCallsMissingTranslator(),
    [],
    "Properties render calls must pass t so raw i18n keys do not leak into the UI"
  );
});
