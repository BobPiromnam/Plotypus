const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const style = read("style.css");
const html = read("index.html");
const properties = read("properties.js");
const referenceCities = read("reference-cities.js");
const productionMarkup = [
  "index.html",
  "app.js",
  "config.js",
  "geometry.js",
  "i18n.js",
  "icons.js",
  "label-layout.js",
  "presets.js",
  "project-file.js",
  "project-io.js",
  "properties.js",
  "reference-cities.js",
  "region-matching.js",
  "workspace.js",
  "xlsx-lite.js"
]
  .map(file => ({ file, source: read(file) }));

function cssToken(name) {
  const match = style.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  return match ? match[1].trim() : "";
}

test("application typography exposes the shared semantic scale", () => {
  const expected = {
    "type-display-size": "30px",
    "type-page-title-size": "28px",
    "type-dialog-title-size": "24px",
    "type-panel-title-size": "22px",
    "type-card-title-size": "18px",
    "type-summary-size": "16px",
    "type-control-size": "15px",
    "type-supporting-size": "14px",
    "type-caption-size": "13px",
    "type-eyebrow-size": "12px",
    "type-body-size": "var(--type-control-size)",
    "type-h6-size": "var(--type-supporting-size)",
    "type-h5-size": "var(--type-control-size)",
    "type-h4-size": "var(--type-summary-size)",
    "type-h3-size": "var(--type-panel-title-size)",
    "type-h2-size": "var(--type-page-title-size)",
    "type-h1-size": "var(--type-display-size)"
  };
  Object.entries(expected).forEach(([name, value]) => {
    assert.equal(cssToken(name), value, `--${name}`);
  });
  assert.match(style, /body\s*\{[^}]*font-size:\s*var\(--type-body-size\)/s);
  for (let level = 1; level <= 6; level += 1) {
    assert.match(style, new RegExp(`h${level}\\s*\\{[^}]*font-size:\\s*var\\(--type-h${level}-size\\)[^}]*line-height:\\s*var\\(--type-h${level}-line\\)`, "s"), `h${level}`);
  }
});

test("legacy component aliases resolve through the shared typography scale", () => {
  assert.equal(cssToken("text-2xs"), "var(--type-eyebrow-size)");
  assert.equal(cssToken("text-xs"), "var(--type-caption-size)");
  assert.equal(cssToken("text-sm"), "var(--type-supporting-size)");
  assert.equal(cssToken("text-ui"), "var(--type-control-size)");
  assert.equal(cssToken("text-body"), "var(--type-body-size)");
  assert.equal(cssToken("text-control"), "var(--type-control-size)");
  assert.equal(cssToken("text-md"), "var(--type-summary-size)");
  assert.equal(cssToken("text-lg"), "var(--type-card-title-size)");
  assert.equal(cssToken("text-title"), "var(--type-dialog-title-size)");
  assert.equal(cssToken("text-heading"), "var(--type-page-title-size)");
  assert.equal(cssToken("text-display"), "var(--type-display-size)");
});

test("semantic typography classes declare intent across static and generated UI", () => {
  for (const className of [
    "type-display",
    "type-page-title",
    "type-dialog-title",
    "type-panel-title",
    "type-card-title",
    "type-summary-heading",
    "type-control",
    "type-control-label",
    "type-body",
    "type-supporting",
    "type-caption",
    "type-eyebrow",
    "type-data"
  ]) {
    assert.match(style, new RegExp(`\\.${className}\\b`), className);
  }
  assert.equal((html.match(/workspace-eyebrow type-eyebrow/g) || []).length, 6);
  assert.equal((html.match(/class="type-page-title"/g) || []).length, 5);
  assert.match(html, /id="propertiesTitle" class="type-panel-title"/);
  assert.match(html, /id="startupTitle" class="type-display"/);
  assert.match(html, /id="mapDetailsTitle" class="type-dialog-title"/);
  assert.match(properties, /<summary class="type-summary-heading">/);
  assert.match(properties, /<h3 class="type-eyebrow">/);
  assert.match(referenceCities, /class="refCityInput type-control"/);
  assert.match(referenceCities, /class="refCityHint type-caption"/);
});

test("production templates contain no inline style attributes", () => {
  productionMarkup.forEach(({ file, source }) => {
    assert.doesNotMatch(source, /\sstyle\s*=\s*["']/i, file);
    assert.doesNotMatch(source, /\.style\.font(?:Family|Size|Style|Weight)/, file);
    assert.doesNotMatch(source, /\.style\.setProperty\(\s*["']--?(?:font|text|type)/, file);
  });
});

test("map typography is assigned by stylesheet classes rather than element font declarations", () => {
  const app = read("app.js");
  assert.doesNotMatch(app, /\.style\(\s*["']font-/);
  assert.doesNotMatch(app, /\.style\.font(?:Family|Size|Style|Weight)/);
  assert.doesNotMatch(app, /\.attr\(\s*["']font-(?:size|family|weight|style)/);
  assert.doesNotMatch(app, /setAttribute\(\s*["']font-(?:size|family|weight|style)/);
  assert.doesNotMatch(app, /font-(?:size|family|weight|style)\s*=/);
  assert.match(app, /mapTypographySizeClass/);
  assert.match(style, /#mapSvg\.map-font-lato text/);
  for (let value = 2; value <= 40; value += 0.5) {
    const token = String(value).replace(".", "-");
    const escapedValue = String(value).replace(".", "\\.");
    assert.match(style, new RegExp(`\\.map-type-size-${token}\\s*\\{\\s*font-size:\\s*${escapedValue}px;`, "s"), `map font-size ${value}px`);
  }
  assert.match(app, /\$\{getMapTypographyExportCss\("px"\)\}/);
  assert.doesNotMatch(app, /getMapTypographyExportCss\([^)]*"pt"/);
});

test("application typography uses only supported top-level weight tokens", () => {
  assert.equal(cssToken("font-weight-regular"), "400");
  assert.equal(cssToken("font-weight-bold"), "700");
  assert.equal(cssToken("font-weight-data-medium"), "500");
  assert.equal(cssToken("font-weight-data-semibold"), "600");
  assert.doesNotMatch(style, /font(?:-weight)?\s*:\s*800\b/);
});

test("generated numeric property fields use the shared data typography class", () => {
  const properties = read("properties.js");
  assert.doesNotMatch(properties, /numericStyle/);
  assert.match(properties, /type-numeric-data property-numeric-input/g);
  assert.match(style, /\.property-numeric-input\s*\{[^}]*text-align:\s*right/s);
});
