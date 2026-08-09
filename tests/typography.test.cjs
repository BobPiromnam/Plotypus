const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const style = read("style.css");
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
  "region-matching.js",
  "workspace.js",
  "xlsx-lite.js"
]
  .map(file => ({ file, source: read(file) }));

function cssToken(name) {
  const match = style.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  return match ? match[1].trim() : "";
}

test("application typography exposes the approved 18px body and heading scale", () => {
  const expected = {
    "type-body-size": "18px",
    "type-body-line": "26px",
    "type-h6-size": "18px",
    "type-h6-line": "24px",
    "type-h5-size": "20px",
    "type-h5-line": "25px",
    "type-h4-size": "23px",
    "type-h4-line": "28px",
    "type-h3-size": "27px",
    "type-h3-line": "32px",
    "type-h2-size": "32px",
    "type-h2-line": "38px",
    "type-h1-size": "40px",
    "type-h1-line": "46px"
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
  assert.equal(cssToken("text-2xs"), "var(--type-body-size)");
  assert.equal(cssToken("text-body"), "var(--type-body-size)");
  assert.equal(cssToken("text-control"), "var(--type-body-size)");
  assert.equal(cssToken("text-md"), "var(--type-h5-size)");
  assert.equal(cssToken("text-lg"), "var(--type-h4-size)");
  assert.equal(cssToken("text-title"), "var(--type-h3-size)");
  assert.equal(cssToken("text-heading"), "var(--type-h2-size)");
  assert.equal(cssToken("text-display"), "var(--type-h1-size)");
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
