#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const configPath = path.resolve(repoRoot, process.argv[2] || "plotypus.config.json");
const errors = [];
const warnings = [];

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function describePath(parts) {
  return parts.join(".");
}

function addError(parts, message) {
  errors.push(`${describePath(parts)}: ${message}`);
}

function addWarning(parts, message) {
  warnings.push(`${describePath(parts)}: ${message}`);
}

function requireObject(value, parts) {
  if (!isPlainObject(value)) {
    addError(parts, "must be an object");
    return false;
  }
  return true;
}

function requireArray(value, parts) {
  if (!Array.isArray(value)) {
    addError(parts, "must be an array");
    return false;
  }
  return true;
}

function requireString(value, parts) {
  if (typeof value !== "string" || !value.trim()) {
    addError(parts, "must be a non-empty string");
    return false;
  }
  return true;
}

function requireNumber(value, parts, options = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addError(parts, "must be a finite number");
    return false;
  }
  if (options.min !== undefined && value < options.min) {
    addError(parts, `must be at least ${options.min}`);
    return false;
  }
  if (options.max !== undefined && value > options.max) {
    addError(parts, `must be no more than ${options.max}`);
    return false;
  }
  return true;
}

function isHexColour(value) {
  return typeof value === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}

function validateColour(value, parts, options = {}) {
  if (options.allowEmpty && value === "") return true;
  if (!isHexColour(value)) {
    addError(parts, "must be a hex colour such as #444444");
    return false;
  }
  return true;
}

function validateUnique(items, getKey, parts, label) {
  const seen = new Map();
  items.forEach((item, index) => {
    const key = getKey(item);
    if (!key) return;
    if (seen.has(key)) {
      addError(parts.concat(index), `duplicates ${label} "${key}" from ${describePath(parts.concat(seen.get(key)))}`);
      return;
    }
    seen.set(key, index);
  });
}

function stripUrlSuffix(filePath) {
  return filePath.split(/[?#]/)[0];
}

function isRemoteUrl(filePath) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(filePath);
}

function validateLocalFile(filePath, parts) {
  if (typeof filePath !== "string" || !filePath.trim()) return;
  if (isRemoteUrl(filePath)) {
    addError(parts, "must reference a bundled local file, not a remote URL");
    return;
  }
  const cleanedPath = stripUrlSuffix(filePath);
  const resolved = path.resolve(repoRoot, cleanedPath);
  if (!resolved.startsWith(repoRoot + path.sep) && resolved !== repoRoot) {
    addError(parts, "must stay inside the Plotypus folder");
    return;
  }
  if (!fs.existsSync(resolved)) {
    addError(parts, `references missing file "${cleanedPath}"`);
  }
}

function validateDefaults(config) {
  const defaults = config.defaults;
  if (!requireObject(defaults, ["defaults"])) return;

  const requiredDefaults = {
    bookSize: "string",
    imageSize: "string",
    printLabelSize: "number",
    mapScale: "number",
    defaultMarkerSize: "number",
    defaultLineWidth: "number",
    labelMaxChars: "number"
  };

  Object.entries(requiredDefaults).forEach(([key, type]) => {
    if (!(key in defaults)) addError(["defaults", key], "is required");
    else if (type === "string") requireString(defaults[key], ["defaults", key]);
    else requireNumber(defaults[key], ["defaults", key], { min: 1 });
  });

  if (isPlainObject(config.bookSizes) && typeof defaults.bookSize === "string") {
    if (!config.bookSizes[defaults.bookSize]) {
      addError(["defaults", "bookSize"], `must match a bookSizes key; got "${defaults.bookSize}"`);
    } else if (typeof defaults.imageSize === "string") {
      const sizes = config.bookSizes[defaults.bookSize].sizes || [];
      if (!sizes.some((size) => size && size.value === defaults.imageSize)) {
        addError(["defaults", "imageSize"], `must match a size value in bookSizes.${defaults.bookSize}`);
      }
    }
  }

  if (isPlainObject(config.mapStyles) && typeof config.defaultMapStylePreset === "string" && !config.mapStyles[config.defaultMapStylePreset]) {
    addError(["defaultMapStylePreset"], `must match a mapStyles key; got "${config.defaultMapStylePreset}"`);
  }
}

function validatePerformanceBudgets(budgets) {
  if (budgets === undefined) return;
  if (!requireObject(budgets, ["performanceBudgets"])) return;
  ["renderMs", "autoPlaceMs", "exportMs"].forEach((key) => {
    if (!(key in budgets)) addError(["performanceBudgets", key], "is required");
    else requireNumber(budgets[key], ["performanceBudgets", key], { min: 1 });
  });
  if (!("sampleWindow" in budgets)) addError(["performanceBudgets", "sampleWindow"], "is required");
  else requireNumber(budgets.sampleWindow, ["performanceBudgets", "sampleWindow"], { min: 5, max: 100 });
}

function validateBookSizes(bookSizes) {
  if (!requireObject(bookSizes, ["bookSizes"])) return;
  Object.entries(bookSizes).forEach(([bookKey, book]) => {
    const bookPath = ["bookSizes", bookKey];
    if (!requireObject(book, bookPath)) return;
    requireString(book.label, bookPath.concat("label"));
    if (!requireArray(book.sizes, bookPath.concat("sizes"))) return;
    if (!book.sizes.length) addError(bookPath.concat("sizes"), "must include at least one image size");
    validateUnique(book.sizes, (size) => size && size.value, bookPath.concat("sizes"), "size value");
    book.sizes.forEach((size, index) => {
      const sizePath = bookPath.concat("sizes", index);
      if (!requireObject(size, sizePath)) return;
      requireString(size.value, sizePath.concat("value"));
      requireString(size.label, sizePath.concat("label"));
      requireNumber(size.width, sizePath.concat("width"), { min: 1 });
      requireNumber(size.height, sizePath.concat("height"), { min: 1 });
    });
  });
}

function validateFonts(fonts) {
  if (!requireArray(fonts, ["fonts"])) return;
  validateUnique(fonts, (font) => font && font.value, ["fonts"], "font value");
  fonts.forEach((font, index) => {
    const fontPath = ["fonts", index];
    if (!requireObject(font, fontPath)) return;
    requireString(font.label, fontPath.concat("label"));
    requireString(font.value, fontPath.concat("value"));
    if (font.stylesheet !== undefined) {
      requireString(font.stylesheet, fontPath.concat("stylesheet"));
      validateLocalFile(font.stylesheet, fontPath.concat("stylesheet"));
    }
  });
}

function validateColourPresets(presets) {
  if (!requireArray(presets, ["categoryColourPresets"])) return;
  validateUnique(presets, (preset) => preset && preset.label, ["categoryColourPresets"], "preset label");
  presets.forEach((preset, index) => {
    const presetPath = ["categoryColourPresets", index];
    if (!requireObject(preset, presetPath)) return;
    requireString(preset.label, presetPath.concat("label"));
    validateColour(preset.value, presetPath.concat("value"), { allowEmpty: true });
  });
}

function validateCategoryStyle(style, parts) {
  if (!requireObject(style, parts)) return;
  validateColour(style.colour, parts.concat("colour"));
  validateColour(style.stroke, parts.concat("stroke"));
  requireNumber(style.markerSize, parts.concat("markerSize"), { min: 1 });
  requireNumber(style.lineWidth, parts.concat("lineWidth"), { min: 0 });
}

function validateMapStyles(mapStyles) {
  if (!requireObject(mapStyles, ["mapStyles"])) return;
  Object.entries(mapStyles).forEach(([styleKey, style]) => {
    const stylePath = ["mapStyles", styleKey];
    if (!requireObject(style, stylePath)) return;
    requireString(style.label, stylePath.concat("label"));
    requireString(style.stylesheet, stylePath.concat("stylesheet"));
    validateLocalFile(style.stylesheet, stylePath.concat("stylesheet"));
    if (requireArray(style.regionColours, stylePath.concat("regionColours"))) {
      if (!style.regionColours.length) addError(stylePath.concat("regionColours"), "must include at least one colour");
      style.regionColours.forEach((colour, index) => validateColour(colour, stylePath.concat("regionColours", index)));
    }
    if (requireArray(style.categoryStyles, stylePath.concat("categoryStyles"))) {
      style.categoryStyles.forEach((categoryStyle, index) => validateCategoryStyle(categoryStyle, stylePath.concat("categoryStyles", index)));
    }
  });
}

function validateCategories(categories) {
  if (!requireArray(categories, ["categories"])) return;
  if (!categories.length) addError(["categories"], "must include at least one category");
  validateUnique(categories, (category) => category && category.id, ["categories"], "category id");
  validateUnique(categories, (category) => category && category.label, ["categories"], "category label");
  categories.forEach((category, index) => {
    const categoryPath = ["categories", index];
    if (!requireObject(category, categoryPath)) return;
    requireString(category.id, categoryPath.concat("id"));
    requireString(category.label, categoryPath.concat("label"));
    requireString(category.defaultLabel, categoryPath.concat("defaultLabel"));
    requireString(category.shape, categoryPath.concat("shape"));
    validateColour(category.colour, categoryPath.concat("colour"));
    validateColour(category.stroke, categoryPath.concat("stroke"));
    requireNumber(category.markerSize, categoryPath.concat("markerSize"), { min: 1 });
    requireNumber(category.lineWidth, categoryPath.concat("lineWidth"), { min: 0 });
  });
}

function validateSampleRows(sampleRows, categories) {
  if (!requireArray(sampleRows, ["sampleRows"])) return;
  const categoryLabels = new Set((Array.isArray(categories) ? categories : []).map((category) => category && category.label).filter(Boolean));
  sampleRows.forEach((row, index) => {
    const rowPath = ["sampleRows", index];
    if (!requireObject(row, rowPath)) return;
    requireString(row.name, rowPath.concat("name"));
    requireString(row.type, rowPath.concat("type"));
    if (categoryLabels.size && typeof row.type === "string" && !categoryLabels.has(row.type)) {
      addWarning(rowPath.concat("type"), `does not match a configured category label: "${row.type}"`);
    }
    const hasLon = row.lon !== "" && row.lon !== null && row.lon !== undefined;
    const hasLat = row.lat !== "" && row.lat !== null && row.lat !== undefined;
    if (hasLon !== hasLat) {
      addError(rowPath, "lon and lat must both be blank or both be numeric");
    }
    if (hasLon) requireNumber(row.lon, rowPath.concat("lon"));
    if (hasLat) requireNumber(row.lat, rowPath.concat("lat"));
  });
}

function validateConfig(config) {
  if (!requireObject(config, ["config"])) return;
  requireString(config.name, ["name"]);
  requireString(config.defaultFontFamily, ["defaultFontFamily"]);
  requireString(config.defaultMapStylePreset, ["defaultMapStylePreset"]);
  validateDefaults(config);
  validatePerformanceBudgets(config.performanceBudgets);
  validateBookSizes(config.bookSizes);
  validateFonts(config.fonts);
  validateColourPresets(config.categoryColourPresets);
  validateMapStyles(config.mapStyles);
  validateCategories(config.categories);
  validateSampleRows(config.sampleRows, config.categories);
}

function main() {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    console.error(`Could not read config: ${configPath}`);
    console.error(error.message);
    process.exit(1);
  }

  validateConfig(config);

  warnings.forEach((warning) => console.warn(`Warning: ${warning}`));

  if (errors.length) {
    console.error(`Plotypus config validation failed for ${path.relative(repoRoot, configPath)}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Plotypus config validation passed: ${path.relative(repoRoot, configPath)}`);
}

main();
