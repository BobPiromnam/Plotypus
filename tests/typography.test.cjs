const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const style = read("styles/app.css");
const html = read("index.html");
const properties = read("src/properties.js");
const referenceCities = read("src/reference-cities.js");
const productionMarkup = [
  "index.html",
  "src/app.js",
  "src/config.js",
  "src/geometry.js",
  "src/i18n.js",
  "src/icons.js",
  "src/label-layout.js",
  "src/presets.js",
  "src/project-file.js",
  "src/project-io.js",
  "src/properties.js",
  "src/reference-cities.js",
  "src/region-matching.js",
  "src/workspace.js",
  "src/lib/xlsx-lite.js"
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
  assert.equal((html.match(/<h2 class="workspace-title type-panel-title" data-i18n="(?:project|region|translate|preview|quality)\.intro\.title"/g) || []).length, 5);
  assert.equal((html.match(/<p class="type-supporting" data-i18n="(?:project|region|translate|preview|quality)\.intro\.body"/g) || []).length, 5);
  assert.match(html, /id="propertiesTitle" class="type-panel-title"/);
  assert.match(html, /id="startupTitle" class="type-dialog-title"/);
  assert.match(html, /id="mapDetailsTitle" class="type-dialog-title"/);
  assert.match(properties, /<summary class="properties-accordion-summary type-summary-heading">/);
  assert.match(properties, /<h3 class="type-eyebrow">/);
  assert.match(referenceCities, /class="refCityInput type-control"/);
  assert.match(referenceCities, /class="refCityHint type-caption"/);
  assert.match(html, /class="data-table project-data-table"/);
  assert.match(html, /class="data-table region-data-table"/);
  assert.match(html, /class="project-filter-select type-control"/);
  assert.match(html, /class="map-canvas"/);
  assert.match(html, /class="ribbon-button ribbon-icon-only properties-toggle-button"/);
});

test("production templates contain no inline style attributes", () => {
  productionMarkup.forEach(({ file, source }) => {
    assert.doesNotMatch(source, /\sstyle\s*=\s*["']/i, file);
    assert.doesNotMatch(source, /\.style\.font(?:Family|Size|Style|Weight)/, file);
    assert.doesNotMatch(source, /\.style\.setProperty\(\s*["']--?(?:font|text|type)/, file);
  });
});

test("map typography is assigned by stylesheet classes rather than element font declarations", () => {
  const app = read("src/app.js");
  assert.doesNotMatch(app, /\.style\(\s*["']font-/);
  assert.doesNotMatch(app, /\.style\.font(?:Family|Size|Style|Weight)/);
  assert.doesNotMatch(app, /\.attr\(\s*["']font-(?:size|family|weight|style)/);
  assert.doesNotMatch(app, /setAttribute\(\s*["']font-(?:size|family|weight|style)/);
  assert.doesNotMatch(app, /font-(?:size|family|weight|style)\s*=/);
  assert.match(app, /mapTypographySizeClass/);
  assert.match(style, /\.map-canvas\.map-font-lato text/);
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
  const properties = read("src/properties.js");
  assert.doesNotMatch(properties, /numericStyle/);
  assert.match(properties, /type-numeric-data property-numeric-input/g);
  assert.match(style, /\.type-numeric-data\s*\{[^}]*font-size:\s*var\(--type-control-size\);[^}]*font-weight:\s*var\(--font-weight-data-medium\);[^}]*line-height:\s*var\(--type-control-line\);/s);
  assert.match(style, /\.property-numeric-input\s*\{[^}]*text-align:\s*right/s);
});

test("Properties typography roles are owned by reusable component classes", () => {
  assert.match(style, /\.properties-form label:not\(\.toolbar-check\)\s*\{[^}]*font-weight:\s*var\(--font-weight-regular\);/s);
  assert.match(style, /\.properties-field-label\s*\{[^}]*font-size:\s*var\(--type-control-size\);[^}]*font-weight:\s*var\(--font-weight-regular\);[^}]*line-height:\s*var\(--type-control-line\);/s);
  assert.match(style, /\.type-numeric-data\s*\{[^}]*font-weight:\s*var\(--font-weight-data-medium\);[^}]*line-height:\s*var\(--type-control-line\);/s);
  assert.match(properties, /class="property-draft-readout type-caption" data-marker-size-readout/);
  assert.match(properties, /class="property-draft-readout type-caption" data-leader-line-width-readout/);
  assert.match(style, /\.property-draft-readout\s*\{[^}]*font-weight:\s*var\(--font-weight-bold\);/s);
  assert.doesNotMatch(style, /\.document-property-section[^}]*font-(?:family|size|weight)|\.leader-line-property-section[^}]*\.properties-field-label/s);
});
