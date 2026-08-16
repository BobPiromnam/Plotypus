const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const app = read("app.js");
const html = read("index.html");
const icons = read("icons.js");
const i18n = read("i18n.js");
const properties = read("properties.js");
const style = read("style.css");

function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
  const linear = channels.map(channel => channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

test("Properties uses contextual availability and progressive disclosure", () => {
  assert.match(app, /function getAdaptivePropertiesMode\([\s\S]*activeDataTable === "projects"[\s\S]*"unavailable"/);
  assert.match(app, /document\.body\.classList\.toggle\("properties-unavailable", unavailable\)/);
  assert.match(app, /els\.propertiesToggleBtn\.hidden = unavailable/);
  assert.match(app, /syncPropertiesAccordions/);
  assert.match(html, /details id="legendPropertiesSection"[^>]*data-properties-accordion="legend"[^>]*open/);
  for (const section of ["map-style", "map-size", "leader-lines"]) {
    assert.match(properties, new RegExp(`data-properties-accordion="${section}"`), section);
  }
  assert.doesNotMatch(properties, /data-properties-accordion="baselayer"/);
  assert.match(html, /id="regionTablePane"[\s\S]*class="region-reference-cities-panel workspace-rail"[\s\S]*id="referenceCitiesBaselayerField"/);
});

test("Legend rows keep drag affordance and consolidate actions into a menu", () => {
  assert.match(app, /class="category-drag-handle icon-button" draggable="true"/);
  assert.match(app, /class="legend-item-menu-button icon-button"[^>]*aria-haspopup="menu"/);
  assert.match(app, /class="legend-item-menu" role="menu" hidden/);
  assert.match(app, /class="move-category-up-btn"[^>]*role="menuitem"/);
  assert.match(app, /class="remove-category-btn is-danger"[^>]*role="menuitem"/);
  assert.match(app, /classList\.toggle\("is-menu-open", open\)/);
  assert.match(app, /classList\.remove\("is-menu-open"\)/);
  assert.match(style, /\.legend-item\.is-menu-open\s*\{[^}]*z-index:\s*40/s);
});

test("Legend marker previews remain legible at small map-marker sizes", () => {
  assert.match(app, /const previewRadius = Math\.max\(6, Math\.min\(12, markerSize\)\)/);
  assert.match(app, /class="category-marker-preview" viewBox="0 0 28 28"/);
  assert.match(style, /\.category-swatch svg\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;/s);
});

test("empty map, search, read-first rows, and save feedback are present", () => {
  for (const id of ["projectSaveState", "projectSearchInput", "canvasEmptyActions"]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  for (const action of ["add-project", "import-csv", "load-sample"]) {
    assert.match(html, new RegExp(`data-empty-action="${action}"`), action);
  }
  assert.match(app, /function setProjectSaveState/);
  assert.match(app, /function setProjectSearch/);
  assert.match(app, /control\.readOnly = !isActive/);
  assert.match(app, /control\.tabIndex = isActive \? 0 : -1/);
});

test("empty-map actions use an even visual rhythm", () => {
  assert.match(style, /\.canvas-empty-actions\s*\{[^}]*gap:\s*0/s);
  assert.match(style, /\.canvas-empty-icon\s*\{[^}]*margin-bottom:\s*var\(--space-6\)/s);
  assert.match(style, /\.canvas-empty-actions > strong\s*\{[^}]*margin-bottom:\s*var\(--space-4\)/s);
  assert.match(style, /\.canvas-empty-actions \.empty-state-actions\s*\{[^}]*gap:\s*var\(--space-6\)[^}]*margin-top:\s*var\(--space-8\)/s);
  assert.match(style, /\.canvas-empty-actions button\.text-action\s*\{[^}]*min-height:\s*var\(--control-h-lg\)[^}]*padding-inline:\s*0/s);
});

test("secondary workspace summaries and quality arrows are not duplicated", () => {
  assert.match(app, /activeDataTable === "regions"[\s\S]*return "unavailable"/);
  assert.doesNotMatch(i18n, /Locate[^"\n]*->|Localiser[^"\n]*->/);
  assert.match(style, /button\.text-action::after\s*\{[^}]*content:\s*"›"/s);
});

test("responsive layout stacks the splash and moves lower-priority project controls", () => {
  assert.match(style, /@media \(max-width: 1050px\)[\s\S]*\.project-location-mode[\s\S]*display:\s*none/);
  assert.match(style, /@media \(max-width: 840px\)[\s\S]*\.startup-choice-groups\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(html, /class="project-responsive-menu-groups"/);
});

test("workspace navigation shows points plus geography as the composed map", () => {
  assert.match(html, /id="previewTableTab"[^>]*data-icon="map-preview"/);
  assert.match(html, /id="projectTableTab"[^>]*data-icon="map-pin"/);
  assert.match(html, /id="regionTableTab"[^>]*data-icon="baselayer"/);
  assert.match(icons, /"map-preview":\s*\[[\s\S]*?<path d="M17 7c0 3\.4-5 7\.5-5 7\.5S7 10\.4 7 7a5 5 0 1 1 10 0Z" fill="currentColor" stroke="var\(--panel\)" stroke-width="1\.5"\/>/);
  assert.match(icons, /baselayer:\s*\[[\s\S]*?<path d="M15 6v15"\/>/);
});

test("Boxes and Interaction controls use the compact Properties type scale", () => {
  assert.match(style, /\.properties-panel \.properties-control-list \.toolbar-check\s*\{[^}]*min-height:\s*var\(--control-h-sm\);[^}]*font-size:\s*var\(--properties-text-control\);[^}]*line-height:\s*var\(--line-ui\);/s);
});

test("Properties accordion summaries retain heading hierarchy", () => {
  assert.match(style, /\.properties-panel\s*\{[^}]*--properties-text-summary:\s*16px;[^}]*--properties-text-control:\s*15px;[^}]*--properties-text-supporting:\s*14px;[^}]*--properties-text-caption:\s*13px;/s);
  assert.match(style, /\.properties-accordion > summary\s*\{[^}]*min-height:\s*var\(--control-h-lg\);[^}]*color:\s*var\(--accent-dark\);[^}]*font-size:\s*var\(--properties-text-summary\);[^}]*font-weight:\s*700;[^}]*line-height:\s*var\(--line-ui\);/s);
});

test("offline city provenance uses a structured citation treatment", () => {
  assert.match(html, /class="application-settings-citation" role="note"/);
  assert.match(html, /class="application-settings-citation-list"/);
  assert.match(html, /data-i18n="settings\.cityData\.offlineNote"/);
  assert.match(style, /\.application-settings-citation\s*\{[^}]*border-left:\s*3px solid var\(--accent\);[^}]*background:\s*var\(--surface-subtle\);/s);
});

test("new compact surfaces retain WCAG AA text and non-text contrast", () => {
  const white = "#ffffff";
  assert.ok(contrastRatio("#755200", white) >= 4.5, "unsaved text");
  assert.ok(contrastRatio("#56675e", white) >= 4.5, "empty-state body text");
  assert.ok(contrastRatio("#365e52", white) >= 4.5, "text action");
  assert.ok(contrastRatio("#9a4b3f", white) >= 4.5, "destructive menu action");
  assert.ok(contrastRatio("#84978e", white) >= 3, "search control boundary");
  assert.match(style, /\.properties-accordion > summary:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--accent\)/s);
  assert.match(style, /#projectTable tbody tr:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--accent\)/s);
});
