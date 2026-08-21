const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const style = fs.readFileSync(path.join(root, "styles", "app.css"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const inventory = fs.readFileSync(path.join(root, "docs", "button-inventory.html"), "utf8");
const i18n = fs.readFileSync(path.join(root, "src", "i18n.js"), "utf8");
const referenceCities = fs.readFileSync(path.join(root, "src", "reference-cities.js"), "utf8");
const {
  auditCss,
  auditDuplicateDeclarations,
  auditIdTypography,
  auditImportantOutsideAllowlist,
  auditImportantWithoutComments,
  auditSemanticTypographyOverrides
} = require(path.join(root, "tools", "css-selector-audit.cjs"));

test("CSS selectors and root tokens are consolidated", () => {
  assert.deepEqual(auditCss(style), []);
  assert.deepEqual(auditDuplicateDeclarations(style), []);
  assert.deepEqual(auditImportantWithoutComments(style), []);
  assert.equal((style.slice(0, style.indexOf("@media")).match(/^:root\s*\{/gm) || []).length, 1);
  assert.equal((style.match(/^\.icon-button\s*\{/gm) || []).length, 1);
  assert.match(style, /\.btn-icon,\s*\.icon-button\s*\{[^}]*width:\s*var\(--control-h\);[^}]*height:\s*var\(--control-h\);/s);
  assert.equal((style.match(/^\.table-tab\s*\{/gm) || []).length, 1);
  assert.equal((style.match(/^\.properties-panel\s*\{/gm) || []).length, 1);
  assert.doesNotMatch(style, /\.workspace-intro h2/);
});

test("typography and forced overrides stay on reusable contracts", () => {
  assert.deepEqual(auditIdTypography(style), []);
  assert.deepEqual(auditSemanticTypographyOverrides(style), []);
  assert.deepEqual(auditImportantOutsideAllowlist(style, new Set(["[hidden]", ".visually-hidden"])), []);
});

test("the control-height scale has only frequent, compact, and passive sizes", () => {
  assert.match(style, /--control-h:\s*44px;/);
  assert.match(style, /--control-h-compact:\s*36px;/);
  assert.match(style, /--chip-h:\s*28px;/);
  assert.doesNotMatch(style, /--control-h-(?:xs|sm|md|lg|xl)\s*:/);
});

test("shape, grouped controls, and motion use the shared semantic contracts", () => {
  assert.match(style, /--radius-detail:\s*4px;/);
  assert.match(style, /--radius-control:\s*6px;/);
  assert.match(style, /--radius-group:\s*8px;/);
  assert.match(style, /--radius-surface:\s*8px;/);
  assert.match(style, /--radius-dialog:\s*14px;/);
  assert.match(style, /--motion-fast:\s*120ms;/);
  assert.match(style, /--motion-base:\s*160ms;/);
  assert.match(style, /--motion-slow:\s*220ms;/);
  assert.doesNotMatch(style, /border-radius:\s*\d+(?:\.\d+)?px/);
  assert.doesNotMatch(style, /transition:\s*[^;]*\d+(?:\.\d+)?m?s/);
  assert.match(style, /\.ui-control-group\s*\{[^}]*min-height:\s*46px;[^}]*border-radius:\s*var\(--radius-group\);/s);
  assert.match(style, /\.ui-control-group\s*>\s*button,[^}]*height:\s*38px;[^}]*border-radius:\s*var\(--radius-control\);/s);
  assert.match(style, /\.ui-control-group\s*>\s*button\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*padding-inline:\s*var\(--space-7\);/s);
  assert.match(style, /\.ui-control-group\s*>\s*\.control-group-label,[^}]*min-height:\s*38px;[^}]*align-items:\s*center;/s);
  assert.match(style, /\.ui-floating-surface:not\(\[hidden\]\)\s*\{[^}]*ui-surface-fade/s);
  assert.match(style, /\.properties-accordion\[open\]\s*>\s*\.properties-accordion-body\s*\{[^}]*ui-content-reveal/s);
  assert.match(style, /\.map-tab-language-toggle\s*\{[^}]*border-radius:\s*var\(--radius-group\);/s);
  assert.match(style, /\.annotation-segmented\s*\{[^}]*border-radius:\s*var\(--radius-group\);/s);
  assert.match(style, /\.legend-item-menu\s*\{[^}]*border-radius:\s*var\(--radius-surface\);/s);
  assert.match(style, /\.startup-setup-fields select,[^}]*border-radius:\s*var\(--radius-control\);/s);
  assert.match(style, /\.feedback-privacy\s*\{[^}]*border-radius:\s*var\(--radius-surface\);/s);
  assert.match(style, /\.project-save-state\s*\{[^}]*border-radius:\s*var\(--radius-pill\);/s);
  assert.match(style, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*transition-duration:\s*0\.01ms;[\s\S]*animation-duration:\s*0\.01ms;/);
  assert.match(index, /class="translate-filters ui-control-group"/);
  assert.match(index, /class="translate-add-section ui-control-group"/);
  assert.match(index, /class="application-settings-menu ui-floating-surface"/);
  assert.match(referenceCities, /class="refCityResults(?: cityLocationResults)? ui-floating-surface"/);
  assert.doesNotMatch(style, /\.translate-add-section\s*\{[^}]*radius-pill/s);
});

test("workspace headings and adjacent controls use one shared spacing contract", () => {
  assert.match(style, /--workspace-intro-padding-top:\s*var\(--space-4\);/);
  assert.match(style, /--workspace-intro-padding-bottom:\s*var\(--space-4\);/);
  assert.match(style, /--workspace-intro-copy-gap:\s*var\(--space-1\);/);
  assert.match(style, /--workspace-rail-padding-block:\s*var\(--space-7\);/);
  assert.match(style, /\.workspace-intro\s*\{[^}]*padding:\s*var\(--workspace-intro-padding-top\) var\(--workspace-gutter\) var\(--workspace-intro-padding-bottom\);/s);
  assert.match(style, /\.workspace-rail\s*\{[^}]*padding:\s*var\(--workspace-rail-padding-block\) var\(--workspace-gutter\);/s);
  assert.match(style, /\.quality-workspace-content\s*\{[^}]*padding:\s*var\(--workspace-rail-padding-block\) var\(--workspace-gutter\) var\(--space-10\);/s);
  assert.match(style, /body\[data-workspace-view="translate"\] \.translation-groups\s*\{[^}]*padding:\s*var\(--space-12\) var\(--workspace-gutter\);/s);
  assert.doesNotMatch(style, /^body\[data-workspace-view="projects"\] \.workspace-rail\s*\{[^}]*padding:/ms);
  assert.doesNotMatch(style, /^\.translate-header\.workspace-rail\s*\{[^}]*padding:/ms);
  assert.match(style, /@container project-workspace \(max-width: 2200px\)\s*\{[\s\S]*grid-template-areas:\s*"search filter add more"\s*"location location authoring authoring"/);
});

test("responsive CSS uses the four documented layout boundaries", () => {
  const widths = [...style.matchAll(/^@media \(max-width: (\d+)px\)/gm)].map(match => Number(match[1]));
  assert.deepEqual(widths, [1280, 1080, 840, 620]);
  assert.match(style, /1280px — narrow the docked Properties layout/);
  assert.match(style, /1080px — collapse lower-priority toolbar groups/);
  assert.match(style, /840px\s+— switch workspaces and dialogs to a single-column layout/);
  assert.match(style, /620px\s+— use the compact phone layout/);
});

test("the canonical button inventory covers all seven jobs", () => {
  for (const name of ["primary", "default", "danger", "quiet", "icon", "toggle", "card"]) {
    assert.match(style, new RegExp(`\\.btn-${name}\\b`), name);
    assert.match(inventory, new RegExp(`class="btn-${name}(?: |")`), name);
  }
  assert.match(inventory, /<th>Rest<\/th><th>Hover<\/th><th>Focus<\/th><th>Disabled<\/th><th>Active<\/th>/);
});

test("English prose no longer uses spaced ASCII hyphens as dashes", () => {
  assert.doesNotMatch(i18n, / - /);
});
