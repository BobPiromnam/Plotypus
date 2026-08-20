const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");
const inventory = fs.readFileSync(path.join(root, "docs", "button-inventory.html"), "utf8");
const i18n = fs.readFileSync(path.join(root, "i18n.js"), "utf8");
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
